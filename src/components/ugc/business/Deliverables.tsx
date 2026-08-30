import { useMemo, useState, type ReactElement } from 'react';
import { Pencil, Plus, Trash2, Unlink } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { DELIVERABLE_FLOW, DELIVERABLE_STATUSES, DELIVERABLE_STATUS_META, PLATFORMS, cap } from '../../../data/options';
import { toDateKey } from '../../../utils/dateUtils';
import { formatMoneyCompact } from '../../../utils/money';
import { EmptyState, Field, FormRow, Modal, PageHead, Pill, SectionBlock, confirmDelete } from '../shared/primitives';
import type { UgcDeliverable } from '../../../types/ugc';

interface Props { userId: string }

interface Draft {
  id?: string;
  deal_id: string;
  brand_name: string;
  description: string;
  quantity: number;
  status: string;
  platform: string;
  due_date: string;
  compensation: number;
  notes: string;
}

interface LinkDraft {
  deliverable: UgcDeliverable;
  title: string;
  platform: string;
  date: string;
}

const empty = (): Draft => ({
  deal_id: '', brand_name: '', description: '', quantity: 1, status: 'contracted',
  platform: 'tiktok', due_date: '', compensation: 0, notes: '',
});

const statusMeta = (s: string): { emoji: string; label: string; color: 'mint' | 'coral' | 'lavender' | 'sky' | 'yellow' | 'gray' } =>
  DELIVERABLE_STATUS_META[s] ?? { emoji: '📦', label: cap(s), color: 'gray' };

