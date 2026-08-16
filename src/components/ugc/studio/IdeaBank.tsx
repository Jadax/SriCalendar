import { useMemo, useState, type ReactElement } from 'react';
import { Brain, CalendarPlus, KanbanSquare, LayoutGrid, List, MoreHorizontal, PenLine, Plus, Quote, Repeat, Sparkles, Trash2, Clapperboard } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { schedulePlatformPost } from '../../../lib/calendarActions';
import { buildBrain } from '../../../lib/scriptBrain';
import { brainstormIdeasSmart, generateCaptionsSmart, repurposeIdea, type BrainstormIdea, type CaptionSet } from '../../../lib/creatorBrain';
import { NICHES } from '../../../data/creatorIntelligence';
import { fillTemplate, PLATFORMS, PRIORITIES, EFFORT_LEVELS, IDEA_STATUSES, PRIORITY_META, EFFORT_META, PLATFORM_META, cap, alpha } from '../../../data/options';
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
  const board = useCollection('production_board', userId);
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
  const [bsOpen, setBsOpen] = useState(false);
  const [bsTopic, setBsTopic] = useState('');
  const [bsNiche, setBsNiche] = useState('lifestyle');
  const [bsCount, setBsCount] = useState(5);
  const [bsBusy, setBsBusy] = useState(false);
  const [bsIdeas, setBsIdeas] = useState<BrainstormIdea[]>([]);
  const [bsPicked, setBsPicked] = useState<Set<number>>(new Set());
  const [capFor, setCapFor] = useState<ContentIdea | null>(null);
  const [capSet, setCapSet] = useState<CaptionSet | null>(null);
  const [capBusy, setCapBusy] = useState(false);
  const [repurposeFor, setRepurposeFor] = useState<ContentIdea | null>(null);
  const [repurposeBusy, setRepurposeBusy] = useState(false);
  const [flash, setFlash] = useState('');

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
    const brain = buildBrain({ niche: idea.pillar ?? '', topic: idea.title, platform: idea.platform ?? 'tiktok', content: idea.description ?? '' }, []);
    const topHook = brain.hooks[0]!;
    const content = [
      idea.hook_idea ? `[HOOK ${idea.content_angle ?? 'Hook'}] ${idea.hook_idea.replace(/^\[HOOK[^\]]+\]\s*/, '')}\n` : `[HOOK ${topHook.category}] ${topHook.text}\n`,
      '', `## ${brain.structure.name}`, brain.structure.body, '',
      '---', 'B-roll to capture:', ...brain.editingNotes.map((n) => `· ${n}`),
    ].join('\n');
    await scripts.add({
      title: idea.title,
      content,
      niche: idea.pillar || null,
      hook_template_used: idea.content_angle || topHook.category || null,
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

  /** Promotes an idea into a production board card — moves it into the build pipeline. */
  const promoteToBoard = async (idea: ContentIdea): Promise<void> => {
    await board.add({
      title: idea.title, column_name: idea.status === 'scripted' ? 'scripting' : 'idea',
      platform: idea.platform, priority: idea.priority, due_date: null, sponsor: null,
      video_type: null, subtasks: [], status: idea.status === 'scripted' ? 'scripting' : 'idea',
    } as never);
  };

  const runBrainstorm = async (): Promise<void> => {
    if (!bsTopic.trim()) return;
    setBsBusy(true);
    setBsIdeas([]); setBsPicked(new Set());
    try {
      const avoid = items.filter((i) => i.title).map((i) => i.title);
      setBsIdeas(await brainstormIdeasSmart({ topic: bsTopic.trim(), niche: bsNiche, pillars: items.map((i) => i.pillar ?? '').filter(Boolean), count: bsCount, avoid }));
    } catch { setBsIdeas([]); }
    finally { setBsBusy(false); }
  };

  const saveBrainstormPicked = async (): Promise<void> => {
    if (bsPicked.size === 0) return;
    const chosen = bsIdeas.filter((_, i) => bsPicked.has(i));
    for (const idea of chosen) {
      await add({
        title: idea.title, description: idea.promise, platform: idea.platform, priority: 'medium', effort_level: 'medium', status: 'idea',
        audience_promise: idea.promise, hook_idea: idea.hook, content_angle: idea.angle, inspiration_source: '🧠 AI brainstorm', pillar: idea.pillar, repurpose_plan: '',
        impact: 3, confidence: 3,
      } as never);
    }
    setBsOpen(false); setBsIdeas([]); setBsPicked(new Set()); setFlash(`Saved ${chosen.length} brainstorm idea${chosen.length === 1 ? '' : 's'}. They're in your bank with ICE 4.5 to score later.`);
  };

  const loadCaptions = async (idea: ContentIdea): Promise<void> => {
    setCapFor(idea); setCapSet(null); setCapBusy(true);
    try { setCapSet(await generateCaptionsSmart({ title: idea.title, hook: idea.hook_idea ?? '', promise: idea.audience_promise ?? '', niche: idea.pillar ?? 'lifestyle', platform: idea.platform ?? 'tiktok' })); }
    catch { setCapSet(null); }
    finally { setCapBusy(false); }
  };

  const runRepurpose = async (): Promise<void> => {
    if (!repurposeFor) return;
    setRepurposeBusy(true);
    try {
      for (const v of repurposeIdea(repurposeFor)) {
        await add({
          title: v.title, description: v.repurpose_plan, platform: v.platform, priority: 'medium', effort_level: 'medium', status: 'idea',
          audience_promise: 'A fresh format from your strongest work.', hook_idea: v.hook, content_angle: v.angle, inspiration_source: `↻ repurposed from “${repurposeFor.title.slice(0, 40)}”`, pillar: repurposeFor.pillar ?? '', repurpose_plan: v.repurpose_plan,
          impact: 3, confidence: 3,
        } as never);
      }
      setFlash(`Repurposed “${repurposeFor.title.slice(0, 40)}” into a thread, carousel, short & long-form. All saved as ideas.`);
      setRepurposeFor(null);
    } finally { setRepurposeBusy(false); }
  };

  const suggestions = ['3-reel blueprints', 'master them in minutes', 'the underrated setting'];
  const spark = (): void => {
    const topic = prompt('What is your niche or idea?', 'video creation');
    if (!topic) return;
    const hook = fillTemplate(HOOKS[Math.floor(Math.random() * HOOKS.length)] ?? '', topic, topic);
    setEditing({ ...emptyIdea(), title: `${topic} quick win`, hook_idea: hook, inspiration_source: '✨ AI spark' });
  };

  const suggestHook = (): void => {
    if (!editing) return;
    const topic = editing.title.trim() || 'your topic';
    const brain = buildBrain({ niche: editing.pillar ?? '', topic, platform: editing.platform ?? 'tiktok', content: editing.description ?? '' }, []);
    const top = brain.hooks[0]!;
    const promise = editing.audience_promise || (brain.description.split('\n')[0]?.replace(/\.$/, '') ?? '');
    setEditing({
      ...editing,
      hook_idea: (editing.hook_idea || top.text),
      content_angle: editing.content_angle || top.category,
      audience_promise: promise,
      inspiration_source: editing.inspiration_source || '🧠 AI suggested',
    });
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
          <button className="icon-btn" title="Add to production board" aria-label="Add to production board" onClick={() => void promoteToBoard(idea)}><KanbanSquare size={15}/></button>
          <button className="icon-btn" title="Captions & hashtags" aria-label="Generate captions" onClick={() => void loadCaptions(idea)}><Quote size={15}/></button>
          <button className="icon-btn" title="Repurpose into 4 formats" aria-label="Repurpose idea" onClick={() => setRepurposeFor(idea)}><Repeat size={15}/></button>
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
        <button key="brainstorm" className="btn soft" onClick={() => setBsOpen(true)}><Sparkles size={15}/> Brainstorm</button>,
        <button key="spark" className="btn soft" onClick={spark}><span>✨</span> Spark an idea</button>,
        <button key="add" className="btn primary" onClick={() => { setEditorId(null); setEditing(emptyIdea()); }}><Plus size={16}/> New idea</button>,
      ]} />

    {flash && <div className="flash-banner" role="status" onClick={() => setFlash('')}>{flash} <span className="muted">· tap to dismiss</span></div>}

    <section className="section-block">
      <div className="board-toolbar">
        <FormRow>
          <Field label="Status"><select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All statuses</option>{alpha(IDEA_STATUSES).map((s) => <option key={s} value={s}>{cap(s)}</option>)}</select></Field>
          <Field label="Platform"><select className="select" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}><option value="all">All platforms</option>{alpha(PLATFORMS).map((s) => <option key={s} value={s}>{cap(s)}</option>)}</select></Field>
          <Field label="Priority"><select className="select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}><option value="all">All priorities</option>{alpha(PRIORITIES).map((s) => <option key={s} value={s}>{cap(s)}</option>)}</select></Field>
          <Field label="Effort"><select className="select" value={effortFilter} onChange={(e) => setEffortFilter(e.target.value)}><option value="all">All effort</option>{alpha(EFFORT_LEVELS).map((s) => <option key={s} value={s}>{cap(s)}</option>)}</select></Field>
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
        <button className="btn soft" onClick={suggestHook} disabled={!editing.title.trim()}><Brain size={14}/> Suggest AI hook, angle & promise</button>
        <FormRow>
          <Field label="Platform"><select className="select" value={editing.platform ?? 'tiktok'} onChange={(e) => setEditing({ ...editing, platform: e.target.value })}>{alpha(PLATFORMS).map((p) => <option key={p} value={p}>{cap(p)}</option>)}</select></Field>
          <Field label="Priority"><select className="select" value={editing.priority ?? 'medium'} onChange={(e) => setEditing({ ...editing, priority: e.target.value })}>{alpha(PRIORITIES).map((p) => <option key={p} value={p}>{cap(p)}</option>)}</select></Field>
          <Field label="Effort"><select className="select" value={editing.effort_level ?? 'quick'} onChange={(e) => setEditing({ ...editing, effort_level: e.target.value })}>{alpha(EFFORT_LEVELS).map((p) => <option key={p} value={p}>{cap(p)}</option>)}</select></Field>
        </FormRow>
        <Field label="Status"><select className="select" value={editing.status ?? 'idea'} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>{alpha(IDEA_STATUSES).map((p) => <option key={p} value={p}>{cap(p)}</option>)}</select></Field>
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

    {bsOpen && <Modal title="🧠 Brainstorm content ideas" onClose={() => setBsOpen(false)} wide
      footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn ghost" onClick={() => setBsOpen(false)}>Close</button>
        <button className="btn primary" disabled={bsBusy || bsPicked.size === 0} onClick={() => void saveBrainstormPicked()}>Save {bsPicked.size > 0 ? `${bsPicked.size} idea${bsPicked.size === 1 ? '' : 's'}` : ''} to bank</button>
      </div>}>
      <div className="grid" style={{ gap: 14 }}>
        <FormRow>
          <Field label="Topic *"><input className="input" value={bsTopic} onChange={(e) => setBsTopic(e.target.value)} placeholder="e.g. 'morning routines for creators', 'budget skincare'…"/></Field>
          <Field label="Niche"><select className="select" value={bsNiche} onChange={(e) => setBsNiche(e.target.value)}>{NICHES.map((n) => <option key={n} value={n}>{cap(n)}</option>)}</select></Field>
          <Field label="How many"><select className="select" value={bsCount} onChange={(e) => setBsCount(Number(e.target.value))}><option value={3}>3</option><option value={5}>5</option><option value={8}>8</option></select></Field>
        </FormRow>
        <button className="btn soft" onClick={() => void runBrainstorm()} disabled={!bsTopic.trim() || bsBusy}><Sparkles size={14}/> {bsBusy ? 'Brainstorming…' : 'Generate ideas'}</button>
        {bsBusy && <p className="hint" style={{ fontSize: 12 }}>Reading your existing ideas to avoid duplicates…</p>}
        {bsIdeas.length === 0 && !bsBusy && <EmptyState emoji="💭" title="Pick a topic, hit generate" note="You'll get concrete, platform-ready angles — not generic filler."/>}
        <div className="grid" style={{ gap: 10 }}>
          {bsIdeas.map((idea, i) => {
            const picked = bsPicked.has(i);
            return <label key={`${idea.title}-${i}`} className={cx('bs-option', picked && 'picked')}>
              <input type="checkbox" checked={picked} onChange={() => { const next = new Set(bsPicked); if (picked) next.delete(i); else next.add(i); setBsPicked(next); }}/>
              <div className="bs-option-body">
                <strong>{idea.title}</strong>
                <span className="muted">🎣 {idea.hook}</span>
                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  <Pill color="lavender">{idea.platform}</Pill><Pill color="sky">{idea.angle}</Pill><Pill color="mint">{idea.pillar}</Pill>
                </div>
              </div>
            </label>;
          })}
        </div>
      </div>
    </Modal>}

    {capFor && <Modal title={`Captions & hashtags — "${capFor.title.slice(0, 44)}"`} onClose={() => { setCapFor(null); setCapSet(null); }} wide
      footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={() => { setCapFor(null); setCapSet(null); }}>Close</button><button className="btn primary" disabled={!capSet} onClick={() => { void navigator.clipboard?.writeText([...capSet?.captions ?? [], '', `Hashtags: ${(capSet?.hashtags ?? []).map((h) => `#${h}`).join(' ')}`, '', capSet?.firstComment ?? '', capSet?.cta ?? ''].join('\n')).catch(() => undefined); }}>Copy all</button></div>}>
      <div className="grid" style={{ gap: 14 }}>
        {capBusy && <p className="hint" style={{ fontSize: 12 }}>Writing captions…</p>}
        {!capBusy && capSet && <>
          {capSet.captions.map((c) => <div key={c.slice(0, 24)} className="caption-block"><p>{c}</p><button className="btn ghost btn-sm" onClick={() => void navigator.clipboard?.writeText(c).catch(() => undefined)}>Copy</button></div>)}
          <div>
            <div className="hint" style={{ fontSize: 11.5, marginBottom: 6 }}>Hashtags (tap to copy):</div>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>{capSet.hashtags.map((h) => <button key={h} className="chip-input" onClick={() => void navigator.clipboard?.writeText(`#${h}`).catch(() => undefined)}>#{h}</button>)}</div>
          </div>
          <div className="caption-block"><div className="hint" style={{ fontSize: 11.5, marginBottom: 4 }}>First comment (engagement boost)</div><p>{capSet.firstComment}</p></div>
          <div className="caption-block"><div className="hint" style={{ fontSize: 11.5, marginBottom: 4 }}>Call to action</div><p>{capSet.cta}</p></div>
        </>}
      </div>
    </Modal>}

    {repurposeFor && <Modal title={`↻ Repurpose "${repurposeFor.title.slice(0, 44)}"`} onClose={() => setRepurposeFor(null)} wide
      footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={() => setRepurposeFor(null)}>Cancel</button><button className="btn primary" disabled={repurposeBusy} onClick={() => void runRepurpose()}><Repeat size={15}/> {repurposeBusy ? 'Saving…' : 'Save all 4 as ideas'}</button></div>}>
      <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.55, marginBottom: 10 }}>One strong post becomes four formats. Each variant is saved as a new idea tied to this source — stretch your best work, don't start cold.</p>
      <div className="grid" style={{ gap: 10 }}>
        {repurposeIdea(repurposeFor).map((v) => <div className="bs-option" key={v.title}>
          <div className="bs-option-body">
            <div className="row" style={{ gap: 6 }}><Pill color="sky">{v.angle}</Pill><Pill color="lavender">{v.platform}</Pill></div>
            <strong>{v.title}</strong>
            <span className="muted">🎣 {v.hook}</span>
            <span className="hint" style={{ fontSize: 11.5 }}>📋 {v.repurpose_plan}</span>
          </div>
        </div>)}
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