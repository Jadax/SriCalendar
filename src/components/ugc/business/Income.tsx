import { useMemo, useState, type ReactElement } from 'react';
import { addMonths, format, startOfMonth } from 'date-fns';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { PLATFORMS, cap } from '../../../data/options';
import { CURRENCIES, formatMoney, fromUsd, getBaseCurrency, setBaseCurrency, streamMeta, toUsd } from '../../../utils/money';
import { EmptyState, Field, FormRow, PageHead, Pill, StatCard } from '../shared/primitives';
import type { Invoice } from '../../../types/ugc';

interface Props { userId: string }

const TIERS = [
  { id: 'lt1k', label: '< 1K followers', mult: 0.5 },
  { id: '1k10k', label: '1K – 10K', mult: 1 },
  { id: '10k50k', label: '10K – 50K', mult: 1.6 },
  { id: '50k100k', label: '50K – 100K', mult: 2.2 },
  { id: '100k500k', label: '100K – 500K', mult: 3 },
  { id: '500k1m', label: '500K – 1M', mult: 4.5 },
  { id: '1mplus', label: '1M+', mult: 6 },
] as const;

const NICHES = [
  { id: 'general', label: 'General', mult: 1 },
  { id: 'beauty', label: 'Beauty / fashion', mult: 1.25 },
  { id: 'finance', label: 'Finance / business', mult: 1.25 },
  { id: 'health', label: 'Health / wellness', mult: 1.15 },
  { id: 'food', label: 'Food / travel', mult: 1.05 },
  { id: 'gaming', label: 'Gaming / tech', mult: 0.9 },
] as const;

const RIGHTS = [
  { id: 'organic', label: '30-day organic', mult: 1 },
  { id: 'whitelist', label: '90-day whitelisting + paid ads', mult: 1.25 },
  { id: '6mo', label: '6 months full rights', mult: 1.5 },
  { id: '12mo', label: '12 months full rights', mult: 1.75 },
  { id: 'perpetual', label: 'Perpetual full rights', mult: 2 },
] as const;

const PLATFORM_MULT: Record<string, number> = { tiktok: 1.1, instagram: 1, youtube: 1.2, linkedin: 1.05, pinterest: 0.8, shorts: 1.05, reels: 1, x: 0.9, newsletter: 1.15, podcast: 1.1 };
const BASE_PRICE = 150;
const EXTRA_PER_DELIVERABLE = 90;

const inBase = (amount: number, currency: string, base: string): number => fromUsd(toUsd(amount, currency), base);

