import { useState, type ReactElement } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { EmptyState, Field, FormRow, Modal, PageHead, Pill, confirmDelete } from '../shared/primitives';
import type { ContentPillar } from '../../../types/ugc';

interface Props { userId: string }

const PRESETS = [
  { name: 'Authority', description: 'Teach what you know and build trust', content_promise: 'One proven lesson or framework', offer_angle: 'Expert + practitioner, no gatekeeping', example_topics: ['mistakes to avoid', 'my exact workflow', 'case studies'], target_audience: 'People trying to learn {topic} faster' },
  { name: 'Connection', description: 'Share the real, relatable human side', content_promise: 'Feel seen, not sold to', offer_angle: 'Behind the curtain honesty', example_topics: ['day in the life', 'failures & lessons', 'values & rituals'], target_audience: 'The community that vibes with you' },
  { name: 'Growth', description: 'Ride trends and make waves', content_promise: 'Hot takes and fresh angles', offer_angle: 'First-mover on what is next', example_topics: ['trend reactions', 'contrarian takes', 'predictions'], target_audience: 'The curious, trend-aware audience' },
];

const empty = (): Omit<ContentPillar, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'> => ({ name: '', description: '', target_audience: '', content_promise: '', offer_angle: '', example_topics: [], goals: '', target_mix: 100 });

/** PILLAR 4.3 — define your content pillar framework and target mix. */
export function ContentPillars({ userId }: Props): ReactElement {
  const { items, add, update, remove } = useCollection('content_pillars', userId);
  const [editing, setEditing] = useState<Omit<ContentPillar, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'> | null>(null);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [topicInput, setTopicInput] = useState('');

  const mixTotal = items.reduce((s, p) => s + (p.target_mix ?? 0), 0);

  const save = async (): Promise<void> => {
    if (!editing?.name.trim()) return;
    if (editorId) await update(editorId, editing as never);
    else await add(editing as never);
    setEditing(null); setEditorId(null);
  };

  const fromPreset = (preset: (typeof PRESETS)[number]): void => {
    setEditing({ ...empty(), ...preset, target_mix: 33 });
  };

  return <>
    <PageHead eyebrow="Pillar 4 · Knowledge" title="Content pillars 🏛️" subtitle="The 3–5 themes every post reinforces — aim for a healthy mix, not a noisy feed."
      actions={[<button key="add" className="btn primary" onClick={() => { setEditorId(null); setEditing(empty()); }}><Plus size={16}/> New pillar</button>]} />

    <section className="section-block">
      <div className="block-head"><h2 style={{ fontSize: 15 }}>Framework presets</h2><span className="hint">the working Authority + Connection + Growth model</span></div>
      <div className="grid grid-3">{PRESETS.map((p) => <div key={p.name} className="ugc-card hoverable" onClick={() => fromPreset(p)} style={{ cursor: 'pointer' }}>
        <Pill color="lavender">{p.name}</Pill>
        <p className="card-sub" style={{ marginTop: 8 }}>{p.description}. Promise: <b>{p.content_promise}</b></p>
        <p className="muted" style={{ fontSize: 10.5, marginTop: 8 }}>Click to scaffold this pillar</p>
      </div>)}</div>
    </section>

    {items.length === 0 ? <section className="section-block"><EmptyState emoji="🏛️" title="No pillars yet" note="Start with Authority, Connection and Growth — or define your own three."/></section> :
      <section className="section-block">
        <div className="block-head"><h2 style={{ fontSize: 15 }}>Your pillars</h2><span className="hint">mix total: {mixTotal}%</span></div>
        <div className="grid grid-2">
          {items.map((pillar) => (
            <div key={pillar.id} className="ugc-card">
              <div className="card-topbar">
                <h3 style={{ fontSize: 15, color: '#5d4f79' }}>{pillar.name}</h3>
                <div className="row" style={{ gap: 6 }}>
                  <button className="icon-btn" onClick={() => { setEditorId(pillar.id); setEditing({ ...pillar }); }} aria-label="Edit pillar">✏️</button>
                  <button className="icon-btn" onClick={() => confirmDelete(() => void remove(pillar.id))} aria-label="Delete pillar"><Trash2 size={14}/></button>
                </div>
              </div>
              {pillar.description && <p className="card-sub">{pillar.description}</p>}
              {pillar.content_promise && <p className="card-sub">📌 Promise: {pillar.content_promise}</p>}
              {pillar.offer_angle && <p className="card-sub">🎯 Offer: {pillar.offer_angle}</p>}
              {pillar.target_audience && <p className="card-sub">👥 {pillar.target_audience}</p>}
              {pillar.target_mix != null && <div style={{ margin: '10px 0 6px' }}><div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, pillar.target_mix)}%` }}/></div><span className="muted" style={{ fontSize: 10.5, fontWeight: 700 }}>{pillar.target_mix}% of mix</span></div>}
              {(pillar.example_topics ?? []).length > 0 && <div className="mini-chips">{pillar.example_topics.map((t) => <span key={t} className="chip">💡 {t}</span>)}</div>}
            </div>
          ))}
        </div>
      </section>}

    {editing && <Modal title={editorId ? 'Edit pillar' : 'New pillar'} onClose={() => setEditing(null)} wide
      footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn primary" onClick={() => void save()}>Save pillar</button></div>}>
      <div className="grid" style={{ gap: 14 }}>
        <FormRow>
          <Field label="Name *"><input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}/></Field>
          <Field label="Target mix %"><input type="number" className="input" min={0} max={100} value={editing.target_mix ?? 0} onChange={(e) => setEditing({ ...editing, target_mix: Number(e.target.value) })}/></Field>
        </FormRow>
        <Field label="Description"><textarea className="textarea" value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })}/></Field>
        <FormRow>
          <Field label="Content promise"><input className="input" value={editing.content_promise ?? ''} onChange={(e) => setEditing({ ...editing, content_promise: e.target.value })}/></Field>
          <Field label="Offer angle"><input className="input" value={editing.offer_angle ?? ''} onChange={(e) => setEditing({ ...editing, offer_angle: e.target.value })}/></Field>
        </FormRow>
        <Field label="Target audience"><input className="input" value={editing.target_audience ?? ''} onChange={(e) => setEditing({ ...editing, target_audience: e.target.value })}/></Field>
        <Field label="Example topics">
          <div className="chip-input">{(editing.example_topics ?? []).map((t) => <span key={t} className="chip">💡 {t}<button onClick={() => setEditing({ ...editing, example_topics: (editing.example_topics ?? []).filter((x) => x !== t) })} aria-label={`Remove ${t}`}>×</button></span>)}
            <input value={topicInput} onChange={(e) => setTopicInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && topicInput.trim()) { setEditing({ ...editing, example_topics: [...(editing.example_topics ?? []), topicInput.trim()] }); setTopicInput(''); } }} placeholder="Add an example topic + Enter"/></div>
        </Field>
        <Field label="Goals / KPIs"><textarea className="textarea" value={editing.goals ?? ''} onChange={(e) => setEditing({ ...editing, goals: e.target.value })}/></Field>
      </div>
    </Modal>}
  </>;
}