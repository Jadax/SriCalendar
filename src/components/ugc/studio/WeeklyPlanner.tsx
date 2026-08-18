import { useMemo, useState, type ReactElement } from 'react';
import { CalendarCheck, Copy, Sparkles, Wand2 } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { loadProfile } from '../../../data/onboarding';
import { buildWeeklyPlan, buildWeeklyPlanSmart, regionLabelOf, type WeeklyPlanSlot } from '../../../lib/creatorBrain';
import { schedulePlatformPost } from '../../../lib/calendarActions';
import { toDateKey } from '../../../utils/dateUtils';
import { cx, EmptyState, PageHead, Pill, SectionBlock } from '../shared/primitives';
import type { TodayContext } from '../../../lib/creatorBrain';
import type { AnalyticsEntry, BoardCard, BrandDeal, ContentIdea, ContentPillar, Goal, HookItem, Invoice, MediaKitProfile } from '../../../types/ugc';

interface Props { userId: string }

const DAY_COLORS: Record<string, 'mint' | 'lavender' | 'sky' | 'yellow' | 'coral' | 'peach' | 'gray'> = {
  Mon: 'lavender', Tue: 'sky', Wed: 'mint', Thu: 'yellow', Fri: 'coral', Sat: 'peach', Sun: 'gray',
};

