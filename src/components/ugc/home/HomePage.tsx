import { useMemo, useState, type ReactElement } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from '../../../lib/router';
import { useCollection } from '../../../hooks/useCollection';
import { useUiStore } from '../../../store/uiStore';
import { db } from '../../../lib/dexieClient';
import { schedulePlatformPost } from '../../../lib/calendarActions';
import { buildDailyBrief, buildWeeklyPlan, buildWeeklyPlanSmart, interpretAnalytics, type BriefNudge, type WeeklyPlanSlot } from '../../../lib/creatorBrain';
import { isGeminiConfigured } from '../../../lib/geminiClient';
import { toDateKey } from '../../../utils/dateUtils';
import { fromUsd, formatMoneyCompact, getBaseCurrency, toUsd } from '../../../utils/money';
import type { Platform } from '../../../types';
import { PageHead, SectionBlock, Pill } from '../shared/primitives';

const PLAN_PLATFORMS: Platform[] = ['tiktok', 'instagram', 'youtube', 'shorts', 'reels'];

interface Props { userId: string }

/** CREATOR HQ — the daily command center that decides what to do today. */
export function HomePage({ userId }: Props): ReactElement {
  const navigate = useNavigate();
  const streak = useUiStore((s) => s.streak);
  const celebrate = useUiStore((s) => s.celebrate);

  const dateKey = useMemo(() => toDateKey(new Date()), []);
  const monthPrefix = dateKey.slice(0, 7);

  const ideas = useCollection('content_ideas', userId);
  const hooks = useCollection('hook_library', userId);
  const board = useCollection('production_board', userId);
  const deals = useCollection('brand_deals', userId);
  const invoices = useCollection('invoices', userId);
  const goals = useCollection('goals', userId);
  const pillars = useCollection('content_pillars', userId);
  const analytics = useCollection('analytics', userId);
  const media = useCollection('media_kit', userId);
  const mediaKit = media.items[0] ?? null;

  const todayRow = useLiveQuery(() => db.daily_data.get([userId, dateKey]), [userId, dateKey]);

  const [plan, setPlan] = useState<WeeklyPlanSlot[] | null>(null);
  const [planBusy, setPlanBusy] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [planned, setPlanned] = useState(false);

  const ctx = useMemo<Parameters<typeof buildDailyBrief>[0]>(() => ({
    dateKey,
    streak,
    ideas: ideas.items,
    hooks: hooks.items,
    board: board.items,
    deals: deals.items,
    invoices: invoices.items,
    goals: goals.items,
    pillars: pillars.items,
    analytics: analytics.items,
    tasksToday: (todayRow?.tasks ?? []).map((t) => ({ text: t.text, done: t.completed })),
    postsToday: (todayRow?.platform_posts ?? []).map((p) => ({ platform: p.platform, title: p.title, status: p.status })),
    mediaKit,
  }), [dateKey, streak, ideas.items, hooks.items, board.items, deals.items, invoices.items, goals.items, pillars.items, analytics.items, todayRow, mediaKit]);

  const nudges = useMemo<BriefNudge[]>(() => buildDailyBrief(ctx), [ctx]);
  const insights = useMemo(() => interpretAnalytics(analytics.items), [analytics.items]);

  const base = getBaseCurrency();
  const fmt = (amountUsd: number): string => formatMoneyCompact(fromUsd(amountUsd, base), base);
  const usd = (amount: number, currency?: string | null): number => toUsd(amount ?? 0, currency ?? 'USD');

  const pipelineUsd = deals.items.reduce((sum, d) => {
    if (d.status === 'declined') return sum;
    const est = d.status === 'accepted' ? 1 : Math.max(0, Math.min(100, d.estimated_probability ?? 0)) / 100;
    return sum + usd(d.deal_value ?? 0, d.currency) * est;
  }, 0);

  const outstandingUsd = invoices.items.reduce((sum, i) => {
    if (i.status === 'paid' || i.status === 'draft') return sum;
    return sum + usd(i.total, i.currency);
  }, 0);

  const paidThisMonthUsd = invoices.items.reduce((sum, i) => {
    if (i.status === 'paid' && i.issue_date.startsWith(monthPrefix)) return sum + usd(i.total, i.currency);
    return sum;
  }, 0);

  const latest = [...analytics.items].sort((a, b) => b.date.localeCompare(a.date))[0];
  const followers = latest?.followers ?? 0;

  const openTasks = ctx.tasksToday.filter((t) => !t.done).length;
  const dueSoon = board.items.filter((c) => c.due_date && c.due_date >= dateKey && c.due_date <= dateKey.slice(0, 8) + '06' && c.column_name !== 'published').length;

  const generatePlan = async (): Promise<void> => {
    setPlanBusy(true);
    try {
      const slots = isGeminiConfigured ? await buildWeeklyPlanSmart(ctx) : buildWeeklyPlan(ctx);
      setPlan(slots);
      setPlanned(false);
    } finally { setPlanBusy(false); }
  };

  const schedulePlan = async (): Promise<void> => {
    if (!plan) return;
    setScheduling(true);
    try {
      for (const slot of plan) {
        const platform = PLAN_PLATFORMS.includes(slot.platform as Platform) ? (slot.platform as Platform) : 'tiktok';
        const id = await ideas.add({
          title: slot.topic, description: null, platform, priority: 'medium', effort_level: 'medium',
          audience_promise: null, hook_idea: slot.hook, content_angle: slot.angle,
          inspiration_source: 'Weekly AI plan', pillar: slot.pillar, repurpose_plan: null, status: 'scheduled',
          impact: null, confidence: null,
        });
        await schedulePlatformPost(userId, slot.date, { platform, title: slot.topic, status: 'scheduled', notes: `Pillar: ${slot.pillar}\nHook: ${slot.hook}`, idea_id: id });
      }
      setPlanned(true);
      celebrate();
    } finally { setScheduling(false); }
  };

  const priorityPill = (p: BriefNudge['priority']): Parameters<typeof Pill>[0]['color'] =>
    p === 'high' ? 'coral' : p === 'medium' ? 'yellow' : 'gray';

  return <div className="ugc-page">
    <PageHead eyebrow="Creator HQ" title="Today ✨" subtitle={`${new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} · let's get your content moving`} actions={<div className="row"><button className="btn primary small" onClick={() => navigate('/app/studio')}>💡 New idea</button><button className="btn soft small" onClick={() => navigate('/app/business')}>🤝 New deal</button><button className="btn ghost small" onClick={() => navigate('/app/knowledge')}>📈 Log metrics</button></div>} />

    <div className="grid grid-4">
      <div className="stat-card"><div className="stat-label">🔥 Streak</div><div className="stat-value">{streak} day{streak === 1 ? '' : 's'}</div><div className="stat-note">{streak >= 3 ? 'Momentum is building — keep showing up.' : 'One day at a time.'}</div></div>
      <div className="stat-card"><div className="stat-label">👥 Followers</div><div className="stat-value">{followers.toLocaleString()}</div><div className="stat-note">{latest ? `as of ${latest.date}` : 'log your first metrics'}</div></div>
      <div className="stat-card"><div className="stat-label">💼 Pipeline</div><div className="stat-value">{fmt(pipelineUsd)}</div><div className="stat-note">weighted value of active deals</div></div>
      <div className="stat-card"><div className="stat-label">🧾 Outstanding</div><div className="stat-value">{fmt(outstandingUsd)}</div><div className="stat-note">unpaid invoices</div></div>
    </div>

    <div className="grid grid-2">
      <SectionBlock title="🧭 Today brief" hint="what the brain suggests right now" actions={<Pill color="lavender">{nudges.length} items</Pill>}>
        <div className="nudge-list">
          {nudges.map((n) => (
            <div className="nudge" key={n.id}>
              <span className="nudge-emoji">{n.emoji}</span>
              <div className="nudge-body">
                <div className="row" style={{ gap: 6 }}>
                  <span className="nudge-title">{n.title}</span>
                  <Pill color={priorityPill(n.priority)}>{n.priority}</Pill>
                </div>
                <p>{n.body}</p>
                {n.action && <button className="btn ghost small" onClick={() => navigate(n.action!.to)}>{n.action.label}</button>}
              </div>
            </div>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="🗓️ Plan my week" hint={isGeminiConfigured ? 'AI-powered from your pillars' : 'offline plan from your pillars'} actions={plan ? <button className="btn ghost small" onClick={() => void generatePlan()} disabled={planBusy}>↻ Regenerate</button> : <button className="btn primary small" onClick={() => void generatePlan()} disabled={planBusy}>{planBusy ? 'Thinking…' : 'Generate 7 days'}</button>}>
        {!plan ? (
          <div className="empty-state"><div className="empty-emoji">🗓️</div><p>Plan the week ahead</p><small>Your pillars, proven hooks and best platforms — turned into 7 ready-to-schedule content slots.</small>{planBusy && <button className="btn soft small">Planning…</button>}</div>
        ) : (
          <>
            {planned && <div className="plan-saved">✅ 7 days scheduled to your calendar and Idea Bank</div>}
            <div className="timeline">
              {plan.map((slot) => (
                <div className="tl-item" key={slot.date}>
                  <span className="tl-dot">{(new Date(`${slot.date}T00:00:00`).getDate()).toString().padStart(2, '0')}</span>
                  <div className="tl-body">
                    <div className="row" style={{ gap: 6 }}>
                      <span className="nudge-title">{slot.topic}</span>
                      <Pill color="sky">{slot.platform}</Pill>
                      <span className="muted" style={{ fontSize: 10.5 }}>{slot.pillar}</span>
                    </div>
                    <p className="muted" style={{ marginTop: 3 }}>{slot.hook}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn primary small" onClick={() => void schedulePlan()} disabled={scheduling}>{scheduling ? 'Scheduling…' : 'Schedule this week'}</button>
              <span className="muted" style={{ fontSize: 11 }}>{planned ? 'Ideas + calendar posts created.' : 'Adds 7 ideas and calendar posts — edit anytime.'}</span>
            </div>
          </>
        )}
      </SectionBlock>
    </div>

    <div className="grid grid-2">
      <SectionBlock title="📊 Analytics pulse" hint="what the numbers are telling you">
        <div className="nudge-list">
          {insights.map((insight, i) => (
            <div className="nudge" key={i}>
              <span className="nudge-emoji">{insight.emoji}</span>
              <div className="nudge-body">
                <div className="row" style={{ gap: 6 }}>
                  <span className="nudge-title">{insight.title}</span>
                  <Pill color={insight.tone === 'good' ? 'mint' : insight.tone === 'warn' ? 'coral' : 'lavender'}>{insight.tone}</Pill>
                </div>
                <p>{insight.body}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="btn soft small" style={{ marginTop: 12 }} onClick={() => navigate('/app/knowledge')}>Open full analytics</button>
      </SectionBlock>

      <SectionBlock title="💸 Money pulse" hint="pipeline → invoices → payout" actions={<span className="hint">this month: {fmt(paidThisMonthUsd)} paid</span>}>
        <div className="mini-grid">
          <div className="stat-card"><div className="stat-label">🤝 Deal pipeline</div><div className="stat-value">{fmt(pipelineUsd)}</div><div className="stat-note">{deals.items.filter((d) => d.status !== 'declined').length} active deals</div></div>
          <div className="stat-card"><div className="stat-label">🧾 Outstanding</div><div className="stat-value">{fmt(outstandingUsd)}</div><div className="stat-note">{invoices.items.filter((i) => i.status !== 'paid' && i.status !== 'draft').length} unpaid</div></div>
          <div className="stat-card"><div className="stat-label">💵 Paid this month</div><div className="stat-value">{fmt(paidThisMonthUsd)}</div><div className="stat-note">invoiced revenue</div></div>
          <div className="stat-card"><div className="stat-label">🗂️ Due soon</div><div className="stat-value">{dueSoon}</div><div className="stat-note">production cards, next 7 days</div></div>
        </div>
        <button className="btn soft small" style={{ marginTop: 12 }} onClick={() => navigate('/app/business')}>Open business hub</button>
      </SectionBlock>
    </div>
  </div>;
}
