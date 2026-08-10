import { useMemo, useState, type ReactElement } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Table2, Trash2, Wallet } from 'lucide-react';
import { addMonths, eachDayOfInterval, endOfMonth, format, isSameMonth, startOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { useCollection } from '../../../hooks/useCollection';
import { DEAL_STATUSES, PAYMENT_STATUSES, PLATFORMS, RIGHTS_PERIODS, cap, alpha } from '../../../data/options';
import { CURRENCIES, formatMoney } from '../../../utils/money';
import { alphaBy } from '../../../data/options';
import { EmptyState, Field, FormRow, Modal, PageHead, Pill, confirmDelete, cx } from '../shared/primitives';
import type { BrandDeal } from '../../../types/ugc';

interface Props { userId: string }
type ViewMode = 'table' | 'calendar';

const emptyDeal = (): Omit<BrandDeal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'> => ({ brand_name: '', contact_name: '', contact_email: '', deal_value: 0, estimated_probability: 60, currency: 'USD', deliverables: '', usage_rights: '', rights_period: null, deadline: null, pitch_date: null, follow_up_date: null, payment_status: 'pending', status: 'cold', platform: 'tiktok', notes: '' });

const STATUS_COLOR: Record<string, 'coral' | 'lavender' | 'yellow' | 'mint' | 'gray' | 'peach' | 'sky'> = { cold: 'gray', contacted: 'sky', negotiating: 'yellow', accepted: 'mint', delivered: 'lavender', declined: 'coral' };

/** PILLAR 3.2 — brand deal tracker with spreadsheet table and deadline calendar. */
export function BrandDeals({ userId }: Props): ReactElement {
  const { items, add, update, remove } = useCollection('brand_deals', userId);
  const [view, setView] = useState<ViewMode>('table');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState<Omit<BrandDeal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'> | null>(null);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const visible = useMemo(() => items
    .filter((d) => (statusFilter === 'all' ? true : d.status === statusFilter))
    .sort((a, b) => (b.deadline ?? '9999') < (a.deadline ?? '9999') ? -1 : 1), [items, statusFilter]);

  const save = async (): Promise<void> => {
    if (!editing?.brand_name.trim()) return;
    if (editorId) await update(editorId, editing as never);
    else await add(editing as never);
    setEditing(null); setEditorId(null);
  };

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) });
  const dealsByDate = new Map<string, BrandDeal[]>();
  for (const deal of items) if (deal.deadline) {
    const list = dealsByDate.get(deal.deadline) ?? [];
    list.push(deal); dealsByDate.set(deal.deadline, list);
  }

  return <>
    <PageHead eyebrow="Pillar 3 · Business" title="Brand deals 🤝" subtitle="Track pitches, contracts, usage rights and payments end-to-end."
      actions={[
        <div key="seg" className="segmented" style={{ padding: 3 }}><button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')} aria-label="Table view"><Table2 size={15}/></button><button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')} aria-label="Calendar view"><Calendar size={15}/></button></div>,
        <button key="add" className="btn primary" onClick={() => { setEditorId(null); setEditing(emptyDeal()); }}><Plus size={16}/> New deal</button>,
      ]} />

    {view === 'table' ? (
      <section className="section-block">
        <div className="board-toolbar">
          <Field label="Status"><select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All statuses</option>{alpha(DEAL_STATUSES).map((s) => <option key={s} value={s}>{cap(s)}</option>)}</select></Field>
          <div className="spacer"/>
          <span className="hint">💧 Pipeline: {formatMoney(items.filter((d) => d.status !== 'declined').reduce((sum, d) => sum + (d.deal_value ?? 0), 0))} total value</span>
        </div>
        {visible.length === 0 ? <EmptyState emoji="🤝" title="No deals yet" note="Log every pitch, then update the probability and let the pipeline value do the math."/> :
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Brand</th><th>Contact</th><th>Value</th><th>Prob.</th><th>Status</th><th>Payment</th><th>Deadline</th><th /></tr></thead><tbody>{visible.map((deal) => (
            <tr key={deal.id}>
              <td><strong>{deal.brand_name}</strong><div className="muted" style={{ fontSize: 10.5 }}>{deal.platform ?? ''}</div></td>
              <td>{deal.contact_name ? <>{deal.contact_name}<div className="muted" style={{ fontSize: 10.5 }}>{deal.contact_email}</div></> : '·'}</td>
              <td>{formatMoney(deal.deal_value ?? 0, deal.currency)}</td>
              <td>{deal.estimated_probability}%</td>
              <td><Pill color={STATUS_COLOR[deal.status] ?? 'gray'}>{deal.status}</Pill></td>
              <td><Pill color={deal.payment_status === 'paid' ? 'mint' : deal.payment_status === 'partial' ? 'yellow' : 'peach'}>{deal.payment_status}</Pill></td>
              <td style={{ whiteSpace: 'nowrap' }}>{deal.deadline ?? '·'}{deal.follow_up_date ? <div className="muted" style={{ fontSize: 10.5 }}>follow-up {deal.follow_up_date}</div> : null}</td>
              <td><div className="row" style={{ gap: 6 }}><button className="icon-btn" onClick={() => { setEditorId(deal.id); setEditing({ ...deal }); }} aria-label="Edit deal">✏️</button><button className="icon-btn" onClick={() => confirmDelete(() => void remove(deal.id))} aria-label="Delete deal"><Trash2 size={14}/></button></div></td>
            </tr>
          ))}</tbody></table></div>}
      </section>
    ) : (
      <section className="section-block">
        <div className="board-toolbar">
          <div className="row" style={{ gap: 8 }}>
            <button className="icon-btn" onClick={() => setMonth(subMonth(month))} aria-label="Previous month"><ChevronLeft size={16}/></button>
            <strong style={{ minWidth: 150, textAlign: 'center', color: '#7047a4' }}>{format(month, 'MMMM yyyy')}</strong>
            <button className="icon-btn" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month"><ChevronRight size={16}/></button>
          </div>
          <div className="spacer"/>
          <span className="hint">Days with deal deadlines are highlighted</span>
        </div>
        <div className="weekday-row">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <span key={d}>{d}</span>)}</div>
        <div className="calendar-grid" style={{ gap: 6 }}>
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayDeals = dealsByDate.get(key) ?? [];
            const inMonth = isSameMonth(day, month);
            return <div key={key} className={cx('calendar-day', !inMonth && 'outside')} style={{ minHeight: 84 }}>
              <span className="day-number">{format(day, 'd')}</span>
              <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                {dayDeals.slice(0, 2).map((d) => <span key={d.id} className="score" style={{ fontSize: 9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>🤝 {d.brand_name}</span>)}
                {dayDeals.length > 2 && <span className="score muted" style={{ fontSize: 9 }}>+{dayDeals.length - 2} more</span>}
              </div>
            </div>;
          })}
        </div>
      </section>
    )}
  {editing && <Modal title={editorId ? 'Edit deal' : 'New brand deal'} onClose={() => setEditing(null)} wide
      footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn primary" onClick={() => void save()}><Wallet size={15}/> Save deal</button></div>}>
      <div className="grid" style={{ gap: 14 }}>
        <FormRow>
          <Field label="Brand name *"><input className="input" value={editing.brand_name} onChange={(e) => setEditing({ ...editing, brand_name: e.target.value })}/></Field>
          <Field label="Platform"><select className="select" value={editing.platform ?? 'tiktok'} onChange={(e) => setEditing({ ...editing, platform: e.target.value })}>{alpha(PLATFORMS).map((p) => <option key={p} value={p}>{cap(p)}</option>)}</select></Field>
        </FormRow>
        <FormRow>
          <Field label="Contact name"><input className="input" value={editing.contact_name ?? ''} onChange={(e) => setEditing({ ...editing, contact_name: e.target.value })}/></Field>
          <Field label="Contact email"><input type="email" className="input" value={editing.contact_email ?? ''} onChange={(e) => setEditing({ ...editing, contact_email: e.target.value })}/></Field>
        </FormRow>
        <FormRow>
          <Field label="Deal value"><input type="number" className="input" min={0} value={editing.deal_value ?? 0} onChange={(e) => setEditing({ ...editing, deal_value: Number(e.target.value) })}/></Field>
          <Field label="Currency"><select className="select" value={editing.currency} onChange={(e) => setEditing({ ...editing, currency: e.target.value })}>{alphaBy(CURRENCIES, (c) => c.name).map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code} · {c.name}</option>)}</select></Field>
          <Field label="Estimated probability %"><input type="number" className="input" min={0} max={100} value={editing.estimated_probability} onChange={(e) => setEditing({ ...editing, estimated_probability: Number(e.target.value) })}/></Field>
        </FormRow>
        <FormRow>
          <Field label="Status"><select className="select" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>{alpha(DEAL_STATUSES).map((s) => <option key={s} value={s}>{cap(s)}</option>)}</select></Field>
          <Field label="Payment"><select className="select" value={editing.payment_status} onChange={(e) => setEditing({ ...editing, payment_status: e.target.value })}>{alpha(PAYMENT_STATUSES).map((s) => <option key={s} value={s}>{cap(s)}</option>)}</select></Field>
          <Field label="Usage rights"><select className="select" value={editing.rights_period ?? ''} onChange={(e) => setEditing({ ...editing, rights_period: e.target.value || null })}><option value="">Custom</option>{alpha(RIGHTS_PERIODS).map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
        </FormRow>
        <FormRow>
          <Field label="Pitch date"><input type="date" className="date-input" value={editing.pitch_date ?? ''} onChange={(e) => setEditing({ ...editing, pitch_date: e.target.value || null })}/></Field>
          <Field label="Follow-up date"><input type="date" className="date-input" value={editing.follow_up_date ?? ''} onChange={(e) => setEditing({ ...editing, follow_up_date: e.target.value || null })}/></Field>
          <Field label="Deadline"><input type="date" className="date-input" value={editing.deadline ?? ''} onChange={(e) => setEditing({ ...editing, deadline: e.target.value || null })}/></Field>
        </FormRow>
        <Field label="Deliverables"><textarea className="textarea" value={editing.deliverables ?? ''} onChange={(e) => setEditing({ ...editing, deliverables: e.target.value })} placeholder="e.g. 1 Reel + 1 static + 30-day organic usage"/></Field>
        <Field label="Usage rights / contract terms"><textarea className="textarea" value={editing.usage_rights ?? ''} onChange={(e) => setEditing({ ...editing, usage_rights: e.target.value })} placeholder="Whitelisting, exclusivity, ad-use period…"/></Field>
        <Field label="Notes"><textarea className="textarea" value={editing.notes ?? ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })}/></Field>
      </div>
    </Modal>}
  </>;
}

function subMonth(date: Date): Date { return addMonths(date, -1); }