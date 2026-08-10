import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragOverEvent, type DragStartEvent } from '@dnd-kit/core';
import { Plus, Trash2 } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { BOARD_COLUMNS, PLATFORMS, PRIORITIES, PRIORITY_META, PLATFORM_META } from '../../../data/options';
import { EmptyState, Field, FormRow, Modal, PageHead, Pill, confirmDelete, cx } from '../shared/primitives';
import type { BoardCard, BoardSubtask } from '../../../types/ugc';

interface Props { userId: string }

const COLUMN_META: Record<string, { label: string; accent: string }> = {
  idea: { label: '💡 Idea', accent: '#9edcf4' },
  scripting: { label: '✍️ Scripting', accent: '#cbb7ff' },
  preproduction: { label: '🎞️ Pre-production', accent: '#ffd0b8' },
  filming: { label: '🎥 Filming', accent: '#ff9f9f' },
  editing: { label: '🎬 Editing', accent: '#ffe88e' },
  review: { label: '🧐 Review', accent: '#9de5ca' },
  scheduled: { label: '📆 Scheduled', accent: '#9edcf4' },
  published: { label: '🚀 Published', accent: '#9de5ca' },
  repurposed: { label: '♻️ Repurposed', accent: '#d0c8d8' },
};

const emptyCard = (): Omit<BoardCard, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'> => ({ title: '', column_name: 'idea', platform: 'tiktok', priority: 'medium', due_date: null, sponsor: null, video_type: null, subtasks: [], status: 'idea' });

/** PILLAR 2.3 — drag-and-drop production board. */
export function ProductionBoard({ userId }: Props): ReactElement {
  const { items, add, update, remove } = useCollection('production_board', userId);
  const [activeCard, setActiveCard] = useState<BoardCard | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [overCol, setOverCol] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const byColumn = useMemo(() => {
    const map = new Map<string, BoardCard[]>();
    for (const col of BOARD_COLUMNS) map.set(col, []);
    for (const card of items) {
      const list = map.get(card.column_name as string);
      if (list) list.push(card);
    }
    for (const list of map.values()) list.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    return map;
  }, [items]);

  const quickAdd = async (col: string): Promise<void> => {
    if (!newTitle.trim()) { setAdding(null); return; }
    await add({ ...emptyCard(), column_name: col, title: newTitle.trim() } as never);
    setNewTitle(''); setAdding(null);
  };

  const onDragStart = (event: DragStartEvent): void => setOverCol(null);
  const onDragOver = (event: DragOverEvent): void => { const id = String(event.over?.id ?? ''); if (COLUMN_META[id]) setOverCol(id); };
  const onDragEnd = (event: DragEndEvent): void => {
    const card = items.find((c) => c.id === String(event.active.id));
    const target = String(event.over?.id ?? '');
    if (card && COLUMN_META[target] && card.column_name !== target) void update(card.id, { column_name: target, status: target === 'published' ? 'published' : card.status } as never);
    setOverCol(null);
  };

  const addSubtask = (card: BoardCard): void => {
    const subtasks: BoardSubtask[] = [...card.subtasks, { id: crypto.randomUUID(), text: '', done: false }];
    void update(card.id, { subtasks } as never);
  };

  return <>
    <PageHead eyebrow="Pillar 2 · Studio" title="Production board 🗂️" subtitle="Move ideas from spark to published — drag cards across the pipeline."
      actions={[<button key="add" className="btn primary" onClick={() => setAdding('idea')}><Plus size={16}/> Add card</button>]} />

    <DndContext sensors={sensors} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
      <div className="board" style={{}}>
        {BOARD_COLUMNS.map((col) => {
          const meta = COLUMN_META[col] ?? { label: col, accent: '#cbb7ff' };
          const cards = byColumn.get(col) ?? [];
          return <Column key={col} id={col} label={meta.label} accent={meta.accent} count={cards.length} over={overCol === col} onQuickAdd={() => { setAdding(col); setNewTitle(''); }}>
            {cards.map((card) => <DraggableCard key={card.id} card={card} accent={meta.accent} onClick={() => setActiveCard(card)} />)}
            {adding === col && <div style={{ display: 'grid', gap: 6 }}>
              <input className="input" autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void quickAdd(col); }} placeholder="Card title…"/>
              <div className="row" style={{ gap: 6 }}><button className="btn small primary" onClick={() => void quickAdd(col)}>Add</button><button className="btn small ghost" onClick={() => setAdding(null)}>Cancel</button></div>
            </div>}
            <button className="btn small ghost" onClick={() => { setAdding(col); setNewTitle(''); }}><Plus size={13}/> Add</button>
          </Column>;
        })}
      </div>
    </DndContext>

    {items.length === 0 && <section className="section-block"><EmptyState emoji="🗂️" title="Your board is empty" note="Add a card to kick off the pipeline — or move an idea straight here from the Idea Bank."/></section>}

    {activeCard && <CardDetail card={activeCard} onClose={() => setActiveCard(null)} onSave={(patch) => { void update(activeCard.id, patch); }} onDelete={() => { void remove(activeCard.id); setActiveCard(null); }} onAddSubtask={() => addSubtask(activeCard)} />}
  </>;
}

