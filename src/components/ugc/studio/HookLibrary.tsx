import { useMemo, useState, type ReactElement } from 'react';
import { ClipboardCopy, Plus, Search, Trash2 } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { fillTemplate, PLATFORMS, cap } from '../../../data/options';
import { HOOK_CATEGORIES } from '../../../data/hookTemplates';
import { cx, EmptyState, Field, FormRow, Modal, PageHead, Pill, confirmDelete } from '../shared/primitives';
import type { HookItem } from '../../../types/ugc';

interface Props { userId: string }

const TYPES = ['hook', 'caption', 'cta', 'structure'];
const emptyHook = (): Omit<HookItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'> => ({ type: 'hook', content: '', niche: '', platform: 'instagram', performance_notes: '', status: 'untested', times_used: 0 });

/** PILLAR 2.4 — hook & caption library with performance tracking and copy-to-script. */
export function HookLibrary({ userId }: Props): ReactElement {
  const { items, add, update, remove } = useCollection('hook_library', userId);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [editing, setEditing] = useState<Omit<HookItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'> | null>(null);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [copied, setCopied] = useState('');

  const visible = useMemo(() => items
    .filter((h) => (typeFilter === 'all' ? true : h.type === typeFilter))
    .filter((h) => (platformFilter === 'all' ? true : h.platform === platformFilter))
    .filter((h) => (search ? h.content.toLowerCase().includes(search.toLowerCase()) || (h.niche ?? '').toLowerCase().includes(search.toLowerCase()) : true))
    .sort((a, b) => b.times_used - a.times_used || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()), [items, search, typeFilter, platformFilter]);

  const copyToClipboard = async (item: HookItem): Promise<void> => {
    const text = item.content.includes('{') ? fillTemplate(item.content, 'your topic', item.niche ?? 'your niche') : item.content;
    try { await navigator.clipboard.writeText(text); } catch { /* fall back to selection */ }
    setCopied(item.id);
    window.setTimeout(() => setCopied((c) => (c === item.id ? '' : c)), 1600);
    await update(item.id, { times_used: item.times_used + 1, status: item.times_used > 0 && item.status === 'untested' ? 'winning' : item.status } as never);
  };

  const save = async (): Promise<void> => {
    if (!editing?.content.trim()) return;
    if (editorId) await update(editorId, editing as never);
    else await add(editing as never);
    setEditing(null); setEditorId(null);
  };

  return <>
    <PageHead eyebrow="Pillar 2 · Studio" title="Hook & caption library 🧲" subtitle="First-class objects with archetypes, usage counts and copy-to-script on every line."
      actions={[<button key="add" className="btn primary" onClick={() => { setEditorId(null); setEditing(emptyHook()); }}><Plus size={16}/> Add template</button>]} />

    <section className="section-block">
      <div className="board-toolbar">
        <div className="row" style={{ flex: 1, minWidth: 200 }}><label className="chip-input" style={{ flex: 1 }}><Search size={14} color="var(--muted)"/><input className="input" style={{ border: 0, padding: 0 }} value={search} placeholder="Search hooks, captions, niches…" onChange={(e) => setSearch(e.target.value)}/></label></div>
        <Field label="Type"><select className="select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="all">All</option>{TYPES.map((t) => <option key={t} value={t}>{cap(t)}</option>)}</select></Field>
        <Field label="Platform"><select className="select" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}><option value="all">All</option>{PLATFORMS.map((t) => <option key={t} value={t}>{cap(t)}</option>)}</select></Field>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)' }}>{visible.length} saved</span>
      </div>

      {visible.length === 0 ? <EmptyState emoji="🧲" title="No templates yet" note="Steal great hooks, captions, CTAs and structures, then copy them straight into a script and watch the usage counter climb."/> :
        <div className="grid grid-2">{visible.map((item) => (
          <div className="ugc-card" key={item.id}>
            <div className="card-topbar">
              <Pill color={item.type === 'hook' ? 'coral' : item.type === 'caption' ? 'lavender' : item.type === 'cta' ? 'mint' : 'peach'}>{item.type}</Pill>
              <div className="row" style={{ gap: 6 }}>
                {item.niche && <Pill color="sky">{item.niche}</Pill>}
                {item.platform && <Pill color="gray">{item.platform}</Pill>}
                <span className="score" title="Times copied to a script or clipboard">×{item.times_used}</span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#554b6b', lineHeight: 1.5, margin: '10px 0 8px', minHeight: 40 }}>{item.content}</p>
            {item.performance_notes && <p className="card-sub">📈 {item.performance_notes}</p>}
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <Pill color={item.status === 'winning' ? 'mint' : item.status === 'losing' ? 'gray' : 'yellow'}>{item.status}</Pill>
              <div className="row" style={{ gap: 6 }}>
                <button className={cx('btn small', copied === item.id ? 'soft' : 'ghost')} onClick={() => void copyToClipboard(item)}><ClipboardCopy size={13}/> {copied === item.id ? 'Copied!' : 'Copy'}</button>
                <button className="icon-btn" onClick={() => { setEditorId(item.id); setEditing({ ...item }); }} aria-label="Edit template"><span>✏️</span></button>
                <button className="icon-btn" onClick={() => confirmDelete(() => void remove(item.id))} aria-label="Delete template"><Trash2 size={14}/></button>
              </div>
            </div>
          </div>
        ))}</div>}
    </section>

    <section className="section-block">
      <div className="block-head"><h2>💡 Quick-fill by archetype</h2><span className="hint">Pick a category to see its proven structure</span></div>
      <div className="grid grid-3">{HOOK_CATEGORIES.map((category) => {
        const example = HOOKS_BY_CATEGORY[category] ?? 'What if I told you {topic} was one tiny step away?';
        return <div className="ugc-card hoverable" key={category} onClick={() => { setEditorId(null); setEditing({ ...emptyHook(), type: 'hook', content: example, niche: '', performance_notes: '' }); }} style={{ cursor: 'pointer' }}>
          <div className="card-topbar"><strong className="card-title">{category}</strong><Pill color="lavender">template</Pill></div>
          <p className="card-sub" style={{ marginTop: 8 }}>{example}</p>
          <p className="muted" style={{ marginTop: 8, fontSize: 10.5 }}>Click to add this starting point to your library</p>
        </div>;
      })}</div>
    </section>

    {editing && <Modal title={editorId ? 'Edit template' : 'New template'} onClose={() => setEditing(null)} wide
      footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn primary" onClick={() => void save()}>Save template</button></div>}>
      <div className="grid" style={{ gap: 14 }}>
        <FormRow>
          <Field label="Type"><select className="select" value={editing.type ?? 'hook'} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>{TYPES.map((t) => <option key={t} value={t}>{cap(t)}</option>)}</select></Field>
          <Field label="Platform"><select className="select" value={editing.platform ?? 'instagram'} onChange={(e) => setEditing({ ...editing, platform: e.target.value })}>{PLATFORMS.map((t) => <option key={t} value={t}>{cap(t)}</option>)}</select></Field>
          <Field label="Niche"><input className="input" value={editing.niche ?? ''} onChange={(e) => setEditing({ ...editing, niche: e.target.value })} placeholder="beauty, tech, fitness…"/></Field>
        </FormRow>
        <Field label="Template content *"><textarea className="textarea" rows={4} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} placeholder="Use {placeholders} like {topic} and {niche}. They fill in when you copy."/></Field>
        <FormRow>
          <Field label="Performance notes"><input className="input" value={editing.performance_notes ?? ''} onChange={(e) => setEditing({ ...editing, performance_notes: e.target.value })} placeholder="Best 1-2 sentence openers, strong CTR…"/></Field>
          <Field label="Status"><select className="select" value={editing.status ?? 'untested'} onChange={(e) => setEditing({ ...editing, status: e.target.value })}><option value="untested">{cap('untested')}</option><option value="winning">{cap('winning')}</option><option value="losing">{cap('losing')}</option><option value="retired">{cap('retired')}</option></select></Field>
        </FormRow>
      </div>
    </Modal>}
  </>;
}

const HOOKS_BY_CATEGORY: Record<string, string> = {
  Question: 'What if I told you {topic} was one tiny step away?',
  'Big Promise': 'I tested {topic} for 30 days so you do not have to.',
  'Stat & Number': '1 in 3 creators miss this about {topic}.',
  'Myth-Bust': 'Stop believing the {topic} myth. It is costing you.',
  Contrarian: 'Posting {topic} every day is lazy advice.',
  Story: 'It was 11 PM, I had a phone, and {topic} changed everything.',
  'Curiosity Gap': 'Nobody talks about the small detail in {topic}.',
  'Danger & Stakes': 'Doing this with {topic} could stall growth for weeks.',
  Relatable: 'POV: you planned {topic} for weeks and it flopped.',
  'Authority & How-to': 'The exact {topic} framework I reuse every time.',
  Challenge: 'I challenge you to {topic} for 30 days straight.',
  'Trend & Culture': '{topic} is taking over. Use it before it dies.',
};