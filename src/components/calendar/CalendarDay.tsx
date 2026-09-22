import type { ReactElement } from 'react';
import { format, isSameDay, isSameMonth } from 'date-fns';
import { motion } from 'framer-motion';
import type { DailyData } from '../../types';

interface CalendarDayProps { date: Date; month: Date; selected: Date; record?: DailyData; due?: number; onSelect: () => void }
/** Renders one month-grid date with task completion, scheduled posts and production due indicators. */
export function CalendarDay({ date, month, selected, record, due = 0, onSelect }: CalendarDayProps): ReactElement {
  const tasks = record?.tasks ?? []; const allDone = tasks.length > 0 && tasks.every((task) => task.completed);
  const posts = record?.platform_posts ?? []; const isToday = isSameDay(date, new Date());
  const openCount = tasks.filter((task) => !task.completed).length + posts.filter((post) => post.status !== 'published' && post.status !== 'posted').length + due;
  const hasOpen = isToday && openCount > 0; const settled = isToday && openCount === 0 && (tasks.length > 0 || posts.length > 0 || due > 0);
  return <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className={`calendar-day ${!isSameMonth(date, month) ? 'outside' : ''} ${isSameDay(date, selected) ? 'selected' : ''} ${isToday ? 'today' : ''} ${hasOpen ? 'has-open' : ''} ${settled ? 'all-done' : ''}`} onClick={onSelect} aria-label={format(date, 'EEEE d MMMM yyyy')}><span className="day-number">{format(date, 'd')}</span><span className="day-stickers">{record?.stickers.slice(0, 2).join('')}</span>{hasOpen && <span className="open-badge" title={`${openCount} open item${openCount === 1 ? '' : 's'} today`}>{openCount}</span>}{tasks.length > 0 && <span className={`task-dot ${allDone ? 'done' : 'open'}`} title={allDone ? 'All tasks completed' : 'Tasks remaining'} />}{posts.length > 0 && <span className="post-dots">{posts.slice(0, 3).map((post) => <i key={post.id} className={`post-dot ${post.status}`} title={`${post.title} · ${post.status}`} />)}</span>}{due > 0 && <span className={`due-chip ${due > 1 ? 'multi' : ''}`} title={`${due} production card${due === 1 ? '' : 's'} due`}>{due}</span>}</motion.button>;
}
