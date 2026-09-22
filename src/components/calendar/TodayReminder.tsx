import { useEffect, useState, type ReactElement } from 'react';
import { Check, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dbUgc } from '../../lib/dexieUgcClient';
import { useDailyData } from '../../hooks/useDailyData';
import { useCalendarStore } from '../../store/calendarStore';
import { toDateKey } from '../../utils/dateUtils';

interface TodayReminderProps { userId: string }
/** Gently surfaces the open work for today once per day, with an interactive checklist. */
export function TodayReminder({ userId }: TodayReminderProps): ReactElement {
  const todayKey = toDateKey(new Date());
  const dismissKey = `sri.dailyReminder.dismissed.${userId}.${todayKey}`;
  const [dismissed, setDismissed] = useState<boolean>(() => localStorage.getItem(dismissKey) === '1');
  const [ready, setReady] = useState(false);
  const [shown, setShown] = useState(false);
  const daily = useDailyData(userId, todayKey);
  const dueCards = useLiveQuery(() => dbUgc.production_board.where('user_id').equals(userId).and((card) => card.due_date === todayKey && card.column_name !== 'published').toArray(), [userId, todayKey]) ?? [];
  const { selectedDateKey, setCurrentDate, selectDate } = useCalendarStore();
  useEffect(() => { const timer = window.setTimeout(() => setReady(true), 900); return () => window.clearTimeout(timer); }, [todayKey]);
  const openTasks = daily.data.tasks.filter((task) => !task.completed);
  const openPosts = daily.data.platform_posts.filter((post) => post.status !== 'published' && post.status !== 'posted');
  const openCount = openTasks.length + openPosts.length + dueCards.length;
  useEffect(() => { if (ready && !dismissed && !daily.isLoading && openCount > 0 && selectedDateKey !== todayKey && !shown) setShown(true); }, [ready, dismissed, daily.isLoading, openCount, selectedDateKey, todayKey, shown]);
  if (dismissed || !shown) return <></>;
  const dismiss = (): void => { localStorage.setItem(dismissKey, '1'); setDismissed(true); };
  const goToday = (): void => { setCurrentDate(new Date()); selectDate(todayKey); dismiss(); };
  return <div className="reminder-card" role="status"><div className="reminder-head"><strong>⚡ Today's list</strong>{openCount > 0 && <span className="reminder-count">{openCount} open</span>}<button className="reminder-close" onClick={dismiss} aria-label="Dismiss reminder for today"><X size={16}/></button></div>{openCount === 0 ? <div className="reminder-empty">🎉 All clear for today, you're all caught up</div> : <><div className="reminder-list">{openTasks.map((task) => <div className={`reminder-task ${task.completed ? 'completed' : ''}`} key={task.id}><button className="checkbox" onClick={() => void daily.toggleTask(task.id)} aria-label={`Mark ${task.text} complete`}>{task.completed && <Check size={14}/>}</button><span className="task-text">{task.text}</span></div>)}</div>{openPosts.length > 0 && <div className="reminder-chips">{openPosts.map((post) => <span className="platform-pill" key={post.id} title={post.title}>{post.platform} · {post.title}</span>)}</div>}{dueCards.length > 0 && <div className="reminder-tags">{dueCards.map((card) => <span className="reminder-note" key={card.id}>📌 {card.title} · {card.column_name}</span>)}</div>}</>}<div className="reminder-foot"><button className="reminder-open" onClick={goToday}>Open today</button></div></div>;
}