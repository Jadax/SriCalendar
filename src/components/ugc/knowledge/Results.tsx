import { useMemo, useState, type ReactElement } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { PLATFORMS, POST_FORMATS, cap } from '../../../data/options';
import { HOOK_CATEGORIES } from '../../../data/hookTemplates';
import { analyzeOutcomes, engagementRate } from '../../../lib/outcomeBrain';
import { toDateKey } from '../../../utils/dateUtils';
import { EmptyState, Field, FormRow, Modal, PageHead, Pill, SectionBlock, confirmDelete } from '../shared/primitives';
import type { ContentResult } from '../../../types/ugc';

interface Props { userId: string }

interface Draft {
  date: string; platform: string; title: string;
  hook_category: string; pillar: string; format: string; angle: string;
  views: number; likes: number; comments: number; shares: number; saves: number; followers_gained: number; note: string;
}

const DIM_EMOJI: Record<string, string> = { hook: '🎣', pillar: '🏛️', format: '🎬', angle: '🧭' };

const empty = (): Draft => ({ date: toDateKey(new Date()), platform: 'tiktok', title: '', hook_category: '', pillar: '', format: '', angle: '', views: 0, likes: 0, comments: 0, shares: 0, saves: 0, followers_gained: 0, note: '' });

/** WHAT WORKED — per-post results log plus the formula the numbers reveal. */
export function Results({ userId }: Props): ReactElement {
  const { items, add, remove } = useCollection('content_results', userId);
  const ideas = useCollection('content_ideas', userId);
  const board = useCollection('production_board', userId);
  const pillars = useCollection('content_pillars', userId);

  const report = useMemo(() => analyzeOutcomes(items), [items]);

  const [editing, setEditing] = useState<Draft | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const publishedItems = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ id: string; title: string; platform: string; date: string }> = [];
    for (const i of ideas.items) {
      if (i.status !== 'published') continue;
      seen.add(i.id);
      list.push({ id: i.id, title: i.title, platform: i.platform ?? 'tiktok', date: toDateKey(new Date(i.created_at)) });
    }
    for (const card of board.items) {
      if (card.column_name !== 'published') continue;
      if (seen.has(card.id)) continue;
      list.push({ id: card.id, title: card.title, platform: card.platform ?? 'tiktok', date: card.due_date ?? toDateKey(new Date(card.updated_at)) });
    }
    return list.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  }, [ideas.items, board.items]);

  const sorted = useMemo(() => [...items].sort((a, b) => b.date.localeCompare(a.date)), [items]);

  const pick = (p: { title: string; platform: string; date: string }): void => {
    setPickerOpen(false);
    setEditing({ ...empty(), title: p.title, platform: p.platform, date: p.date });
  };

  const save = async (): Promise<void> => {
    if (!editing?.title.trim()) return;
    await add({
      date: editing.date, platform: editing.platform, title: editing.title.trim(),
      hook_category: editing.hook_category || null, pillar: editing.pillar || null,
      format: editing.format || null, angle: editing.angle.trim() || null,
      views: Math.max(0, editing.views), likes: Math.max(0, editing.likes),
      comments: Math.max(0, editing.comments), shares: Math.max(0, editing.shares),
      saves: Math.max(0, editing.saves), followers_gained: Math.max(0, editing.followers_gained),
      note: editing.note.trim() || null,
    });
    setEditing(null);
  };

  const erPill = (er: number): 'mint' | 'yellow' | 'coral' => er >= 5 ? 'mint' : er >= 2 ? 'yellow' : 'coral';

  return <>
    <PageHead eyebrow="Pillar 4 · Knowledge" title="What Worked 📊" subtitle="Log what you really published, learn what to make more of, and stop guessing."
      actions={[
        <button key="pick" className="btn soft" onClick={() => setPickerOpen(true)}>📼 From published work</button>,
        <button key="log" className="btn primary" onClick={() => { setEditing(empty()); }}><Plus size={16}/> Log a result</button>,
      ]} />

    <SectionBlock title="🧬 Winning formula" hint="computed live from your logged results"
      actions={<Pill color="lavender">{report.sampleSize} logged</Pill>}>
      {items.length === 0 ? <EmptyState emoji="📊" title="No results yet" note="After a post has had a few days of views, log it here. Two to three weeks of honest numbers is all the formula needs to get smart."/> :
        <>
          <div className="mini-grid">
            <div className="stat-card"><div className="stat-label">📖 Posts logged</div><div className="stat-value">{report.sampleSize}</div><div className="stat-note">with real numbers</div></div>
            <div className="stat-card"><div className="stat-label">💞 Avg engagement</div><div className="stat-value">{report.overall.er.toFixed(1)}%</div><div className="stat-note">of views engaged</div></div>
            <div className="stat-card"><div className="stat-label">👁️ Avg views</div><div className="stat-value">{report.overall.views.toLocaleString()}</div><div className="stat-note">per post</div></div>
            <div className="stat-card"><div className="stat-label">🚀 Followers gained</div><div className="stat-value">+{report.overall.followers.toLocaleString()}</div><div className="stat-note">across logged posts</div></div>
          </div>

          {report.winners.length > 0 ? <div className="result-winners">
            <div className="block-head"><h3>Your winning patterns</h3></div>
            <div className="grid grid-3">
              {report.winners.map((w) => (
                <div className="ugc-card" key={`${w.dimension}-${w.value}`} style={{ margin: 0 }}>
                  <div className="card-topbar">
                    <span><span style={{ fontSize: 18 }}>{DIM_EMOJI[w.dimension] ?? '⭐'}</span> <span className="hint" style={{ textTransform: 'uppercase', letterSpacing: '.1em' }}>{w.dimensionLabel}s</span></span>
                    <Pill color="mint">{w.lift.toFixed(1)}x</Pill>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 14, margin: '8px 0 4px' }}>{w.value}</p>
                  <p className="card-sub" style={{ fontSize: 12 }}>{w.reason}</p>
                </div>
              ))}
            </div>
          </div> : <div className="nudge" style={{ marginTop: 14 }}>
            <span className="nudge-emoji">🧪</span>
            <div className="nudge-body"><div className="nudge-title">Keep logging, patterns are forming</div><p>Once a style beats your average on at least two posts, it shows up here automatically. None yet, which means no strong signal or too few entries.</p></div>
          </div>}

          {report.cutters.length > 0 && <div className="result-cutters">
            <div className="block-head"><h3>Ease off</h3></div>
            {report.cutters.map((c) => <div className="nudge" key={`cut-${c.value}`}><span className="nudge-emoji">✂️</span>
              <div className="nudge-body"><div className="nudge-title">{c.value}</div><p>Ran about half your usual engagement rate ({c.er.toFixed(1)}% vs {report.overall.er.toFixed(1)}%). Test a different approach.</p></div>
            </div>)}
          </div>}

          <div className="block-head" style={{ marginTop: 16 }}><h3>Coach notes</h3></div>
          <ul className="takeaway-list">{report.takeaways.map((t, i) => <li key={i}>💡 {t}</li>)}</ul>
        </>}
    </SectionBlock>

    <SectionBlock title="📓 Results log" hint="every entry feeds the formula" actions={<span className="hint">{sorted.length} entries</span>}>
      {sorted.length === 0 ? <EmptyState emoji="📓" title="Nothing logged yet" note="Logged posts appear here newest first."/> :
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Date</th><th>Post</th><th>Platform</th><th>Hook</th><th>Views</th><th>Engagement</th><th>Follows</th><th /></tr></thead><tbody>
          {sorted.map((r) => {
            const er = engagementRate(r);
            return <tr key={r.id}><td>{r.date.slice(5)}</td><td><strong>{r.title}</strong>{r.pillar && <span className="hint"> · {r.pillar}</span>}</td><td>{cap(r.platform)}</td><td>{r.hook_category ?? '·'}</td><td>{r.views.toLocaleString()}</td><td><Pill color={erPill(er)}>{er.toFixed(1)}%</Pill></td><td>+{r.followers_gained}</td><td><button className="icon-btn" onClick={() => confirmDelete(() => void remove(r.id))} aria-label="Delete result"><Trash2 size={14}/></button></td></tr>;
          })}
        </tbody></table></div>}
    </SectionBlock>

    {editing && <Modal title="Log a result" onClose={() => setEditing(null)} wide
      footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn primary" onClick={() => void save()}>Save result</button></div>}>
      <div className="grid" style={{ gap: 14 }}>
        <FormRow>
          <Field label="Date"><input type="date" className="date-input" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })}/></Field>
          <Field label="Platform"><select className="select" value={editing.platform} onChange={(e) => setEditing({ ...editing, platform: e.target.value })}>{PLATFORMS.map((p) => <option key={p} value={p}>{cap(p)}</option>)}</select></Field>
          <Field label="Format"><select className="select" value={editing.format} onChange={(e) => setEditing({ ...editing, format: e.target.value })}><option value="">Any / custom</option>{POST_FORMATS.map((f) => <option key={f} value={f}>{cap(f)}</option>)}</select></Field>
        </FormRow>
        <Field label="Post title *"><input className="input" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })}/></Field>
        <FormRow>
          <Field label="Hook style"><select className="select" value={editing.hook_category} onChange={(e) => setEditing({ ...editing, hook_category: e.target.value })}><option value="">No hook style logged</option>{HOOK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
          <Field label="Pillar"><select className="select" value={editing.pillar} onChange={(e) => setEditing({ ...editing, pillar: e.target.value })}><option value="">No pillar</option>{pillars.items.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}</select></Field>
          <Field label="Angle"><input className="input" value={editing.angle} onChange={(e) => setEditing({ ...editing, angle: e.target.value })} placeholder="e.g. budget glow-up"/></Field>
        </FormRow>
        <FormRow>
          <Field label="Views"><input type="number" min={0} className="input" value={editing.views} onChange={(e) => setEditing({ ...editing, views: Number(e.target.value) })}/></Field>
          <Field label="Likes"><input type="number" min={0} className="input" value={editing.likes} onChange={(e) => setEditing({ ...editing, likes: Number(e.target.value) })}/></Field>
          <Field label="Comments"><input type="number" min={0} className="input" value={editing.comments} onChange={(e) => setEditing({ ...editing, comments: Number(e.target.value) })}/></Field>
          <Field label="Saves"><input type="number" min={0} className="input" value={editing.saves} onChange={(e) => setEditing({ ...editing, saves: Number(e.target.value) })}/></Field>
          <Field label="Shares"><input type="number" min={0} className="input" value={editing.shares} onChange={(e) => setEditing({ ...editing, shares: Number(e.target.value) })}/></Field>
          <Field label="New followers"><input type="number" min={0} className="input" value={editing.followers_gained} onChange={(e) => setEditing({ ...editing, followers_gained: Number(e.target.value) })}/></Field>
        </FormRow>
        <Field label="What actually happened"><input className="input" value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} placeholder="e.g. blew up in shares, got a brand inquiry"/></Field>
      </div>
    </Modal>}

    {pickerOpen && <Modal title="Log a published post" onClose={() => setPickerOpen(false)} wide>
      {publishedItems.length === 0 ? <EmptyState emoji="📼" title="No published posts found" note="Posts you mark as published on the Production Board or in the Idea Bank show up here to pre-fill a result entry."/> :
        <div className="pick-list">{publishedItems.map((p) => (
          <button key={p.id} className="pick-item" onClick={() => pick(p)}>
            <span className="hint">{p.date}</span> <strong>{p.title}</strong> <Pill color="sky">{cap(p.platform)}</Pill>
          </button>
        ))}</div>}
    </Modal>}
  </>;
}