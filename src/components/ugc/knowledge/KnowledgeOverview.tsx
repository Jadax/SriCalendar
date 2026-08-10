import { useMemo, type ReactElement } from 'react';
import { useCollection } from '../../../hooks/useCollection';
import { StatCard } from '../shared/primitives';
import { formatMoney, getBaseCurrency, fromUsd, toUsd } from '../../../utils/money';

interface Props { userId: string }

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
const erOf = (likes: number, comments: number, shares: number, saves: number, followers: number): number => (followers > 0 ? ((likes + comments + shares + saves) / followers) * 100 : 0);

/** PILLAR 4.0 — knowledge dashboard summary cards. */
export function KnowledgeOverview({ userId }: Props): ReactElement {
  const resources = useCollection('knowledge_base', userId);
  const pillars = useCollection('content_pillars', userId);
  const analytics = useCollection('analytics', userId);
  const goals = useCollection('goals', userId);

  const latestFollowers = useMemo(() => {
    const latest = new Map<string, number>();
    for (const e of analytics.items) latest.set(e.platform, e.followers);
    return [...latest.values()].reduce((a, b) => a + b, 0);
  }, [analytics.items]);

  const avgEr = useMemo(() => {
    const rows = analytics.items.filter((e) => e.followers > 0);
    return rows.length ? rows.reduce((s, e) => s + erOf(e.likes, e.comments, e.shares, e.saves, e.followers), 0) / rows.length : 0;
  }, [analytics.items]);

  const base = getBaseCurrency();
  const revenue = fromUsd(analytics.items.reduce((s, e) => s + toUsd(e.revenue, e.currency ?? 'USD'), 0), base);
  const activeGoals = goals.items.filter((g) => g.status === 'active' || g.status === 'at-risk');
  const achievedGoals = goals.items.filter((g) => g.status === 'achieved').length;
  const pillarsMix = pillars.items.reduce((s, p) => s + (p.target_mix ?? 0), 0);
  const resourcesTotal = fromUsd(resources.items.reduce((s, r) => s + toUsd(r.cost ?? 0, r.currency ?? 'USD'), 0), base);

  return <div className="grid" style={{ gap: 16 }}>
    <div className="grid grid-4">
      <StatCard emoji="👥" label="Total followers" value={formatCompact(latestFollowers)} note="Latest value per platform" />
      <StatCard emoji="❤️" label="Avg engagement" value={`${avgEr.toFixed(2)}%`} note="(L+C+S+Sv) ÷ followers" />
      <StatCard emoji="🏛️" label="Content mix" value={`${pillarsMix}%`} note={`${pillars.items.length} pillar${pillars.items.length === 1 ? '' : 's'} defined`} />
      <StatCard emoji="💰" label="Revenue logged" value={formatMoney(revenue, base, 0)} note="From analytics entries" />
    </div>
    <div className="grid grid-2">
      <section className="section-block">
        <div className="block-head"><h2 style={{ fontSize: 15 }}>🎯 Goals in flight</h2></div>
        {goals.items.length === 0 ? <p className="muted" style={{ fontSize: 12 }}>No goals yet. Set one under the Goals tab.</p> :
          <div className="timeline">
            {goals.items.slice(0, 6).map((g) => {
              const pct = g.target ? Math.min(100, (g.current_progress / g.target) * 100) : 0;
              return <div key={g.id} className="tl-item"><span className="tl-dot">🎯</span><div className="tl-body"><strong style={{ fontSize: 13, color: '#5d4f79' }}>{g.name}</strong><div style={{ marginTop: 6 }}><div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }}/></div></div><p className="card-sub">{g.current_progress.toLocaleString()} / {(g.target ?? 0).toLocaleString()} · <b>{g.status}</b></p></div></div>;
            })}
          </div>}
        <p className="hint" style={{ marginTop: 10 }}>🏆 {achievedGoals} achieved · {activeGoals.length} active</p>
      </section>
      <section className="section-block">
        <div className="block-head"><h2 style={{ fontSize: 15 }}>📚 Knowledge & spend</h2></div>
        <div className="timeline">
          <div className="tl-item"><span className="tl-dot">🗂️</span><div className="tl-body"><strong style={{ fontSize: 13, color: '#5d4f79' }}>{resources.items.length} saved resources</strong><p className="card-sub">gear, software, presets, music & templates</p></div></div>
          <div className="tl-item"><span className="tl-dot">🧾</span><div className="tl-body"><strong style={{ fontSize: 13, color: '#5d4f79' }}>{formatMoney(resourcesTotal, base, 0)}</strong><p className="card-sub">total tooling spend logged</p></div></div>
          <div className="tl-item"><span className="tl-dot">💡</span><div className="tl-body"><strong style={{ fontSize: 13, color: '#5d4f79' }}>Refresh your mix</strong><p className="card-sub">Authority + Connection + Growth keeps the feed from feeling one-note</p></div></div>
        </div>
      </section>
    </div>
  </div>;
}