import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { loadProfile } from '../../../data/onboarding';
import { NICHES, TREND_REGIONS } from '../../../data/creatorIntelligence';
import { rankIdeasForNext, regionLabelOf, trendingNow, trendingNowSmart, type NextPick, type TrendItem } from '../../../lib/creatorBrain';
import { cx, EmptyState, PageHead, Pill, Progress, SectionBlock } from '../shared/primitives';
import type { ContentIdea } from '../../../types/ugc';

interface Props { userId: string }

const DIRECTION_META: Record<string, { label: string; color: 'mint' | 'yellow' | 'coral'; icon: string }> = {
  rising: { label: 'rising', color: 'mint', icon: '⏫' },
  peaking: { label: 'peaking', color: 'yellow', icon: '📈' },
  falling: { label: 'falling', color: 'coral', icon: '📉' },
};

const scoreColor = (s: number): 'mint' | 'yellow' | 'peach' => s >= 70 ? 'mint' : s >= 45 ? 'yellow' : 'peach';

/** PILLAR 2.5 — Trend Pulse: region-aware "what's hot" radar + "what to work on next" ranking. */
export function TrendPulse({ userId }: Props): ReactElement {
  const { items: ideas, add } = useCollection('content_ideas', userId);
  const [region, setRegion] = useState<string>('world');
  const [niches, setNiches] = useState<string[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiOn, setAiOn] = useState(false);
  const [aiTrends, setAiTrends] = useState<TrendItem[] | null>(null);
  const [flash, setFlash] = useState('');

  useEffect(() => { setNiches(loadProfile(userId)?.niches ?? []); }, [userId]);

  const trends = useMemo<TrendItem[]>(() => aiTrends ?? trendingNow(niches, region), [aiTrends, niches, region]);
  const picks = useMemo<NextPick[]>(() => rankIdeasForNext(ideas, { region, niches }), [ideas, region, niches]);

  const scan = async (): Promise<void> => {
    setAiBusy(true);
    try { setAiTrends(await trendingNowSmart(niches, region)); setAiOn(true); }
    finally { setAiBusy(false); }
  };

  const toggleNiche = (n: string): void =>
    setNiches((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]));

  const saveTrend = async (t: TrendItem): Promise<void> => {
    await add({
      title: t.title, description: t.play, platform: 'tiktok', priority: 'medium', effort_level: 'quick', status: 'idea',
      audience_promise: 'Jump on this while it is hot.', hook_idea: t.hook, content_angle: t.angle,
      inspiration_source: `🔥 ${regionLabelOf(t.region)} trend`, pillar: t.niche,
      repurpose_plan: `Format: ${t.format}. Post fast while it is ${t.direction}.`,
      impact: 4, confidence: 3,
    } as never);
    setFlash(`Saved “${t.title.slice(0, 44)}” to your Idea Bank.`);
  };

  return <div>
    {flash && <div className="flash-banner" role="status" onClick={() => setFlash('')}>{flash} <span className="muted">· tap to dismiss</span></div>}
    <PageHead eyebrow="Studio · trend radar" title="Trend Pulse 🔥" subtitle="What's blowing up in your niche and region — and the exact video to make next." />

    <div className="section-block" style={{ marginBottom: 18 }}>
      <div className="row" style={{ gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div className="subtabs" style={{ width: 'auto' }}>
          {TREND_REGIONS.map((r) => (
            <button key={r.id} className={`subtab ${region === r.id ? 'active' : ''}`} onClick={() => { setRegion(r.id); setAiTrends(null); setAiOn(false); }}>
              {r.flag} {r.label}
            </button>
          ))}
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className="hint" style={{ alignSelf: 'center' }}>{aiOn ? '✨ live AI scan' : '📚 built-in radar'}</span>
          <button className="btn ghost btn-sm" disabled={aiBusy} onClick={() => void scan()}><Sparkles size={14}/> {aiBusy ? 'Scanning…' : 'Scan with AI'}</button>
        </div>
      </div>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {[...NICHES].map((n) => (
          <button key={n} className={cx('niche-chip', niches.includes(n) && 'active')} onClick={() => toggleNiche(n)}>{n}</button>
        ))}
      </div>
      <p className="hint" style={{ marginTop: 10, fontSize: 11.5 }}>{TREND_REGIONS.find((r) => r.id === region)?.note}</p>
    </div>

    <SectionBlock title="Your next move" hint="ranked by viral potential · ICE × freshness × trend fit" className="trend-block">
      {picks.length === 0 ? (
        <EmptyState emoji="🌱" title="No open ideas to rank yet" note="Save a trend below or add ideas in the Idea Bank — this panel will pick your next video for you." />
      ) : (
        <div className="grid" style={{ gap: 12 }}>
          {picks.slice(0, 3).map((p, i) => (
            <div key={p.idea.id} className={cx('bs-option', i === 0 && 'top-pick')}>
              <div className="bs-option-body">
                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  {i === 0 && <Pill color="coral">🔥 work on this</Pill>}
                  <Pill color={scoreColor(p.score)}>{p.score}/100</Pill>
                  {p.idea.platform && <Pill color="lavender">{p.idea.platform}</Pill>}
                  <span className="hint" style={{ fontSize: 11 }}>{p.idea.status}</span>
                </div>
                <strong style={{ fontSize: 14.5, margin: '8px 0 4px', lineHeight: 1.35 }}>{p.idea.title}</strong>
                {p.idea.hook_idea && <span className="muted">🧲 {p.idea.hook_idea.slice(0, 110)}</span>}
                {p.reasons.map((r) => <span key={r} className="hint" style={{ fontSize: 11.5 }}>· {r}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionBlock>

    <SectionBlock title={`Trending now · ${regionLabelOf(region)}`} hint={niches.length ? niches.join(', ') : 'all niches'} className="trend-block">
      {trends.length === 0 ? (
        <EmptyState emoji="📡" title="No trends match yet" note="Try switching region or ticking more niches — the radar tunes itself to your choices." />
      ) : (
        <div className="trend-list" style={{ gap: 12 }}>
          {trends.slice(0, 12).map((t) => {
            const d = DIRECTION_META[t.direction]!;
            return <div className="trend-card" key={t.id}>
              <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                <Pill color="gray">{TREND_REGIONS.find((r) => r.id === t.region)?.flag} {regionLabelOf(t.region)}</Pill>
                <Pill color="sky">{t.format}</Pill>
                <Pill color={d.color}>{d.icon} {d.label}</Pill>
                {t.season && <Pill color="peach">{t.season}</Pill>}
                <span className="spacer"/>
                <Pill color={scoreColor(t.virality)}>🔥 {t.virality}/100</Pill>
              </div>
              <h3 className="trend-title">{t.title}</h3>
              <p className="trend-hook">🎣 {t.hook}</p>
              <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>💡 {t.play}</p>
              <Progress value={t.momentum} label="momentum right now"/>
              <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {t.hashtags.map((h) => <span key={h} className="trend-tag">#{h}</span>)}
              </div>
              <button className="btn primary btn-sm" style={{ marginTop: 10 }} onClick={() => void saveTrend(t)}><Flame size={14}/> Save as idea</button>
            </div>;
          })}
        </div>
      )}
    </SectionBlock>
  </div>;
}
