import { useState, type FormEvent, type ReactElement } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Task } from '../../types';
import { TaskItem } from './TaskItem';

interface TaskListProps { tasks: Task[]; onAdd: (text: string) => Promise<void>; onToggle: (id: string) => Promise<void>; onDelete: (id: string) => Promise<void>; onReorder: (activeId: string, overId: string) => Promise<void> }

/** Provides task entry, completion celebration, deletion, and accessible drag reordering. */
export function TaskList({ tasks, onAdd, onToggle, onDelete, onReorder }: TaskListProps): ReactElement {
  const [text, setText] = useState('');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const completeCount = tasks.filter((task) => task.completed).length;
  const allComplete = tasks.length > 0 && completeCount === tasks.length;
  /** Adds a non-empty task and clears the composer. */
  const submit = (event: FormEvent): void => { event.preventDefault(); if (!text.trim()) return; void onAdd(text); setText(''); };
  /** Persists a completed drag reorder when a task reaches a new target. */
  const dragEnd = (event: DragEndEvent): void => { if (event.over && event.active.id !== event.over.id) void onReorder(String(event.active.id), String(event.over.id)); };

  return <section className={`panel-section tasks-section ${allComplete ? 'all-complete' : ''}`}><div className="section-title"><h3>Today’s sparkle list</h3><span>{completeCount}/{tasks.length}</span></div><form className="task-input" onSubmit={submit}><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Add a lovely little task…" aria-label="New task"/><button aria-label="Add task"><Plus size={18}/></button></form><AnimatePresence>{allComplete && <motion.div className="mission-complete" initial={{ opacity: 0, y: 12, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: .95 }}><span>🎉</span><div><strong>That’s a wrap, superstar!</strong><small>You absolutely ate that list.</small></div><span>✨</span></motion.div>}</AnimatePresence>{tasks.length === 0 ? <div className="empty-tasks"><img src="/illustrations/sparkle.svg" alt=""/><p>A fresh page for fresh ideas.</p><small>What would make today feel wonderful?</small></div> : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}><SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}><div className="task-list"><AnimatePresence>{tasks.map((task) => <TaskItem key={task.id} task={task} onToggle={() => void onToggle(task.id)} onDelete={() => void onDelete(task.id)} />)}</AnimatePresence></div></SortableContext></DndContext>}</section>;
}