function Column({ id, label, accent, count, over, onQuickAdd, children }: { id: string; label: string; accent: string; count: number; over: boolean; onQuickAdd: () => void; children: ReactNode }): ReactElement {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef} className={cx('board-col', (over || isOver) && 'drag-over')}>
    <div className="col-head"><span style={{ borderBottom: `3px solid ${accent}`, paddingBottom: 2 }}>{label}</span><span className="col-count">{count}</span></div>
    {children}
    <button className="btn small ghost" style={{ justifySelf: 'start' }} onClick={onQuickAdd}><Plus size={13}/> Add card</button>
  </div>;
}

function DraggableCard({ card, accent, onClick }: { card: BoardCard; accent: string; onClick: () => void }): ReactElement {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });
  const dueSoon = card.due_date && new Date(card.due_date).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
  const overdue = card.due_date && new Date(card.due_date).getTime() < Date.now();
  return <div ref={setNodeRef} {...listeners} {...attributes} className={cx('board-card', isDragging && 'dragging')} style={{ borderLeftColor: accent, transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined, zIndex: isDragging ? 30 : undefined, opacity: isDragging ? 0.85 : undefined }} onClick={(e) => { e.stopPropagation(); if (!isDragging) onClick(); }}>
    <strong>{card.title}</strong>
    <div className="meta">
      {card.platform && <Pill color={PLATFORM_META[card.platform]?.color ?? 'gray'}>{card.platform}</Pill>}
      {card.priority && <Pill color={PRIORITY_META[card.priority]?.color ?? 'gray'}>{PRIORITY_META[card.priority]?.emoji} {card.priority}</Pill>}
      {card.video_type && <Pill color="sky">{card.video_type}</Pill>}
      {card.sponsor && <Pill color="yellow">🤝 {card.sponsor}</Pill>}
    </div>
    <div className="foot">
      {card.due_date && <span className="due" style={{ color: overdue ? '#c03a67' : dueSoon ? '#b4642f' : undefined }}>📅 {card.due_date}{overdue ? ' (overdue)' : dueSoon ? ' (soon)' : ''}</span>}
      {card.subtasks.length > 0 && <span className="due">☑️ {card.subtasks.filter((s) => s.done).length}/{card.subtasks.length}</span>}
    </div>
  </div>;
}

function CardDetail({ card, onClose, onSave, onDelete, onAddSubtask }: { card: BoardCard; onClose: () => void; onSave: (patch: Partial<BoardCard>) => void; onDelete: () => void; onAddSubtask: () => void }): ReactElement {
  const [draft, setDraft] = useState<Partial<BoardCard>>({});
  const merged = { ...card, ...draft };
  useEffect(() => { setDraft({}); }, [card.id]);
  return <Modal title={card.title} onClose={onClose} wide
    footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={onDelete}><Trash2 size={14}/> Delete</button><button className="btn primary" onClick={() => { onSave(merged as Partial<BoardCard>); onClose(); }}>Save changes</button></div>}>
    <div className="grid" style={{ gap: 14 }}>
      <Field label="Title"><input className="input" value={merged.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}/></Field>
      <FormRow>
        <Field label="Platform"><select className="select" value={merged.platform ?? 'tiktok'} onChange={(e) => setDraft({ ...draft, platform: e.target.value })}>{PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}</select></Field>
        <Field label="Priority"><select className="select" value={merged.priority ?? 'medium'} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></Field>
        <Field label="Due date"><input type="date" className="date-input" value={merged.due_date ?? ''} onChange={(e) => setDraft({ ...draft, due_date: e.target.value || null })}/></Field>
      </FormRow>
      <FormRow>
        <Field label="Sponsor"><input className="input" value={merged.sponsor ?? ''} onChange={(e) => setDraft({ ...draft, sponsor: e.target.value || null })} placeholder="Brand name…"/></Field>
        <Field label="Video type"><input className="input" value={merged.video_type ?? ''} onChange={(e) => setDraft({ ...draft, video_type: e.target.value || null })} placeholder="Tutorial, vlog, short…"/></Field>
        <Field label="Column"><select className="select" value={merged.column_name} onChange={(e) => setDraft({ ...draft, column_name: e.target.value })}>{BOARD_COLUMNS.map((c) => <option key={c} value={c}>{(COLUMN_META[c]?.label ?? c)}</option>)}</select></Field>
      </FormRow>
      <div>
        <div className="block-head"><h2 style={{ fontSize: 14 }}>Subtasks</h2><button className="btn small soft" onClick={onAddSubtask}><Plus size={13}/> Add</button></div>
        <div className="grid" style={{ gap: 6 }}>
          {merged.subtasks.map((subtask, idx) => <div key={subtask.id} className="row"><input type="checkbox" className="checkbox" checked={subtask.done} onChange={() => setDraft({ ...draft, subtasks: merged.subtasks.map((s, i) => (i === idx ? { ...s, done: !s.done } : s)) })}/><input className="input" value={subtask.text} onChange={(e) => setDraft({ ...draft, subtasks: merged.subtasks.map((s, i) => (i === idx ? { ...s, text: e.target.value } : s)) })}/></div>)}
          {merged.subtasks.length === 0 && <p className="muted" style={{ fontSize: 12 }}>No subtasks yet — add thumbnail, description, pinned comment steps here.</p>}
        </div>
      </div>
    </div>
  </Modal>;
}