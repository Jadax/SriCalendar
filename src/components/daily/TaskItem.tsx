import { useRef, type PointerEvent, type ReactElement } from 'react';
import { motion } from 'framer-motion';
import { Check, GripVertical, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../types';

interface TaskItemProps { task: Task; onToggle: () => void; onDelete: () => void }

/** Renders one sortable checklist item with a satisfying completion bounce and swipe deletion. */
export function TaskItem({ task, onToggle, onDelete }: TaskItemProps): ReactElement {
  const startX = useRef<number | null>(null);
  const sortable = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition };
  /** Records the gesture origin for mobile swipe-to-delete. */
  const pointerDown = (event: PointerEvent<HTMLDivElement>): void => { startX.current = event.clientX; };
  /** Deletes the task after a purposeful left swipe. */
  const pointerUp = (event: PointerEvent<HTMLDivElement>): void => { if (startX.current !== null && event.clientX - startX.current < -90) onDelete(); startX.current = null; };

  return <motion.div layout ref={sortable.setNodeRef} style={style} className={`task-item ${task.completed ? 'completed' : ''}`} onPointerDown={pointerDown} onPointerUp={pointerUp} initial={{ opacity: 0, y: 8 }} animate={task.completed ? { opacity: 1, y: 0, scale: [1, 1.025, 1] } : { opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: -40 }}><button className="drag-handle" {...sortable.attributes} {...sortable.listeners} aria-label={`Reorder ${task.text}`}><GripVertical size={17}/></button><button className="checkbox" onClick={onToggle} aria-label={`${task.completed ? 'Uncomplete' : 'Complete'} ${task.text}`}>{task.completed && <motion.span initial={{ scale: 0, rotate: -25 }} animate={{ scale: [0, 1.35, 1], rotate: [0, 8, 0] }}><Check size={15}/></motion.span>}</button><span className="task-text">{task.text}</span><button className="delete-task" onClick={onDelete} aria-label={`Delete ${task.text}`}><Trash2 size={16}/></button></motion.div>;
}
