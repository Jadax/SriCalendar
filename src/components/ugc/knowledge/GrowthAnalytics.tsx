import { useMemo, useState, type ReactElement } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCollection } from '../../../hooks/useCollection';
import { PLATFORMS } from '../../../data/options';
import { CURRENCIES, formatMoney, getBaseCurrency, fromUsd, toUsd } from '../../../utils/money';
import { EmptyState, Field, FormRow, Modal, PageHead, Pill, StatCard, confirmDelete } from '../shared/primitives';
import type { AnalyticsEntry } from '../../../types/ugc';

interface Props { userId: string }

const empty = (): Omit<AnalyticsEntry, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'> => ({ platform: 'tiktok', date: new Date().toISOString().slice(0, 10), followers: 0, views: 0, likes: 0, comments: 0, shares: 0, saves: 0, engagement_rate: 0, reach: 0, revenue: 0, currency: 'USD', notes: '' });

const erOf = (e: Pick<AnalyticsEntry, 'likes' | 'comments' | 'shares' | 'saves' | 'followers'>): number => (e.followers > 0 ? ((e.likes + e.comments + e.shares + e.saves) / e.followers) * 100 : 0);

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** PILLAR 4.2 — growth analytics with auto-calculated engagement and trend charts. */
export function GrowthAnalytics({ userId }: Props): ReactElement {
  const { items, add, update, remove } = useCollection('analytics', userId);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [editing, setEditing] = useState<Omit<AnalyticsEntry, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'> | null>(null);
  const [editorId, setEditorId] = useState<string | null>(null);

  const filtered = useMemo(() => items.filter((e) => (platformFilter === 'all' ? true : e.platform === platformFilter)).sort((a, b) => a.date.localeCompare(b.date)), [items, platformFilter]);

  const timeSeries = useMemo(() => {
    const map = new Map<string, AnalyticsEntry>();
    for (const e of filtered.filter((x) => x.followers > 0 || x.views > 0)) map.set(e.date, e);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, e]) => ({ date: date.slice(5), followers: e.followers, views: e.views, engagement: Number(erOf(e).toFixed(2)) }));
  }, [filtered]);

  const engagementSeries = useMemo(() => filtered.filter((e) => e.followers > 0).map((e) => ({ date: e.date.slice(5), platform: e.platform, er: Number(erOf(e).toFixed(2)) })).slice(-30), [filtered]);

  const latestFollowers = useMemo(() => {
    const latest = new Map<string, number>();
    for (const e of items) latest.set(e.platform, e.followers);
    return [...latest.values()].reduce((a, b) => a + b, 0);
  }, [items]);

  const avgEr = useMemo(() => {
    const rows = items.filter((e) => e.followers > 0);
    return rows.length ? rows.reduce((s, e) => s + erOf(e), 0) / rows.length : 0;
  }, [items]);
  const totalViews = items.reduce((s, e) => s + e.views, 0);
  const base = getBaseCurrency();
  const revenueBase = fromUsd(items.reduce((s, e) => s + toUsd(e.revenue, e.currency ?? 'USD'), 0), base);

  const save = async (): Promise<void> => {
    if (!editing) return;
    const er = Number(erOf(editing).toFixed(2));
    const clean = { ...editing, engagement_rate: er };
    if (editorId) await update(editorId, clean as never);
    else await add(clean as never);
    setEditing(null); setEditorId(null);
  };

  return <>
    <PageHead eyebrow="Pillar 4 · Knowledge" title="Growth analytics 📈" subtitle="Track the numbers that actually matter — engagement rate auto-computes for you."
      actions={[<button key="add" className="btn primary" onClick={() => { setEditorId(null); setEditing(empty()); }}><Plus size={16}/> Log metrics</button>]} />

    <div className="grid grid-4">
      <StatCard emoji="👥" label="Followers" value={formatCompact(latestFollowers)} note="Latest per platform" />
      <StatCard emoji="❤️" label="Avg engagement" value={`${avgEr.toFixed(2)}%`} note="(L+C+S+Sv) ÷ followers · strong 3–5%" />
      <StatCard emoji="👀" label="Total views" value={formatCompact(totalViews)} />
      <StatCard emoji="💰" label="Revenue logged" value={formatMoney(revenueBase, base, 0)} />
    </div>

    <div className="grid grid-2">
      <section className="section-block">
        <div className="block-head"><h2 style={{ fontSize: 15 }}>👥 Followers & views trend</h2><span className="hint">latest value per day</span></div>
        <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={timeSeries} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="rgba(139,126,200,.18)"/><XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7a7289' }}/><YAxis tick={{ fontSize: 10, fill: '#7a7289' }} /><Tooltip contentStyle={{ borderRadius: 14, border: '1px solid rgba(139,126,200,.2)', fontSize: 12 }} /><Legend/><Area type="monotone" dataKey="followers" stroke="#f54f86" fill="rgba(245,79,134,.18)" strokeWidth={2}/><Area type="monotone" dataKey="views" stroke="#8068b0" fill="rgba(128,104,176,.16)" strokeWidth={2}/></AreaChart></ResponsiveContainer></div>
      </section>
      <section className="section-block">
        <div className="block-head"><h2 style={{ fontSize: 15 }}>❤️ Engagement rate (ER)</h2><span className="hint">last 30 logs</span></div>
        <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={engagementSeries} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="rgba(139,126,200,.18)"/><XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7a7289' }} interval="preserveStartEnd"/><YAxis tick={{ fontSize: 10, fill: '#7a7289' }} unit="%"/><Tooltip contentStyle={{ borderRadius: 14, border: '1px solid rgba(139,126,200,.2)', fontSize: 12 }} /><Bar dataKey="er" name="ER" fill="#9de5ca" radius={[6, 6, 0, 0]}/></BarChart></ResponsiveContainer></div>
      </section>
    </div>

    <section className="section-block">
      <div className="board-toolbar">
        <Field label="Platform"><select className="select" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}><option value="all">All platforms</option>{PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}</select></Field>
        <div className="spacer"/><span className="hint">{filtered.length} log entries</span>
      </div>
      {filtered.length === 0 ? <EmptyState emoji="📈" title="No metrics yet" note="Log daily or weekly numbers per platform. Engagement rate is computed automatically."/> :
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Date</th><th>Platform</th><th>Followers</th><th>Views</th><th>L/C/S</th><th>ER</th><th>Revenue</th><th /></tr></thead><tbody>{[...filtered].reverse().map((e) => (
          <tr key={e.id}>
            <td>{e.date}</td>
            <td><Pill color="lavender">{e.platform}</Pill></td>
            <td>{e.followers.toLocaleString()}</td>
            <td>{e.views.toLocaleString()}</td>
            <td>{e.likes + e.comments + e.shares + e.saves}</td>
            <td><b style={{ color: erOf(e) >= 3 ? '#43846b' : erOf(e) >= 1 ? '#b4642f' : '#c03a67' }}>{erOf(e).toFixed(2)}%</b></td>
            <td>{e.revenue ? formatMoney(e.revenue, e.currency ?? 'USD') : '—'}</td>
            <td><div className="row" style={{ gap: 6 }}><button className="icon-btn" onClick={() => { setEditorId(e.id); setEditing({ ...e }); }} aria-label="Edit entry">✏️</button><button className="icon-btn" onClick={() => confirmDelete(() => void remove(e.id))} aria-label="Delete entry"><Trash2 size={14}/></button></div></td>
          </tr>
        ))}</tbody></table></div>}
    </section>

    {editing && <Modal title={editorId ? 'Edit metrics' : 'Log metrics'} onClose={() => setEditing(null)} wide
      footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn primary" onClick={() => void save()}>Save metrics</button></div>}>
      <div className="grid" style={{ gap: 14 }}>
        <FormRow>
          <Field label="Platform"><select className="select" value={editing.platform} onChange={(e) => setEditing({ ...editing, platform: e.target.value })}>{PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}</select></Field>
          <Field label="Date"><input type="date" className="date-input" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })}/></Field>
        </FormRow>
        <FormRow>
          <Field label="Followers"><input type="number" className="input" min={0} value={editing.followers} onChange={(e) => setEditing({ ...editing, followers: Number(e.target.value) })}/></Field>
          <Field label="Views"><input type="number" className="input" min={0} value={editing.views} onChange={(e) => setEditing({ ...editing, views: Number(e.target.value) })}/></Field>
          <Field label="Reach"><input type="number" className="input" min={0} value={editing.reach} onChange={(e) => setEditing({ ...editing, reach: Number(e.target.value) })}/></Field>
        </FormRow>
        <FormRow>
          <Field label="Likes"><input type="number" className="input" min={0} value={editing.likes} onChange={(e) => setEditing({ ...editing, likes: Number(e.target.value) })}/></Field>
          <Field label="Comments"><input type="number" className="input" min={0} value={editing.comments} onChange={(e) => setEditing({ ...editing, comments: Number(e.target.value) })}/></Field>
          <Field label="Shares"><input type="number" className="input" min={0} value={editing.shares} onChange={(e) => setEditing({ ...editing, shares: Number(e.target.value) })}/></Field>
          <Field label="Saves"><input type="number" className="input" min={0} value={editing.saves} onChange={(e) => setEditing({ ...editing, saves: Number(e.target.value) })}/></Field>
        </FormRow>
        <FormRow>
          <Field label="Revenue"><input type="number" className="input" min={0} value={editing.revenue} onChange={(e) => setEditing({ ...editing, revenue: Number(e.target.value) })}/></Field>
          <Field label="Currency"><select className="select" value={editing.currency ?? 'USD'} onChange={(e) => setEditing({ ...editing, currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}</select></Field>
          <Field label="Engagement rate (auto)"><input className="input" value={`${erOf(editing).toFixed(2)}%`} disabled/></Field>
        </FormRow>
        <Field label="Notes"><input className="input" value={editing.notes ?? ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} placeholder="Campaign, content type, context…"/></Field>
      </div>
    </Modal>}
  </>;
}