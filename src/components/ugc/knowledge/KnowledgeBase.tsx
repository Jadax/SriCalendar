import { useMemo, useState, type ReactElement } from 'react';
import { ExternalLink, Plus, Search, Trash2 } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { KNOWLEDGE_CATEGORIES, cap } from '../../../data/options';
import { CURRENCIES, formatMoney } from '../../../utils/money';
import { EmptyState, Field, FormRow, Modal, PageHead, Pill, cx } from '../shared/primitives';
import type { KnowledgeItem } from '../../../types/ugc';

interface Props { userId: string }

const empty = (): Omit<KnowledgeItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'> => ({ title: '', category: 'software', description: '', url: '', tags: [], cost: 0, currency: 'USD', renewal_date: null, notes: '' });

/** PILLAR 4.1 — knowledge base for gear, software, presets, music and links. */
export function KnowledgeBase({ userId }: Props): ReactElement {
  const { items, add, update, remove } = useCollection('knowledge_base', userId);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [editing, setEditing] = useState<Omit<KnowledgeItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'> | null>(null);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  const visible = useMemo(() => items
    .filter((i) => (catFilter === 'all' ? true : i.category === catFilter))
    .filter((i) => (search ? `${i.title} ${i.description ?? ''} ${i.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()) : true))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()), [items, search, catFilter]);

  const save = async (): Promise<void> => {
    if (!editing?.title.trim()) return;
    if (editorId) await update(editorId, editing as never);
    else await add(editing as never);
    setEditing(null); setEditorId(null); setTagInput('');
  };

  const renewsSoon = (date: string | null): boolean => !!date && new Date(date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return <>
    <PageHead eyebrow="Pillar 4 · Knowledge" title="Knowledge base 📚" subtitle="Gear, software, presets, music, b-roll and links. Your creator brain in a box."
      actions={[<button key="add" className="btn primary" onClick={() => { setEditorId(null); setEditing(empty()); setTagInput(''); }}><Plus size={16}/> Add resource</button>]} />

    <section className="section-block">
      <div className="board-toolbar">
        <div className="row" style={{ flex: 1, minWidth: 200 }}><label className="chip-input" style={{ flex: 1 }}><Search size={14} color="var(--muted)"/><input className="input" style={{ border: 0, padding: 0 }} value={search} placeholder="Search resources, tags…" onChange={(e) => setSearch(e.target.value)}/></label></div>
        <div className="mini-chips" style={{ marginTop: 0 }}><button className={cx('subtab', catFilter === 'all' && 'active')} onClick={() => setCatFilter('all')}>All</button>{KNOWLEDGE_CATEGORIES.map((c) => <button key={c} className={cx('subtab', catFilter === c && 'active')} onClick={() => setCatFilter(c)}>{c}</button>)}</div>
      </div>

      {visible.length === 0 ? <EmptyState emoji="📚" title="Nothing filed away yet" note="Save the gear you love, the software you swear by, presets, music and templates, with costs and renewal dates."/> :
        <div className="grid grid-2">{visible.map((item) => (
          <div key={item.id} className="ugc-card hoverable">
            <div className="card-topbar">
              <Pill color={categoryColor(item.category)}>{item.category}</Pill>
              <div className="row" style={{ gap: 6 }}>
                <span className="score">{item.cost ? formatMoney(item.cost, item.currency ?? 'USD') : 'free'}</span>
                {item.renewal_date && <span className={cx('score', renewsSoon(item.renewal_date) && 'hot')}>{renewsSoon(item.renewal_date) ? '⏰ renews' : `renews ${item.renewal_date}`}</span>}
              </div>
            </div>
            <h3 style={{ fontSize: 14.5, color: '#5d4f79', margin: '10px 0 4px' }}>{item.title}</h3>
            {item.description && <p className="card-sub">{item.description}</p>}
            {item.notes && <p className="card-sub">🗒️ {item.notes}</p>}
            {(item.tags ?? []).length > 0 && <div className="mini-chips" style={{ marginTop: 8 }}>{item.tags.map((t) => <span key={t} className="chip">#{t}</span>)}</div>}
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
              {item.url ? <a className="btn small soft" href={item.url} target="_blank" rel="noreferrer"><ExternalLink size={13}/> Open</a> : <span/>}
              <div className="row" style={{ gap: 6 }}>
                <button className="icon-btn" onClick={() => { setEditorId(item.id); setEditing({ ...item }); setTagInput(''); }} aria-label="Edit resource">✏️</button>
                <button className="icon-btn" onClick={() => void remove(item.id)} aria-label="Delete resource"><Trash2 size={14}/></button>
              </div>
            </div>
          </div>
        ))}</div>}
    </section>

    {editing && <Modal title={editorId ? 'Edit resource' : 'New resource'} onClose={() => setEditing(null)} wide
      footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn primary" onClick={() => void save()}>Save resource</button></div>}>
      <div className="grid" style={{ gap: 14 }}>
        <FormRow>
          <Field label="Title *"><input className="input" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })}/></Field>
          <Field label="Category"><select className="select" value={editing.category ?? 'software'} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>{KNOWLEDGE_CATEGORIES.map((c) => <option key={c} value={c}>{cap(c)}</option>)}</select></Field>
        </FormRow>
        <Field label="Description"><textarea className="textarea" value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })}/></Field>
        <FormRow>
          <Field label="URL"><input className="input" value={editing.url ?? ''} onChange={(e) => setEditing({ ...editing, url: e.target.value })} placeholder="https://…"/></Field>
          <Field label="Cost"><input type="number" className="input" min={0} value={editing.cost ?? 0} onChange={(e) => setEditing({ ...editing, cost: Number(e.target.value) })}/></Field>
          <Field label="Currency"><select className="select" value={editing.currency ?? 'USD'} onChange={(e) => setEditing({ ...editing, currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}</select></Field>
          <Field label="Renewal date"><input type="date" className="date-input" value={editing.renewal_date ?? ''} onChange={(e) => setEditing({ ...editing, renewal_date: e.target.value || null })}/></Field>
        </FormRow>
        <Field label="Tags">
          <div className="chip-input">{(editing.tags ?? []).map((t) => <span key={t} className="chip">#{t}<button onClick={() => setEditing({ ...editing, tags: (editing.tags ?? []).filter((x) => x !== t) })} aria-label={`Remove ${t}`}>×</button></span>)}
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && tagInput.trim()) { setEditing({ ...editing, tags: [...(editing.tags ?? []), tagInput.trim().replace(/^#/, '')] }); setTagInput(''); } }} placeholder="Type a tag + Enter"/></div>
        </Field>
        <Field label="Notes"><textarea className="textarea" value={editing.notes ?? ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })}/></Field>
      </div>
    </Modal>}
  </>;
}

function categoryColor(category: string | null): 'mint' | 'coral' | 'lavender' | 'peach' | 'sky' | 'yellow' | 'gray' {
  const map: Record<string, 'mint' | 'coral' | 'lavender' | 'peach' | 'sky' | 'yellow' | 'gray'> = { gear: 'sky', software: 'lavender', presets: 'peach', music: 'coral', 'b-roll': 'yellow', links: 'mint', templates: 'sky', learning: 'gray' };
  return map[category ?? ''] ?? 'gray';
}