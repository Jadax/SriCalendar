import { useMemo, type ReactElement } from 'react';
import { format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCollection } from '../../../hooks/useCollection';
import { formatMoneyCompact, fromUsd, getBaseCurrency, toUsd } from '../../../utils/money';
import { EmptyState, PageHead, Pill, SectionBlock, StatCard } from '../shared/primitives';
import { funnelStages, funnelStats, monthKeys, projectCashFlow } from '../../../lib/moneyFlow';

interface Props { userId: string }

const monthLabel = (key: string): string => {
  const [y = 0, m = 1] = key.split('-').map(Number);
  return format(new Date(y, m - 1, 1), 'MMM');
};

const CHART_COLORS: Record<string, string> = { mint: '#6ee7b7', lavender: '#a78bfa', pink: '#f9a8d4' };

function chartLegend(name: string, color: string, hint: string): ReactElement {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#54525e', fontSize: 12 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: CHART_COLORS[color], display: 'inline-block' }} />{name} <span className="hint">· {hint}</span></span>;
}

/** PILLAR 3.5B — money flow: the deal funnel, conversion and a 6-month cash-flow projection. */
export function MoneyFlow({ userId }: Props): ReactElement {
  const deals = useCollection('brand_deals', userId);
  const invoices = useCollection('invoices', userId);

  const base = getBaseCurrency();
  const fmt = (usd: number): string => formatMoneyCompact(fromUsd(usd, base), base);

  const data = useMemo(() => {
    const months = monthKeys(new Date(), 6);
    const stages = funnelStages(deals.items);
    const stats = funnelStats(deals.items, invoices.items);
    const projection = projectCashFlow(deals.items, invoices.items, months);
    const monthData = projection.rows.map((r) => ({
      month: monthLabel(r.month),
      invoiced: r.invoicedUsd,
      expected: r.expectedUsd,
      paid: r.paidUsd,
    }));
    const incoming90 = projection.rows.slice(0, 3).reduce((s, r) => s + r.invoicedUsd + r.expectedUsd, 0);
    const maxStage = Math.max(100, ...stages.map((s) => s.valueUsd));
    return { stages, stats, projection, monthData, incoming90, maxStage };
  }, [deals.items, invoices.items]);

  const { stages, stats, projection, monthData, incoming90, maxStage } = data;
  const empty = deals.items.length === 0 && invoices.items.length === 0;

  return <div className="ugc-page">
    <PageHead eyebrow="Business · Money" title="Money Flow 💸" subtitle="See every deal as part of a funnel, and what money you can expect month by month." />

    <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
      <StatCard emoji="📥" label="Incoming · next 90 days" value={fmt(incoming90)} note="invoiced due + expected from open deals" />
      <StatCard emoji="🏆" label="Win rate" value={stats.winRate === null ? '—' : `${Math.round(stats.winRate * 100)}%`} note={stats.winRate === null ? 'no deals decided yet' : 'booked + delivered ÷ decided'} />
      <StatCard emoji="💼" label="Avg closed deal" value={stats.avgClosedUsd === null ? '—' : fmt(stats.avgClosedUsd)} note="booked + delivered deals only" />
      <StatCard emoji="🧾" label="Outstanding invoices" value={fmt(stats.outstandingUsd)} note={stats.outstandingUsd > 0 ? 'counted at full value' : 'nothing waiting'} />
    </div>

    {empty && <EmptyState emoji="💸" title="No money in the funnel yet" note="Log your first brand deal or invoice and the pipeline, win rate and projection appear here."/>}

    {!empty && <>
      <SectionBlock title="⚗️ Deal funnel" hint={`${deals.items.length} deal${deals.items.length === 1 ? '' : 's'} · value in ${base}`}>
        <div className="grid" style={{ gap: 8 }}>
          {stages.map((s) => (
            <div key={s.id} className="row" style={{ gap: 10, alignItems: 'center' }}>
              <span style={{ minWidth: 110, fontSize: 13, fontWeight: 600, color: '#413e4d' }}>{s.emoji} {s.label}</span>
              <div style={{ flex: 1, height: 20, background: '#f1eef9', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.max(s.valueUsd > 0 ? 3 : 0, (s.valueUsd / maxStage) * 100)}%`, background: s.id === 'declined' ? '#e0ddea' : '#b8a4f2', borderRadius: 8 }} />
              </div>
              <span style={{ minWidth: 26, textAlign: 'right', fontWeight: 700, fontSize: 13 }}>×{s.count}</span>
              <span style={{ minWidth: 84, textAlign: 'right', fontSize: 12, color: '#8b879b' }}>{fmt(s.valueUsd)}</span>
            </div>
          ))}
        </div>
        <div className="row" style={{ gap: 8, marginTop: 12 }}>
          <Pill color="lavender">Expected value {fmt(stats.expectedUsd)}</Pill>
          <Pill color="sky">Open deals worth {fmt(stats.activeUsd)}</Pill>
        </div>
      </SectionBlock>

      <SectionBlock title="📈 Cash-flow projection" hint={`next 6 months · paid vs invoiced vs expected (probability-weighted)`}>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthData} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#efeaf8" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#8b879b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#a7a1b5' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number | string) => fmt(Number(v ?? 0))} contentStyle={{ borderRadius: 12, border: '1px solid #e6e0f2', fontSize: 12 }} />
              <Bar dataKey="invoiced" name="Invoiced due" fill={CHART_COLORS.pink} radius={[5, 5, 0, 0]} />
              <Bar dataKey="expected" name="Expected from deals" fill={CHART_COLORS.lavender} radius={[5, 5, 0, 0]} />
              <Bar dataKey="paid" name="Paid" fill={CHART_COLORS.mint} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {projection.ungatedUsd > 0 && <p style={{ fontSize: 12, color: '#8b879b', marginTop: 6 }}>Deals without a deadline hold an extra {fmt(projection.ungatedUsd)}. Set their deadline to see it appear on the calendar.</p>}
        <div className="table-wrap" style={{ marginTop: 10 }}><table className="data-table"><thead><tr><th>Month</th><th>Paid</th><th>Invoiced due</th><th>Expected from deals</th><th>Total ahead</th></tr></thead><tbody>
          {projection.rows.map((r) => (
            <tr key={r.month}>
              <td><strong>{monthLabel(r.month)}</strong></td>
              <td>{r.paidUsd > 0 ? fmt(r.paidUsd) : <span className="hint">—</span>}</td>
              <td>{r.invoicedUsd > 0 ? fmt(r.invoicedUsd) : <span className="hint">—</span>}</td>
              <td>{r.expectedUsd > 0 ? fmt(r.expectedUsd) : <span className="hint">—</span>}</td>
              <td><strong>{r.invoicedUsd + r.expectedUsd > 0 ? fmt(r.invoicedUsd + r.expectedUsd) : <span className="hint">—</span>}</strong></td>
            </tr>
          ))}
        </tbody></table></div>
        <div className="row" style={{ gap: 18, marginTop: 10, flexWrap: 'wrap' }}>
          {chartLegend('Invoiced due', 'pink', 'one of these is cash, chase it early')}
          {chartLegend('Expected from deals', 'lavender', 'probability-weighted by deadline month')}
          {chartLegend('Paid', 'mint', 'already in the bank')}
        </div>
      </SectionBlock>
    </>}
  </div>;
}