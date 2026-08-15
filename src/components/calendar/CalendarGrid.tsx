import { useEffect, type ReactElement } from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/dexieClient';
import { dbUgc } from '../../lib/dexieUgcClient';
import { chooseNewest } from '../../lib/syncEngine';
import { neon } from '../../lib/neonClient';
import { useCalendarStore } from '../../store/calendarStore';
import { fromDateKey, toDateKey } from '../../utils/dateUtils';
import type { DailyData } from '../../types';
import { CalendarDay } from './CalendarDay';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
interface CalendarGridProps { userId: string }
/** Renders the 7-column month grid and prefetches visible cloud history. */
export function CalendarGrid({ userId }: CalendarGridProps): ReactElement {
  const { currentDate, selectedDateKey, selectDate } = useCalendarStore();
  const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }); const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }); const days = eachDayOfInterval({ start, end });
  const rows = useLiveQuery(() => db.daily_data.where('user_id').equals(userId).and((row) => row.date_key >= toDateKey(start) && row.date_key <= toDateKey(end)).toArray(), [userId, toDateKey(start), toDateKey(end)]) ?? [];
  const dueCards = useLiveQuery(() => dbUgc.production_board.where('user_id').equals(userId).and((card) => !!card.due_date && card.due_date >= toDateKey(start) && card.due_date <= toDateKey(end) && card.column_name !== 'published').toArray(), [userId, toDateKey(start), toDateKey(end)]) ?? [];
  const dueCounts = new Map<string, number>();
  for (const card of dueCards) { const k = card.due_date!; dueCounts.set(k, (dueCounts.get(k) ?? 0) + 1); }
  useEffect(() => { void neon.from('daily_data').select('*').eq('user_id', userId).gte('date_key', toDateKey(start)).lte('date_key', toDateKey(end)).then(async ({ data }) => { for (const remote of (data ?? []) as DailyData[]) { const local = await db.daily_data.get([userId, remote.date_key]); await db.daily_data.put(chooseNewest(local, remote)); } }); }, [userId, currentDate.getFullYear(), currentDate.getMonth()]);
  const byDate = new Map(rows.map((row) => [row.date_key, row]));
  return <div className="calendar-wrap"><div className="weekday-row">{weekdays.map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{days.map((day) => { const key = toDateKey(day); return <CalendarDay key={key} date={day} month={currentDate} selected={fromDateKey(selectedDateKey)} record={byDate.get(key)} due={dueCounts.get(key) ?? 0} onSelect={() => selectDate(key)} />; })}</div></div>;
}
