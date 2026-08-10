import type { ReactElement } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { useCalendarStore } from '../../store/calendarStore';
import { toDateKey } from '../../utils/dateUtils';

const timeSlots = ['Ideas', 'Morning', 'Afternoon', 'Evening'];
/** Renders a creator-focused seven-day planning matrix. */
export function WeekView(): ReactElement {
  const { currentDate, selectedDateKey, selectDate } = useCalendarStore(); const start = startOfWeek(currentDate, { weekStartsOn: 1 }); const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  return <div className="week-view"><div className="week-days"><span/><>{days.map((day) => <button key={toDateKey(day)} className={selectedDateKey === toDateKey(day) ? 'active' : ''} onClick={() => selectDate(toDateKey(day))}><small>{format(day, 'EEE')}</small><strong>{format(day, 'd')}</strong></button>)}</></div>{timeSlots.map((slot) => <div className="time-row" key={slot}><span>{slot}</span>{days.map((day) => <button key={toDateKey(day)} onClick={() => selectDate(toDateKey(day))} aria-label={`${slot}, ${format(day, 'EEEE')}`}><i/></button>)}</div>)}</div>;
}