/** PILLAR 3.5 — income overview, per-stream revenue, a pricing calculator and overdue nudge. */
export function Income({ userId }: Props): ReactElement {
  const invoices = useCollection('invoices', userId);
  const deals = useCollection('brand_deals', userId);
  const [base, setBase] = useState(() => getBaseCurrency());

  const changeBase = (code: string): void => { setBaseCurrency(code); setBase(code); };

  const stats = useMemo(() => {
    const now = new Date();
    const paid = invoices.items.filter((i) => i.status === 'paid');
    const outstanding = invoices.items.filter((i) => i.status === 'overdue' || (i.status === 'sent' && new Date(i.due_date).getTime() < Date.now()));
    const thisMonthPaid = paid.filter((i) => { const d = new Date(i.issue_date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    const activeDeals = deals.items.filter((d) => d.status !== 'declined' && d.status !== 'delivered');
    return {
      thisMonth: thisMonthPaid.reduce((s, i) => s + inBase(i.total ?? 0, i.currency, base), 0),
      outstanding: outstanding.reduce((s, i) => s + inBase(i.total ?? 0, i.currency, base), 0),
      outstandingCount: outstanding.length,
      pipeline: activeDeals.reduce((s, d) => s + inBase(d.deal_value ?? 0, d.currency, base) * ((d.estimated_probability ?? 0) / 100), 0),
      allTime: paid.reduce((s, i) => s + inBase(i.total ?? 0, i.currency, base), 0),
      overdue: outstanding,
    };
  }, [invoices.items, deals.items, base]);

  const monthly = useMemo(() => {
    const now = startOfMonth(new Date());
    const points = Array.from({ length: 6 }, (_v, i) => { const m = addMonths(now, i - 5); return { key: format(m, 'yyyy-MM'), label: format(m, 'MMM') }; });
    return points.map((p) => {
      const inMonth = invoices.items.filter((i) => i.issue_date.slice(0, 7) === p.key && i.status !== 'draft');
      return {
        label: p.label,
        issued: Math.round(inMonth.reduce((s, i) => s + inBase(i.total ?? 0, i.currency, base), 0)),
        collected: Math.round(inMonth.filter((i) => i.status === 'paid').reduce((s, i) => s + inBase(i.total ?? 0, i.currency, base), 0)),
      };
    });
  }, [invoices.items, base]);

  const byStream = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of invoices.items.filter((inv) => inv.status === 'paid')) {
      const id = i.stream ?? 'other';
      map.set(id, (map.get(id) ?? 0) + inBase(i.total ?? 0, i.currency, base));
    }
    const rows = [...map.entries()].map(([id, value]) => ({ ...streamMeta(id), value })).sort((a, b) => b.value - a.value);
    const total = rows.reduce((s, r) => s + r.value, 0);
    return { rows, total };
  }, [invoices.items, base]);

  const markPaid = (invoice: Invoice): void => { void invoices.update(invoice.id, { status: 'paid' } as never); };

  const [tier, setTier] = useState<string>(TIERS[1].id);
  const [niche, setNiche] = useState<string>(NICHES[0].id);
  const [platform, setPlatform] = useState('tiktok');
  const [rights, setRights] = useState<string>(RIGHTS[0].id);
  const [deliverables, setDeliverables] = useState(1);
  const [calcCur, setCalcCur] = useState(() => getBaseCurrency());

  const quote = useMemo(() => {
    const baseRate = BASE_PRICE
      * (TIERS.find((t) => t.id === tier)?.mult ?? 1)
      * (NICHES.find((n) => n.id === niche)?.mult ?? 1)
      * (PLATFORM_MULT[platform] ?? 1)
      * (RIGHTS.find((r) => r.id === rights)?.mult ?? 1);
    const extras = Math.max(0, deliverables - 1) * EXTRA_PER_DELIVERABLE;
    const low = baseRate + extras;
    const high = baseRate * 1.7 + extras;
    return { low, high, usdLow: low, usdHigh: high };
  }, [tier, niche, platform, rights, deliverables]);

  return <>
    <PageHead eyebrow="Pillar 3 · Business" title="Income 💗" subtitle="Every stream, every currency, one sweet summary. Plus a rate calculator so you never underprice."
      actions={[
        <div key="cur" className="row" style={{ gap: 8 }}>
          <span className="hint" style={{ display: 'inline-flex', alignItems: 'center' }}>Report in</span>
          <select className="select" style={{ width: 170 }} value={base} onChange={(e) => changeBase(e.target.value)} aria-label="Base currency">
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code} · {c.name}</option>)}
          </select>
        </div>,
      ]} />

    <div className="grid grid-4">
      <StatCard emoji="💰" label="Collected this month" value={formatMoney(stats.thisMonth, base)} note="Paid invoices issued this month" />
      <StatCard emoji="⏳" label="Outstanding" value={formatMoney(stats.outstanding, base)} note={`${stats.outstandingCount} overdue or late invoice${stats.outstandingCount === 1 ? '' : 's'}`} />
      <StatCard emoji="💎" label="Deal pipeline" value={formatMoney(stats.pipeline, base)} note="Active deals × probability" />
      <StatCard emoji="🏦" label="Collected (all time)" value={formatMoney(stats.allTime, base)} note="Every paid invoice, converted" />
    </div>

    <div className="grid grid-2">
      <section className="section-block">
        <div className="block-head"><h2 style={{ fontSize: 15 }}>📊 Last 6 months</h2><span className="hint">issued vs collected</span></div>
        <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly} margin={{ top: 6, right: 8, left: -4, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="rgba(139,126,200,.18)"/><XAxis dataKey="label" tick={{ fontSize: 10, fill: '#7a7289' }}/><YAxis tick={{ fontSize: 10, fill: '#7a7289' }} /><Tooltip contentStyle={{ borderRadius: 14, border: '1px solid rgba(139,126,200,.2)', fontSize: 12 }} /><Legend/><Bar dataKey="issued" name="Issued" fill="#c9b8f7" radius={[6, 6, 0, 0]}/><Bar dataKey="collected" name="Collected" fill="#f7a8c4" radius={[6, 6, 0, 0]}/></BarChart></ResponsiveContainer></div>
        <p className="hint" style={{ marginTop: 8 }}>Everything is converted into your base currency. Edit deals & invoices to tag the real one.</p>
      </section>

      <section className="section-block">
        <div className="block-head"><h2 style={{ fontSize: 15 }}>🌸 Income by stream</h2><span className="hint">paid invoices</span></div>
        {byStream.rows.length === 0 ? <EmptyState emoji="🌸" title="No paid income yet" note="Mark an invoice paid to start seeing your streams bloom."/> :
          <div className="grid" style={{ gap: 10 }}>
            {byStream.rows.map((row) => {
              const pct = byStream.total ? Math.round((row.value / byStream.total) * 100) : 0;
              return <div key={row.id}><div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12.5, color: '#5d4f79' }}>{row.emoji} {row.label}</span>
                <strong style={{ fontSize: 12.5, color: '#7047a4' }}>{formatMoney(row.value, base)} · {pct}%</strong>
              </div><div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#f7a8c4,#c9b8f7)' }}/></div></div>;
            })}
          </div>}
      </section>
    </div>

    <div className="grid grid-2">
      <section className="section-block">
        <div className="block-head"><h2 style={{ fontSize: 15 }}>🧮 Rate calculator</h2><span className="hint">short-form UGC benchmarks, updated from the market</span></div>
        <div className="grid" style={{ gap: 12 }}>
          <FormRow>
            <Field label="Followers"><select className="select" value={tier} onChange={(e) => setTier(e.target.value)}>{TIERS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></Field>
            <Field label="Platform"><select className="select" value={platform} onChange={(e) => setPlatform(e.target.value)}>{PLATFORMS.map((p) => <option key={p} value={p}>{cap(p)}</option>)}</select></Field>
            <Field label="Niche"><select className="select" value={niche} onChange={(e) => setNiche(e.target.value)}>{NICHES.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}</select></Field>
          </FormRow>
          <FormRow>
            <Field label="Usage rights"><select className="select" value={rights} onChange={(e) => setRights(e.target.value)}>{RIGHTS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select></Field>
            <Field label="Deliverables (videos)"><input type="number" className="input" min={1} value={deliverables} onChange={(e) => setDeliverables(Math.max(1, Number(e.target.value)))}/></Field>
            <Field label="Show in"><select className="select" value={calcCur} onChange={(e) => setCalcCur(e.target.value)}>{CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}</select></Field>
          </FormRow>
          <div className="quote-card" style={{ textAlign: 'center' }}>
            <div className="row" style={{ justifyContent: 'center', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: '#7047a4' }}>{formatMoney(quote.low, calcCur, 0)}</span>
              <span style={{ fontSize: 16, color: 'var(--muted)' }}>–</span>
              <span style={{ fontSize: 26, fontWeight: 800, color: '#c22f6b' }}>{formatMoney(quote.high, calcCur, 0)}</span>
              <span className="hint">per project</span>
            </div>
            <p className="hint" style={{ marginTop: 6 }}>≈ {formatMoney(quote.usdLow, 'USD', 0)} – {formatMoney(quote.usdHigh, 'USD', 0)} · usage rights are your biggest lever. Don't give them away for free.</p>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="block-head"><h2 style={{ fontSize: 15 }}>⏰ Follow up & get paid</h2><span className="hint">overdue or past due</span></div>
        {stats.overdue.length === 0 ? <EmptyState emoji="🌤️" title="Nothing overdue" note="Sweet. Send gentle nudge emails before the due date to keep it that way."/> :
          <div className="timeline">
            {stats.overdue.map((i) => <div key={i.id} className="tl-item"><span className="tl-dot">🧾</span><div className="tl-body">
              <strong style={{ fontSize: 13, color: '#5d4f79' }}>{i.invoice_number} · {i.recipient_name}</strong>
              <p className="card-sub">{formatMoney(i.total ?? 0, i.currency)} · due {i.due_date} · <b style={{ color: '#c22f6b' }}>{i.status}</b></p>
              <button className="btn small soft" style={{ marginTop: 6 }} onClick={() => markPaid(i)}><CheckCircle2 size={13}/> Mark paid</button>
            </div></div>)}
          </div>}
        <p className="hint" style={{ marginTop: 10 }}>💡 Nudge script: "Hey, quick check that the invoice landed. Happy to hop on a call this week."</p>
      </section>
    </div>

    <section className="section-block">
      <div className="block-head"><h2 style={{ fontSize: 15 }}><Sparkles size={14}/> Creator income cheat-sheet</h2></div>
      <div className="grid grid-3" style={{ gap: 10 }}>
        <div className="ugc-card"><b style={{ fontSize: 13 }}>🤝 Brand deals</b><p className="card-sub">Start at {formatMoney(150, 'USD', 0)}+/video UGC. Raise 30–50% when you add paid-ads usage rights.</p></div>
        <div className="ugc-card"><b style={{ fontSize: 13 }}>🛍️ UGC marketplaces</b><p className="card-sub">20–40 videos/mo × 150–400 is a real retainer. Treat it like a product, not a favor.</p></div>
        <div className="ugc-card"><b style={{ fontSize: 13 }}>📦 Products + affiliates</b><p className="card-sub">The two most scalable streams. They don't scale with your time, they scale with your audience.</p></div>
        <div className="ugc-card"><b style={{ fontSize: 13 }}>🔁 Repurposing</b><p className="card-sub">One shoot → reel + TikTok + YouTube Short + carousel. More reach, zero extra filming cost.</p></div>
        <div className="ugc-card"><b style={{ fontSize: 13 }}>📄 License rights</b><p className="card-sub">Organic ≠ ads. Whitelisting and ad-use typically command 50–100% more.</p></div>
        <div className="ugc-card"><b style={{ fontSize: 13 }}>💳 Payment rails</b><p className="card-sub">Invoice in the client's currency, ask for Wise/PayPal/ACH, and always charge in yours when you can.</p></div>
      </div>
    </section>
  </>;
}
