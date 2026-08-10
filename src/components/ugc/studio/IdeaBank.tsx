import { useMemo, useState, type ReactElement } from 'react';
import { CalendarPlus, LayoutGrid, List, MoreHorizontal, PenLine, Plus, Trash2, Clapperboard } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { schedulePlatformPost } from '../../../lib/calendarActions';
import { fillTemplate, PLATFORMS, PRIORITIES, EFFORT_LEVELS, IDEA_STATUSES, PRIORITY_META, EFFORT_META, PLATFORM_META, cap } from '../../../data/options';
import { cx, EmptyState, Field, FormRow, Modal, PageHead, Pill, confirmDelete } from '../shared/primitives';
import type { ContentIdea } from '../../../types/ugc';
import type { Platform } from '../../../types';

interface IdeaBankProps { userId: string }

const emptyIdea = (): Omit<ContentIdea, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'> => ({
  title: '', description: '', platform: 'tiktok', priority: 'medium', effort_level: 'quick', status: 'idea',
  audience_promise: '', hook_idea: '', content_angle: '', inspiration_source: '', pillar: '', repurpose_plan: '',
  impact: 3, confidence: 3,
});

/** ICE = Impact × Confidence ÷ Effort. Effort maps from the effort_level tag. */
const EFFORT_COST: Record<string, number> = { quick: 1, medium: 2, big: 3 };
function iceScore(idea: Pick<ContentIdea, 'impact' | 'confidence' | 'effort_level'>): number | null {
  if (idea.impact == null || idea.confidence == null) return null;
  const effort = EFFORT_COST[idea.effort_level ?? 'quick'] ?? 1;
  return Number(((idea.impact * idea.confidence) / effort).toFixed(1));
}
function iceColor(score: number): 'mint' | 'yellow' | 'peach' {
  return score >= 6 ? 'mint' : score >= 3.5 ? 'yellow' : 'peach';
}