/** CLIENT WORK — every asset inside a deal, tracked from contracted to paid. */
export function Deliverables({ userId }: Props): ReactElement {
  const deliverables = useCollection('ugc_deliverables', userId);
  const deals = useCollection('brand_deals', userId);
  const results = useCollection('content_results', userId);

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const [editing, setEditing] = useState<Draft | null>(null);
  const [linking, setLinking] = useState<LinkDraft | null>(null);

  const byId = useMemo(() => new Map(deals.items.map((d) => [d.id, d] as const)), [deals.items]);
  const resultById = useMemo(() => new Map(results.items.map((r) => [r.id, r] as const)), [results.items]);

  const sorted = useMemo(() => [...deliverables.items].sort((a, b) => {
    const sa = DELIVERABLE_STATUSES.indexOf(a.status as (typeof DELIVERABLE_STATUSES)[number]);
    const sb = DELIVERABLE_STATUSES.indexOf(b.status as (typeof DELIVERABLE_STATUSES)[number]);
    if (sa !== sb) return sa - sb;
    return (b.due_date ?? '').localeCompare(a.due_date ?? '');
  }), [deliverables.items]);

  const activeDealCount = deals.items.filter((d) => d.status !== 'declined').length;

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of deliverables.items) c[d.status] = (c[d.status] ?? 0) + 1;
    return c;
  }, [deliverables.items]);

  const createFromDeal = (dealId: string): void => {
    const deal = byId.get(dealId);
    setEditing((prev) => ({
      ...(prev ?? empty()),
      deal_id: dealId,
      brand_name: deal?.brand_name ?? prev?.brand_name ?? '',
      platform: deal?.platform ?? prev?.platform ?? 'tiktok',
    }));
  };

  const save = async (): Promise<void> => {
    if (!editing?.brand_name.trim() || !editing.description.trim()) return;
    const payload = {
      deal_id: editing.deal_id || null,
      brand_name: editing.brand_name.trim(),
      description: editing.description.trim(),
      quantity: Math.max(1, editing.quantity),
      status: editing.status,
      platform: editing.platform || null,
      due_date: editing.due_date || null,
      compensation: editing.compensation > 0 ? editing.compensation : null,
      notes: editing.notes.trim() || null,
    };
    if (editing.id) {
      await deliverables.update(editing.id, payload);
    } else {
      await deliverables.add(payload);
    }
    setEditing(null);
  };

  const advance = async (d: UgcDeliverable): Promise<void> => {
    const next = DELIVERABLE_FLOW[d.status];
    if (!next) return;
    const patch: Partial<UgcDeliverable> = { status: next };
    if (next === 'submitted') patch.submitted_at = todayKey;
    await deliverables.update(d.id, patch);
  };

  const linkResult = async (resultId: string): Promise<void> => {
    if (!linking) return;
    const d = linking.deliverable;
    await deliverables.update(d.id, { linked_result_id: resultId, status: d.status === 'paid' ? 'paid' : 'published' });
    setLinking(null);
  };

  const quickLog = async (): Promise<void> => {
    if (!linking) return;
    const d = linking.deliverable;
    const id = await results.add({
      date: linking.date, platform: linking.platform, title: linking.title.trim() || d.description,
      hook_category: null, pillar: null, format: null, angle: null,
      views: 0, likes: 0, comments: 0, shares: 0, saves: 0, followers_gained: 0,
      note: `Logged from deliverable: ${d.description} (${d.brand_name})`,
    });
    if (id) await linkResult(id);
  };

  return <div className="ugc-page">
    <PageHead eyebrow="Business · Client Work" title="Deliverables 📦" subtitle="Every asset inside a deal: film it, submit it, survive revisions, collect the payout."
      actions={[<button key="add" className="btn primary" onClick={() => setEditing(empty())}><Plus size={16}/> New deliverable</button>]} />

    <SectionBlock title="📊 Pipeline at a glance" hint="contracted → filmed → submitted → approved → published → paid">
      {deliverables.items.length === 0 ? <EmptyState emoji="📦" title="No client deliverables yet" note="Add one here, or create it under a brand deal. Tracked work is how you prove value."/> :
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {DELIVERABLE_STATUSES.map((s) => {
            const meta = statusMeta(s);
            return <Pill key={s} color={meta.color}>{meta.emoji} {meta.label} · {counts[s] ?? 0}</Pill>;
          })}
        </div>}
    </SectionBlock>

    <SectionBlock title="🥁 All deliverables" hint={`${sorted.length} across ${activeDealCount} active deal${activeDealCount === 1 ? '' : 's'}`}>
      {sorted.length === 0 ? <EmptyState emoji="🎬" title="Nothing here yet" note="Deliverables show up here sorted by stage, then by due date."/> :
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Move</th><th>Brand</th><th>Deliverable</th><th>Due</th><th>Status</th><th>Result</th><th>Value</th></tr></thead><tbody>
          {sorted.map((d) => {
            const meta = statusMeta(d.status);
            const deal = d.deal_id ? byId.get(d.deal_id) : undefined;
            const linked = d.linked_result_id ? resultById.get(d.linked_result_id) : undefined;
            const next = DELIVERABLE_FLOW[d.status];
            return <tr key={d.id}>
              <td><div className="row" style={{ gap: 6 }}>
                {next && <button className="icon-btn" onClick={() => void advance(d)} aria-label={`Move to ${cap(next)}`} title={`Move to ${cap(next)}`}>➡️</button>}
                <button className="icon-btn" onClick={() => setEditing({ ...empty(), id: d.id, deal_id: d.deal_id ?? '', brand_name: d.brand_name, description: d.description, quantity: d.quantity, status: d.status, platform: d.platform ?? 'tiktok', due_date: d.due_date ?? '', compensation: d.compensation ?? 0, notes: d.notes ?? '' })} aria-label="Edit deliverable"><Pencil size={14}/></button>
                <button className="icon-btn" onClick={() => confirmDelete(() => void deliverables.remove(d.id))} aria-label="Delete deliverable"><Trash2 size={14}/></button>
              </div></td>
              <td><strong>{d.brand_name}</strong>{deal && <span className="hint"> · {cap(deal.status)}</span>}</td>
              <td>{d.description}{d.quantity > 1 && <span className="hint" style={{ fontWeight: 700, marginLeft: 8 }}>×{d.quantity}</span>}{d.revision_count > 0 && <span className="hint"> · 🔄 {d.revision_count}</span>}</td>
              <td>{d.due_date ?? '—'}</td>
              <td><Pill color={meta.color}>{meta.emoji} {meta.label}</Pill></td>
              <td>{linked ? <div className="row" style={{ gap: 6 }}><span className="hint" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📊 {linked.title}</span><button className="icon-btn" title="Unlink result" onClick={() => void deliverables.update(d.id, { linked_result_id: null })}><Unlink size={12}/></button></div> : <button className="btn ghost small" onClick={() => setLinking({ deliverable: { ...d }, title: d.description, platform: d.platform ?? 'tiktok', date: todayKey })}>🔗 Link</button>}</td>
              <td>{d.compensation != null ? <span className="hint">{formatMoneyCompact(d.compensation, deal?.currency ?? 'USD')}</span> : '—'}</td>
            </tr>;
          })}
        </tbody></table></div>}
    </SectionBlock>

    {editing && <Modal title={editing.id ? 'Edit deliverable' : 'New deliverable'}
      onClose={() => setEditing(null)}
      footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn primary" onClick={() => void save()}>{editing.id ? 'Save changes' : 'Add deliverable'}</button></div>} wide>
      <div className="grid" style={{ gap: 14 }}>
        <FormRow>
          <Field label="Create from deal (optional)"><select className="select" value={editing.deal_id} onChange={(e) => createFromDeal(e.target.value)}><option value="">Standalone</option>{deals.items.filter((d) => d.status !== 'declined').map((d) => <option key={d.id} value={d.id}>{d.brand_name}</option>)}</select></Field>
          <Field label="Brand *"><input className="input" value={editing.brand_name} onChange={(e) => setEditing({ ...editing, brand_name: e.target.value })}/></Field>
          <Field label="Platform"><select className="select" value={editing.platform} onChange={(e) => setEditing({ ...editing, platform: e.target.value })}>{PLATFORMS.map((p) => <option key={p} value={p}>{cap(p)}</option>)}</select></Field>
        </FormRow>
        <FormRow>
          <Field label="Deliverable *"><input className="input" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="e.g. 3 unique 30s skincare routine videos"/></Field>
          <Field label="Quantity"><input type="number" min={1} className="input" value={editing.quantity} onChange={(e) => setEditing({ ...editing, quantity: Number(e.target.value) })}/></Field>
          <Field label="Due date"><input type="date" className="date-input" value={editing.due_date} onChange={(e) => setEditing({ ...editing, due_date: e.target.value })}/></Field>
        </FormRow>
        <FormRow>
          <Field label="Status"><select className="select" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>{DELIVERABLE_STATUSES.map((s) => <option key={s} value={s}>{statusMeta(s).emoji} {statusMeta(s).label}</option>)}</select></Field>
          <Field label="Value (optional)"><input type="number" min={0} className="input" value={editing.compensation} onChange={(e) => setEditing({ ...editing, compensation: Number(e.target.value) })} placeholder="what this deliverable is worth"/></Field>
          <Field label="What to deliver"><input className="input" value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} placeholder="number of clips, unique per product, no b-roll reuse"/></Field>
        </FormRow>
      </div>
    </Modal>}

    {linking && <Modal title={`Link a result · ${linking.deliverable.brand_name}`} onClose={() => setLinking(null)} wide>
      <div className="section-block" style={{ marginBottom: 12 }}>
        <div className="block-head"><h2 style={{ fontSize: 14 }}>Log the published post</h2><span className="hint">the What Worked engine uses these numbers</span></div>
        <div className="grid" style={{ gap: 12 }}>
          <FormRow>
            <Field label="Title"><input className="input" value={linking.title} onChange={(e) => setLinking({ ...linking, title: e.target.value })} placeholder={linking.deliverable.description}/></Field>
            <Field label="Platform"><select className="select" value={linking.platform} onChange={(e) => setLinking({ ...linking, platform: e.target.value })}>{PLATFORMS.map((p) => <option key={p} value={p}>{cap(p)}</option>)}</select></Field>
            <Field label="Date"><input type="date" className="date-input" value={linking.date} onChange={(e) => setLinking({ ...linking, date: e.target.value })}/></Field>
          </FormRow>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn primary small" onClick={() => void quickLog()}>📊 Log and link</button>
            <span className="hint">add views, likes and saves afterwards in What Worked</span>
          </div>
        </div>
      </div>
      <div className="block-head"><h2 style={{ fontSize: 14 }}>Or link an existing result</h2></div>
      {results.items.length === 0 ? <EmptyState emoji="📊" title="No results logged yet" note="Log this one above to feed the winning-formula engine."/> :
        <div className="pick-list">{[...results.items].sort((a, b) => b.date.localeCompare(a.date)).map((r) => (
          <button key={r.id} className="pick-item" onClick={() => void linkResult(r.id)}>
            <span className="hint">{r.date}</span> <strong>{r.title}</strong> <Pill color="sky">{cap(r.platform)}</Pill>
          </button>
        ))}</div>}
    </Modal>}
  </div>;
}