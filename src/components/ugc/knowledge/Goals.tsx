import { useMemo, useState, type ReactElement } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { GOAL_STATUSES, GOAL_TYPES as FULL_GOAL_TYPES, cap, alpha } from '../../../data/options';
import { EmptyState, Field, FormRow, Modal, PageHead, Pill, Progress, confirmDelete } from '../shared/primitives';
import type { Goal } from '../../../types/ugc';

interface Props { userId: string }

const TYPE_EMOJI: Record<string, string> = { audience: '👥', revenue: '💰', content: '🎬', skill: '🧠' };
const STATUS_COLOR: Record<string, 'mint' | 'lavender' | 'yellow' | 'gray' | 'coral'> = { active: 'mint', 'at-risk': 'coral', achieved: 'lavender', paused: 'gray' };
const PROMPTS: Record<string, string> = { audience: 'Reach {n} followers', revenue: 'Earn ${n} this quarter', content: 'Publish {n} videos', skill: 'Master {n} by {date}' };

const empty = (): Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'> => ({ type: 'audience', name: '', target: 1000, current_progress: 0, status: 'active', deadline: null });

/** PILLAR 4.4 — goals & milestones with progress nudges. */
export function Goals({ userId }: Props): ReactElement {
  const { items, add, update, remove } = useCollection('goals', userId);
  const [typeFilter, setTypeFilter] = useState('all');
  const [editing, setEditing] = useState<Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'> | null>(null);
  const [editorId, setEditorId] = useState<string | null>(null);

  const visible = useMemo(() => items.filter((g) => (typeFilter === 'all' ? true : g.type === typeFilter)).sort((a, b) => (a.status === 'achieved' ? 1 : 0) - (b.status === 'achieved' ? 1 : 0)), [items, typeFilter]);
  const achieved = items.filter((g) => g.status === 'achieved').length;

  const save = async (): Promise<void> => {
    if (!editing?.name.trim()) return;
    if (editorId) await update(editorId, editing as never);
    else await add(editing as never);
    setEditing(null); setEditorId(null);
  };

  const sketch = (type: string): void => {
    const n = type === 'revenue' ? 1000 : 500;
    setEditorId(null);
    setEditing({ ...empty(), type, name: (PROMPTS[type] ?? '').replace('{n}', n === 1000 ? '$1,000' : String(n)).replace('{date}', 'this quarter') });
  };

  return <>
    <PageHead eyebrow="Pillar 4 · Knowledge" title="Goals & milestones 🎯" subtitle="Audience, revenue, content and skill. Nudge the needle, watch the streak grow."
      actions={[<button key="add" className="btn primary" onClick={() => { setEditorId(null); setEditing(empty()); }}><Plus size={16}/> New goal</button>]} />

    <section className="section-block">
      <div className="board-toolbar">
        <Field label="Type"><select className="select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="all">All types</option>{alpha(FULL_GOAL_TYPES).map((t) => <option key={t} value={t}>{cap(t)}</option>)}</select></Field>
        <div className="spacer"/><span className="hint">🏆 {achieved} achieved{achieved === items.length && items.length > 0 ? '. All your goals done!' : ''}</span>
        <button className="btn small soft" onClick={() => setEditing(empty())}><Plus size={13}/> Quick goal</button>
      </div>
      {visible.length === 0 ? <EmptyState emoji="🎯" title="No goals yet" note="Set a milestone for followers, revenue, publishing cadence or a skill. One tap nudges it forward."/> :
        <div className="grid grid-2">{visible.map((goal) => {
          const pct = goal.target ? (goal.current_progress / goal.target) * 100 : 0;
          return <div key={goal.id} className="ugc-card">
            <div className="card-topbar">
              <span><span style={{ fontSize: 18 }}>{TYPE_EMOJI[goal.type]}</span> <strong className="card-title" style={{ fontSize: 14 }}>{goal.name}</strong></span>
              <div className="row" style={{ gap: 6 }}>
                <Pill color={STATUS_COLOR[goal.status] ?? 'gray'}>{goal.status}</Pill>
                <button className="icon-btn" onClick={() => { setEditorId(goal.id); setEditing({ ...goal }); }} aria-label="Edit goal">✏️</button>
                <button className="icon-btn" onClick={() => confirmDelete(() => void remove(goal.id))} aria-label="Delete goal"><Trash2 size={14}/></button>
              </div>
            </div>
            {goal.deadline && <p className="card-sub">⏰ {goal.deadline}</p>}
            <div style={{ margin: '12px 0 8px' }}><Progress value={goal.current_progress} max={goal.target ?? 1} label={`${formatNum(goal.current_progress)} / ${formatNum(goal.target ?? 0)}`} /></div>
            <div className="row" style={{ gap: 6 }}>
              <button className="btn small ghost" onClick={() => void update(goal.id, { current_progress: Math.max(0, goal.current_progress - stepOf(goal)) })}><Minus size={13}/></button>
              <button className="btn small soft" onClick={() => void update(goal.id, { current_progress: goal.current_progress + stepOf(goal), status: pct >= 100 ? 'achieved' : goal.status })}><Plus size={13}/> {stepOf(goal)}</button>
              {pct >= 100 && goal.status !== 'achieved' && <button className="btn small primary" onClick={() => void update(goal.id, { status: 'achieved' })}>Mark achieved 🎉</button>}
            </div>
          </div>;
        })}</div>}
    </section>

    {editing && <Modal title={editorId ? 'Edit goal' : 'New goal'} onClose={() => setEditing(null)} wide
      footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn primary" onClick={() => void save()}>Save goal</button></div>}>
      <div className="grid" style={{ gap: 14 }}>
        <FormRow>
          <Field label="Type"><select className="select" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>{alpha(FULL_GOAL_TYPES).map((t) => <option key={t} value={t}>{cap(t)}</option>)}</select></Field>
          <Field label="Status"><select className="select" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>{alpha(GOAL_STATUSES).map((s) => <option key={s} value={s}>{cap(s)}</option>)}</select></Field>
          <Field label="Deadline"><input type="date" className="date-input" value={editing.deadline ?? ''} onChange={(e) => setEditing({ ...editing, deadline: e.target.value || null })}/></Field>
        </FormRow>
        <Field label="Name *"><input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}/></Field>
        <FormRow>
          <Field label="Target"><input type="number" className="input" min={0} value={editing.target ?? 0} onChange={(e) => setEditing({ ...editing, target: Number(e.target.value) })}/></Field>
          <Field label="Current progress"><input type="number" className="input" min={0} value={editing.current_progress} onChange={(e) => setEditing({ ...editing, current_progress: Number(e.target.value) })}/></Field>
        </FormRow>
        <div className="row">
          <span className="hint">💡 Quick-start:</span>
          {FULL_GOAL_TYPES.map((t) => <button key={t} className="btn small ghost" onClick={() => sketch(t)}>{TYPE_EMOJI[t]} {t}</button>)}
        </div>
      </div>
    </Modal>}
  </>;
}

function stepOf(goal: Goal): number {
  if (goal.target && goal.target <= 50) return 1;
  if (goal.target && goal.target <= 500) return 10;
  return 100;
}
function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}