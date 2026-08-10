import { useMemo, useState, type ReactElement } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { COLLAB_STATUSES, cap, alpha } from '../../../data/options';
import { EmptyState, Field, FormRow, Modal, PageHead, Pill, confirmDelete } from '../shared/primitives';
import type { Collaboration } from '../../../types/ugc';

interface Props { userId: string }

const STATUS_COLOR: Record<string, 'mint' | 'lavender' | 'yellow' | 'gray' | 'coral'> = { active: 'mint', pending: 'yellow', done: 'lavender', declined: 'gray' };

const empty = (): Omit<Collaboration, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'> => ({ partner_name: '', contact_info: '', briefings: '', notes: '', status: 'active', deadline: null });

/** PILLAR 3.5 — collaboration and partner relationship management. */
export function Collaborations({ userId }: Props): ReactElement {
  const { items, add, update, remove } = useCollection('collaborations', userId);
  const [editing, setEditing] = useState<Omit<Collaboration, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'> | null>(null);
  const [editorId, setEditorId] = useState<string | null>(null);

  const sorted = useMemo(() => [...items].sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()), [items]);

  const save = async (): Promise<void> => {
    if (!editing?.partner_name.trim()) return;
    if (editorId) await update(editorId, editing as never);
    else await add(editing as never);
    setEditing(null); setEditorId(null);
  };

  return <>
    <PageHead eyebrow="Pillar 3 · Business" title="Collaborations 🤝" subtitle="Manage partner relationships, briefings and deadlines."
      actions={[<button key="add" className="btn primary" onClick={() => { setEditorId(null); setEditing(empty()); }}><Plus size={16}/> New collaboration</button>]} />

    {sorted.length === 0 ? <section className="section-block"><EmptyState emoji="🤝" title="No collaborations yet" note="Partnerships, co-creations and guest spots. Track briefings and deadlines in one place."/></section> :
      <section className="section-block">
        <div className="grid grid-2">
          {sorted.map((collab) => (
            <div key={collab.id} className="ugc-card hoverable">
              <div className="card-topbar">
                <Pill color={STATUS_COLOR[collab.status] ?? 'gray'}>{collab.status}</Pill>
                <div className="row" style={{ gap: 6 }}>
                  <button className="icon-btn" onClick={() => { setEditorId(collab.id); setEditing({ ...collab }); }} aria-label="Edit collaboration">✏️</button>
                  <button className="icon-btn" onClick={() => confirmDelete(() => void remove(collab.id))} aria-label="Delete"><Trash2 size={14}/></button>
                </div>
              </div>
              <h3 style={{ fontSize: 15, color: '#5d4f79', margin: '10px 0 4px' }}>{collab.partner_name}</h3>
              {collab.contact_info && <p className="card-sub">📇 {collab.contact_info}</p>}
              {collab.briefings && <p className="card-sub">📋 {collab.briefings}</p>}
              {collab.notes && <p className="card-sub">🗒️ {collab.notes}</p>}
              {collab.deadline && <p className="card-sub">⏰ {collab.deadline}</p>}
            </div>
          ))}
        </div>
      </section>}

    {editing && <Modal title={editorId ? 'Edit collaboration' : 'New collaboration'} onClose={() => setEditing(null)} wide
      footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn primary" onClick={() => void save()}>Save</button></div>}>
      <div className="grid" style={{ gap: 14 }}>
        <FormRow>
          <Field label="Partner / brand *"><input className="input" value={editing.partner_name} onChange={(e) => setEditing({ ...editing, partner_name: e.target.value })}/></Field>
          <Field label="Status"><select className="select" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>{alpha(COLLAB_STATUSES).map((s) => <option key={s} value={s}>{cap(s)}</option>)}</select></Field>
          <Field label="Deadline"><input type="date" className="date-input" value={editing.deadline ?? ''} onChange={(e) => setEditing({ ...editing, deadline: e.target.value || null })}/></Field>
        </FormRow>
        <Field label="Contact info"><input className="input" value={editing.contact_info ?? ''} onChange={(e) => setEditing({ ...editing, contact_info: e.target.value })} placeholder="Email / socials / manager contact"/></Field>
        <Field label="Briefings"><textarea className="textarea" value={editing.briefings ?? ''} onChange={(e) => setEditing({ ...editing, briefings: e.target.value })} placeholder="What this partnership is about, deliverables, expectations…"/></Field>
        <Field label="Notes"><textarea className="textarea" value={editing.notes ?? ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })}/></Field>
      </div>
    </Modal>}
  </>;
}