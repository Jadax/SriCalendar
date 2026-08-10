import { useMemo, type ReactElement } from 'react';
import { useCollection } from '../../../hooks/useCollection';
import { StatCard } from '../shared/primitives';
import { formatMoneyCompact, getBaseCurrency, toUsd, fromUsd } from '../../../utils/money';

interface Props { userId: string }

/** PILLAR 3.1 — business dashboard summary cards. */
export function BusinessDashboard({ userId }: Props): ReactElement {
  const deals = useCollection('brand_deals', userId);
  const invoices = useCollection('invoices', userId);
  const board = useCollection('production_board', userId);
  const base = getBaseCurrency();

  const activeDeals = deals.items.filter((d) => d.status !== 'declined');
  const pipelineValue = fromUsd(activeDeals.reduce((sum, d) => sum + toUsd(d.deal_value ?? 0, d.currency) * ((d.estimated_probability ?? 0) / 100), 0), base);
  const paidValue = fromUsd(invoices.items.filter((i) => i.status === 'paid').reduce((sum, i) => sum + toUsd(i.total ?? 0, i.currency), 0), base);
  const thisMonthValue = useMemo(() => {
    const now = new Date();
    const thisMonthUsd = invoices.items.filter((i) => { const d = new Date(i.issue_date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((sum, i) => sum + toUsd(i.total ?? 0, i.currency), 0);
    return fromUsd(thisMonthUsd, base);
  }, [invoices.items, base]);
  const pendingInvoices = invoices.items.filter((i) => i.status === 'overdue' || (i.status === 'sent' && new Date(i.due_date).getTime() < Date.now())).length;
  const published = board.items.filter((c) => c.column_name === 'published').length;
  const upcoming = activeDeals
    .filter((d) => d.deadline && new Date(d.deadline).getTime() >= Date.now())
    .sort((a, b) => new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime())
    .slice(0, 5);
  const stalePitches = activeDeals.filter((d) => d.pitch_date && new Date(d.pitch_date).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000 && (d.status === 'cold' || d.status === 'contacted')).length;

  return <div className="grid" style={{ gap: 16 }}>
    <div className="grid grid-4">
      <StatCard emoji="🤝" label="Active deals" value={String(activeDeals.length)} note={`${stalePitches} stale pitch${stalePitches === 1 ? '' : 'es'} to follow up`} />
      <StatCard emoji="💎" label="Pipeline value" value={formatMoneyCompact(pipelineValue, base)} note="Deal value × probability" />
      <StatCard emoji="💰" label="Revenue this month" value={formatMoneyCompact(thisMonthValue, base)} />
      <StatCard emoji="💸" label="Paid (all time)" value={formatMoneyCompact(paidValue, base)} note={`${pendingInvoices} overdue/late invoice${pendingInvoices === 1 ? '' : 's'}`} />
    </div>
    <div className="grid grid-2">
      <StatCard emoji="🚀" label="Published posts" value={String(published)} note="From the production board" />
      <section className="section-block">
        <div className="block-head"><h2 style={{ fontSize: 15 }}>📅 Upcoming deal deadlines</h2></div>
        {upcoming.length === 0 ? <p className="muted" style={{ fontSize: 12 }}>No upcoming deadlines. Enjoy the calm.</p> :
          <div className="timeline">
            {upcoming.map((d) => <div key={d.id} className="tl-item"><span className="tl-dot">📁</span><div className="tl-body"><strong style={{ fontSize: 13, color: '#5d4f79' }}>{d.brand_name}</strong><p className="card-sub">{d.deadline} · {formatMoneyCompact(d.deal_value ?? 0, d.currency)} · <b>{d.status}</b></p></div></div>)}
          </div>}
      </section>
    </div>
  </div>;
}