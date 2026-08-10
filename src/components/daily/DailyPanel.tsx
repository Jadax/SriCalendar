import { useState, type ReactElement } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useDailyData } from '../../hooks/useDailyData';
import { useCollection } from '../../hooks/useCollection';
import { prettyDate } from '../../utils/dateUtils';
import { TaskList } from './TaskList';
import { NotesArea } from './NotesArea';
import { StickerPicker } from './StickerPicker';
import { ContentPlanner } from './ContentPlanner';

interface DailyPanelProps { userId: string; dateKey: string }
/** Combines all editable content for the selected immutable history date. */
export function DailyPanel({ userId, dateKey }: DailyPanelProps): ReactElement {
  const daily = useDailyData(userId, dateKey); const [open, setOpen] = useState(false);
  const ideas = useCollection('content_ideas', userId);
  /** Unschedule: drop the post and flip its Idea Bank entry back to "idea". */
  const removePost = async (postId: string): Promise<void> => {
    const post = daily.data.platform_posts.find((p) => p.id === postId);
    await daily.deletePost(postId);
    if (post?.idea_id) await ideas.update(post.idea_id, { status: 'idea' } as never);
  };
  return <motion.aside key={dateKey} className={`daily-panel ${open ? 'open' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><button className="panel-handle" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Collapse daily planner' : 'Open daily planner'} aria-expanded={open}><span/>{open ? <ChevronDown size={17}/> : <ChevronUp size={17}/>}</button><div className="daily-heading"><p>Your day</p><h2>{prettyDate(dateKey)}</h2><div className="heading-stickers">{daily.data.stickers.join(' ')}</div></div><TaskList tasks={daily.data.tasks} onAdd={daily.addTask} onToggle={daily.toggleTask} onDelete={daily.deleteTask} onReorder={daily.reorderTasks}/><NotesArea notes={daily.data.notes} onSave={daily.setNotes}/><StickerPicker selected={daily.data.stickers} onToggle={daily.toggleSticker}/><ContentPlanner posts={daily.data.platform_posts} onAdd={daily.addPost} onDelete={removePost}/></motion.aside>;
}