export function WeeklyPlanner({ userId }: Props): ReactElement {
  const { items: ideas } = useCollection('content_ideas', userId);
  const { items: hooks } = useCollection('hook_library', userId);
  const { items: board } = useCollection('production_board', userId);
  const { items: pillars } = useCollection('content_pillars', userId);
  const { items: goals } = useCollection('goals', userId);
  const { items: deals } = useCollection('brand_deals', userId);
  const { items: invoices } = useCollection('invoices', userId);
  const { items: analytics } = useCollection('analytics', userId);
  const [niches, setNiches] = useState<string[]>([]);
  const [region, setRegion] = useState('world');
  const [plan, setPlan] = useState<WeeklyPlanSlot[]>([]);
  const [generating, setGenerating] = useState(false);
  const [scheduling, setScheduling] = useState<string | null>(null);
  const [flash, setFlash] = useState('');
  const [copiedDay, setCopiedDay] = useState<string | null>(null);

  useMemo(() => { setNiches(loadProfile(userId)?.niches ?? []); }, [userId]);

  const generatePlan = async (useAi: boolean): Promise<void> => {
    setGenerating(true);
    try {
      const ctx: TodayContext = {
        dateKey: toDateKey(new Date()), streak: 0,
        ideas: ideas as ContentIdea[], hooks: hooks as HookItem[],
        board: board as BoardCard[], deals: deals as BrandDeal[],
        invoices: invoices as Invoice[], goals: goals as Goal[],
        pillars: pillars as ContentPillar[], analytics: analytics as AnalyticsEntry[],
        tasksToday: [], postsToday: [], mediaKit: null,
      };
      const result = useAi ? await buildWeeklyPlanSmart(ctx) : buildWeeklyPlan(ctx);
      setPlan(result);
    } finally { setGenerating(false); }
  };

  const scheduleDay = async (slot: WeeklyPlanSlot): Promise<void> => {
    setScheduling(slot.date);
    try {
      await schedulePlatformPost(userId, slot.date, {
        platform: slot.platform as never,
        title: slot.topic,
        status: 'scheduled',
        notes: `Hook: ${slot.hook}\nAngle: ${slot.angle}\nPillar: ${slot.pillar}`,
      } as never);
      setFlash(`Scheduled "${slot.topic.slice(0, 40)}" for ${slot.date}`);
      setTimeout(() => setFlash(''), 3000);
    } finally { setScheduling(null); }
  };

  const scheduleAll = async (): Promise<void> => {
    for (const slot of plan) {
      await schedulePlatformPost(userId, slot.date, {
        platform: slot.platform as never,
        title: slot.topic,
        status: 'scheduled',
        notes: `Hook: ${slot.hook}\nAngle: ${slot.angle}\nPillar: ${slot.pillar}`,
      } as never);
    }
    setFlash(`Scheduled ${plan.length} posts for the week!`);
    setTimeout(() => setFlash(''), 3000);
  };

  const copyDay = async (slot: WeeklyPlanSlot): Promise<void> => {
    const text = `${slot.topic}\n\nHook: ${slot.hook}\nAngle: ${slot.angle}\nPlatform: ${slot.platform}\nPillar: ${slot.pillar}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDay(slot.date);
      setTimeout(() => setCopiedDay(null), 2000);
    } catch { /* ignore */ }
  };

  return <div>
    {flash && <div className="flash-banner" role="status" onClick={() => setFlash('')}>{flash} <span className="muted">tap to dismiss</span></div>}
    <PageHead eyebrow="Studio planner" title="Weekly Planner"
      subtitle="Plan a week of content in one click. Every slot links to a pillar, hook, and platform." />

    <SectionBlock title="Generate your week" hint="pick a method and get 7 content slots">
      <div className="planner-controls">
        <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <button className="btn soft btn-sm" disabled={generating} onClick={() => void generatePlan(false)}>
            <Wand2 size={14} /> Quick plan (offline)
          </button>
          <button className="btn primary btn-sm" disabled={generating} onClick={() => void generatePlan(true)}>
            <Sparkles size={14} /> {generating ? 'Generating...' : 'AI plan (smarter)'}
          </button>
          {plan.length > 0 && (
            <button className="btn ghost btn-sm" onClick={() => void scheduleAll()}>
              <CalendarCheck size={14} /> Schedule all {plan.length} days
            </button>
          )}
        </div>
        <p className="hint" style={{ fontSize: 12 }}>
          Uses your content pillars{pillars.length > 0 ? ` (${pillars.map((p) => p.name).join(', ')})` : ''} and proven hooks to fill each day.
          {niches.length > 0 ? ` Niche: ${niches.join(', ')}.` : ''} Region: {regionLabelOf(region)}.
        </p>
      </div>
    </SectionBlock>

    {plan.length > 0 && (
      <SectionBlock title="This week's content" hint={`${plan.length} slots planned`}>
        <div className="planner-grid">
          {plan.map((slot) => {
            const color = DAY_COLORS[slot.weekday] ?? 'gray';
            return (
              <div key={slot.date} className={cx('planner-card', scheduling === slot.date && 'scheduling')}>
                <div className="planner-card-header">
                  <Pill color={color}>{slot.weekday}</Pill>
                  <span className="hint" style={{ fontSize: 11 }}>{slot.date}</span>
                </div>
                <strong className="planner-card-topic">{slot.topic}</strong>
                <div className="row" style={{ gap: 4, flexWrap: 'wrap', margin: '6px 0' }}>
                  <Pill color="sky">{slot.platform}</Pill>
                  <Pill color="lavender">{slot.pillar}</Pill>
                </div>
                <p className="planner-card-hook">"{slot.hook}"</p>
                <span className="hint" style={{ fontSize: 11 }}>Angle: {slot.angle}</span>
                <div className="row" style={{ gap: 6, marginTop: 8 }}>
                  <button className="btn primary btn-sm" disabled={scheduling === slot.date} onClick={() => void scheduleDay(slot)}>
                    <CalendarCheck size={13} /> {scheduling === slot.date ? 'Saving...' : 'Schedule'}
                  </button>
                  <button className="btn ghost btn-sm" onClick={() => void copyDay(slot)}>
                    <Copy size={13} /> {copiedDay === slot.date ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </SectionBlock>
    )}

    {plan.length === 0 && !generating && (
      <EmptyState emoji={'\u{1F5D2}\uFE0F'} title="No plan generated yet"
        note="Click 'Quick plan' or 'AI plan' above to generate 7 days of content based on your pillars and hooks." />
    )}
  </div>;
}
