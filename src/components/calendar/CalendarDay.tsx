import type { ReactElement } from 'react';
import { format, isSameDay, isSameMonth } from 'date-fns';
import { motion } from 'framer-motion';
import type { DailyData } from '../../types';

interface CalendarDayProps { date: Date; month: Date; selected: Date; record?: DailyData; onSelect: () => void }
/** Renders one month-grid date with task completion, scheduled posts and sticker indicators. */
export function CalendarDay({ date, month, selected, record, onSelect }: CalendarDayProps): ReactElement {
  const tasks = record?.tasks ?? []; const allDone = tasks.length > 0 && tasks.every((task) => task.completed);
  const posts = record?.platform_posts ?? [];
  return <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className={`calendar-day ${!isSameMonth(date, month) ? 'outside' : ''} ${isSameDay(date, selected) ? 'selected' : ''} ${isSameDay(date, new Date()) ? 'today' : ''}`} onClick={onSelect} aria-label={format(date, 'EEEE d MMMM yyyy')}><span className="day-number">{format(date, 'd')}</span><span className="day-stickers">{record?.stickers.slice(0, 2).join('')}</span>{tasks.length > 0 && <span className={`task-dot ${allDone ? 'done' : 'open'}`} title={allDone ? 'All tasks completed' : 'Tasks remaining'} />}{posts.length > 0 && <span className="post-dots">{posts.slice(0, 3).map((post) => <i key={post.id} className={`post-dot ${post.status}`} title={`${post.title} · ${post.status}`} />)}</span>}</motion.button>;
}