/** PILLAR 2.1 — content idea bank with filters, quick-actions and calendar scheduling. */
export function IdeaBank({ userId }: IdeaBankProps): ReactElement {
  const { items, add, update, remove } = useCollection('content_ideas', userId);
  const scripts = useCollection('scripts', userId);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [effortFilter, setEffortFilter] = useState('all');
  const [sort, setSort] = useState<'recent' | 'score'>('recent');
  const [editing, setEditing] = useState<Omit<ContentIdea, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'> | null>(null);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<ContentIdea | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');

  const visible = useMemo(() => {
    const filtered = items
      .filter((idea) => (statusFilter === 'all' ? true : idea.status === statusFilter))
      .filter((idea) => (platformFilter === 'all' ? true : idea.platform === platformFilter))
      .filter((idea) => (priorityFilter === 'all' ? true : idea.priority === priorityFilter))
      .filter((idea) => (effortFilter === 'all' ? true : idea.effort_level === effortFilter));
    return filtered.sort((a, b) => sort === 'score'
      ? (iceScore(b) ?? -1) - (iceScore(a) ?? -1) || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [items, statusFilter, platformFilter, priorityFilter, effortFilter, sort]);

  const isStale = (idea: ContentIdea): boolean => idea.status === 'idea' && Date.now() - new Date(idea.created_at).getTime() > 60 * 24 * 60 * 60 * 1000;

  const save = async (): Promise<void> => {
    if (!editing?.title.trim()) return;
    if (editorId) await update(editorId, editing);
    else await add(editing as never);
    setEditing(null); setEditorId(null);
  };

  const moveToScript = async (idea: ContentIdea): Promise<void> => {
    await scripts.add({
      title: idea.title,
      content: idea.hook_idea ? `${idea.hook_idea}\n\n` : '',
      niche: idea.pillar || null,
      hook_template_used: idea.content_angle || null,
      platform_target: idea.platform,
      status: 'draft',
      word_count: 0,
      runtime_seconds: 0,
    } as never);
    await update(idea.id, { status: 'scripted' } as never);
  };

  const confirmSchedule = async (): Promise<void> => {
    if (!scheduleTarget || !scheduleDate) return;
    await schedulePlatformPost(userId, scheduleDate, { platform: (PLATFORMS as readonly string[]).includes(scheduleTarget.platform ?? '') ? scheduleTarget.platform as Platform : 'tiktok', title: scheduleTarget.title, status: 'scheduled', notes: scheduleTarget.audience_promise ?? '', idea_id: scheduleTarget.id });
    await update(scheduleTarget.id, { status: 'scheduled' } as never);
    setScheduleTarget(null); setScheduleDate('');
  };

  const suggestions = ['3-reel blueprints', 'master them in minutes', 'the underrated setting'];
  const spark = (): void => {
    const topic = prompt('What is your niche or idea?', 'video creation');
    if (!topic) return;
    const hook = fillTemplate(HOOKS[Math.floor(Math.random() * HOOKS.length)] ?? '', topic, topic);
    setEditing({ ...emptyIdea(), title: `${topic} quick win`, hook_idea: hook, inspiration_source: '✨ AI spark' });
  };

  const renderCard = (idea: ContentIdea): ReactElement => (
    <div className={cx('ugc-card hoverable', isStale(idea) && 'stale')} key={idea.id}>
      <div className="card-topbar">
        <Pill color={PRIORITY_META[idea.priority ?? 'medium']?.color ?? 'lavender'}>{(PRIORITY_META[idea.priority ?? 'medium']?.emoji ?? '💫')} {idea.priority ?? `·`}</Pill>
        <div className="row" style={{ gap: 6 }}>
          {idea.platform && <Pill color={PLATFORM_META[idea.platform]?.color ?? 'lavender'}>{idea.platform}</Pill>}
          {isStale(idea) && <span className="stale-badge">stale</span>}
        </div>
      </div>
      <h3 style={{ fontSize: 14.5, color: '#5d4f79', margin: '10px 0 4px', lineHeight: 1.35 }}>{idea.title}</h3>
      {idea.audience_promise && <p className="card-sub">✨ {idea.audience_promise}</p>}
      {idea.hook_idea && <p className="card-sub">🧲 {idea.hook_idea.slice(0, 90)}</p>}
      <div className="row" style={{ marginTop: 10, justifyContent: 'space-between' }}>
        <div className="row" style={{ gap: 6 }}>
          <Pill color={'gray'}>{EFFORT_META[idea.effort_level ?? 'quick']?.emoji} {idea.effort_level}</Pill>
          {(() => { const score = iceScore(idea); return score == null ? <span className="hint" style={{ fontSize: 10 }}>no score</span> : <Pill color={iceColor(score)}>ICE {score}</Pill>; })()}
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button className="icon-btn" title="Move to Script" aria-label="Move to script" onClick={() => void moveToScript(idea)}><Clapperboard size={15}/></button>
          <button className="icon-btn" title="Schedule to calendar" aria-label="Schedule idea" onClick={() => { setScheduleTarget(idea); setScheduleDate(new Date().toISOString().slice(0, 10)); }}><CalendarPlus size={15}/></button>
          <button className="icon-btn" title="Edit idea" aria-label="Edit idea" onClick={() => { setEditorId(idea.id); setEditing({ ...idea }); }}><PenLine size={14}/></button>
          <button className="icon-btn" title="Delete idea" aria-label="Delete idea" onClick={() => confirmDelete(() => void remove(idea.id))}><Trash2 size={14}/></button>
        </div>
      </div>
    </div>
  );

  return <>
    <PageHead eyebrow="Pillar 2 · Studio" title="Idea bank 🌱" subtitle="Capture sparks, keep a reason-for-existence, and never lose an angle again."
      actions={[
        <button key="spark" className="btn soft" onClick={spark}><span>✨</span> Spark an idea</button>,
        <button key="add" className="btn primary" onClick={() => { setEditorId(null); setEditing(emptyIdea()); }}><Plus size={16}/> New idea</button>,
      ]} />

    <section className="section-block">
      <div className="board-toolbar">
        <FormRow>
          <Field label="Status"><select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All statuses</option>{IDEA_STATUSES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}</select></Field>
          <Field label="Platform"><select className="select" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}><option value="all">All platforms</option>{PLATFORMS.map((s) => <option key={s} value={s}>{cap(s)}</option>)}</select></Field>
          <Field label="Priority"><select className="select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}><option value="all">All priorities</option>{PRIORITIES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}</select></Field>
          <Field label="Effort"><select className="select" value={effortFilter} onChange={(e) => setEffortFilter(e.target.value)}><option value="all">All effort</option>{EFFORT_LEVELS.map((s) => <option key={s} value={s}>{cap(s)}</option>)}</select></Field>
          <Field label="Sort"><select className="select" value={sort} onChange={(e) => setSort(e.target.value as 'recent' | 'score')}><option value="recent">Recently updated</option><option value="score">ICE score</option></select></Field>
        </FormRow>
        <div className="spacer"/>
        <div className="segmented" style={{ padding: 3 }}><button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} aria-label="Grid view"><LayoutGrid size={15}/></button><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} aria-label="List view"><List size={15}/></button></div>
      </div>

      {visible.length === 0 ? <EmptyState emoji="🌱" title="No ideas here yet" note="Capture every spark. The Idea Bank keeps your angles, hooks and promises in one place."/> :
        view === 'grid' ? <div className="grid grid-3">{visible.map(renderCard)}</div> :
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Idea</th><th>Platform</th><th>Priority</th><th>Effort</th><th>ICE</th><th>Status</th><th /></tr></thead><tbody>{visible.map((idea) => <tr key={idea.id}><td><strong>{idea.title}</strong>{isStale(idea) && <span className="stale-badge"> stale</span>}</td><td>{idea.platform ?? '·'}</td><td>{idea.priority ?? '·'}</td><td>{idea.effort_level ?? '·'}</td><td>{(() => { const s = iceScore(idea); return s == null ? '·' : <b style={{ color: s >= 6 ? '#43846b' : s >= 3.5 ? '#b4642f' : '#c03a67' }}>{s}</b>; })()}</td><td><Pill color={idea.status === 'published' ? 'mint' : idea.status === 'discarded' ? 'gray' : 'lavender'}>{idea.status}</Pill></td><td><button className="icon-btn" aria-label="Edit" onClick={() => { setEditorId(idea.id); setEditing({ ...idea }); }}><MoreHorizontal size={15}/></button></td></tr>)}</tbody></table></div>}
    </section>

    {editing && <Modal title={editorId ? 'Edit idea' : 'New idea'} onClose={() => setEditing(null)} wide
      footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn primary" onClick={() => void save()}>Save idea</button></div>}>
      <div className="grid" style={{ gap: 14 }}>
        <Field label="Title *"><input className="input" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="e.g. 'POV: the morning routine that fixed my attention'"/></Field>
        <FormRow>
          <Field label="Platform"><select className="select" value={editing.platform ?? 'tiktok'} onChange={(e) => setEditing({ ...editing, platform: e.target.value })}>{PLATFORMS.map((p) => <option key={p} value={p}>{cap(p)}</option>)}</select></Field>
          <Field label="Priority"><select className="select" value={editing.priority ?? 'medium'} onChange={(e) => setEditing({ ...editing, priority: e.target.value })}>{PRIORITIES.map((p) => <option key={p} value={p}>{cap(p)}</option>)}</select></Field>
          <Field label="Effort"><select className="select" value={editing.effort_level ?? 'quick'} onChange={(e) => setEditing({ ...editing, effort_level: e.target.value })}>{EFFORT_LEVELS.map((p) => <option key={p} value={p}>{cap(p)}</option>)}</select></Field>
        </FormRow>
        <Field label="Status"><select className="select" value={editing.status ?? 'idea'} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>{IDEA_STATUSES.map((p) => <option key={p} value={p}>{cap(p)}</option>)}</select></Field>
        <FormRow>
          <Field label={`Impact. Will this move the needle? (${editing.impact ?? 3})`}><input type="range" min={1} max={5} step={1} className="range-input" value={editing.impact ?? 3} onChange={(e) => setEditing({ ...editing, impact: Number(e.target.value) })}/></Field>
          <Field label={`Confidence. How sure are you? (${editing.confidence ?? 3})`}><input type="range" min={1} max={5} step={1} className="range-input" value={editing.confidence ?? 3} onChange={(e) => setEditing({ ...editing, confidence: Number(e.target.value) })}/></Field>
        </FormRow>
        <p className="hint" style={{ fontSize: 11.5 }}>ICE score = impact × confidence ÷ effort → <b>{(iceScore(editing) ?? 0).toFixed(1)}</b>. Top creators score before they script: a 4×4 quick idea beats a 3×3 big production almost every time.</p>
        <Field label="Audience promise. Why this works"><input className="input" value={editing.audience_promise ?? ''} onChange={(e) => setEditing({ ...editing, audience_promise: e.target.value })} placeholder="The 1-line payoff the viewer takes away"/></Field>
        <Field label="Hook idea"><textarea className="textarea" value={editing.hook_idea ?? ''} onChange={(e) => setEditing({ ...editing, hook_idea: e.target.value })} placeholder="Your best opening line or angle…"/></Field>
        <Field label="Content angle"><input className="input" value={editing.content_angle ?? ''} onChange={(e) => setEditing({ ...editing, content_angle: e.target.value })} placeholder="e.g. myth-bust, POV, behind the scenes"/></Field>
        <Field label="Inspiration source"><input className="input" value={editing.inspiration_source ?? ''} onChange={(e) => setEditing({ ...editing, inspiration_source: e.target.value })} placeholder="comment section, trend, Reddit, your DMs…"/></Field>
        <FormRow>
          <Field label="Content pillar"><input className="input" value={editing.pillar ?? ''} onChange={(e) => setEditing({ ...editing, pillar: e.target.value })} placeholder="e.g. Authority / Connection / Growth"/></Field>
          <Field label="Repurpose plan"><input className="input" value={editing.repurpose_plan ?? ''} onChange={(e) => setEditing({ ...editing, repurpose_plan: e.target.value })} placeholder="1 anchor → thread + carousel + short"/></Field>
        </FormRow>
        <Field label="Full description"><textarea className="textarea" value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Draft notes, references, structure sketch…"/></Field>
        <div className="row"><span className="chip-input" style={{ display: 'inline-flex', padding: '6px 10px' }}>💡 <span className="muted" style={{ fontSize: 11.5 }}>Quick-fill hooks: {suggestions.join(' · ')}</span></span></div>
      </div>
    </Modal>}

    {scheduleTarget && <Modal title={`Schedule "''${scheduleTarget.title.slice(0, 48)}''"`} onClose={() => setScheduleTarget(null)}
      footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={() => setScheduleTarget(null)}>Cancel</button><button className="btn primary" disabled={!scheduleDate} onClick={() => void confirmSchedule()}><CalendarPlus size={15}/> Add to calendar</button></div>}>
      <div className="grid" style={{ gap: 14 }}>
        <Field label="Publish date"><input type="date" className="date-input" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}/></Field>
        <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.55 }}>This will open the calendar day and attach a scheduled <b>{scheduleTarget.platform ?? 'tiktok'}</b> post so you can see it on your content grid.</p>
      </div>
    </Modal>}
  </>;
}

const HOOKS = [
  'What if I told you {topic} was hiding just one tiny step away?',
  'I tested {topic} for 30 days so you do not have to.',
  'Stop believing {topic} myths. They are costing you watch time.',
  'Posting about {topic} every day is lazy advice. Do the opposite.',
  'Nobody talks about the small detail in {topic} that changes everything.',
  '{topic} barely worked until I made this one change.',
  'This {topic} trick doubled my results in a weekend.',
  'The {topic} mistakes almost everyone silently makes.',
];