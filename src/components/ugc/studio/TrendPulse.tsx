import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { CalendarCheck, Copy, Flame, Repeat, Sparkles } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { loadProfile } from '../../../data/onboarding';
import { NICHES, TREND_REGIONS } from '../../../data/creatorIntelligence';
import { hashtagPack, rankIdeasForNext, regionLabelOf, repurposeIdea, repurposeIdeaSmart, trendingNow, trendingNowSmart, type NextPick, type RepurposeVariant, type TrendItem } from '../../../lib/creatorBrain';
import { buildBrain } from '../../../lib/scriptBrain';
import { schedulePlatformPost } from '../../../lib/calendarActions';
import { toDateKey } from '../../../utils/dateUtils';
import { cx, EmptyState, Modal, PageHead, Pill, Progress, SectionBlock } from '../shared/primitives';
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
  const { items: ideas, add: addIdea } = useCollection('content_ideas', userId);
  const { add: addBoard } = useCollection('production_board', userId);
  const { items: scripts, add: addScript } = useCollection('scripts', userId);
  const [region, setRegion] = useState<string>('world');
  const [niches, setNiches] = useState<string[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiOn, setAiOn] = useState(false);
  const [aiTrends, setAiTrends] = useState<TrendItem[] | null>(null);
  const [flash, setFlash] = useState('');

  const [repurposeFor, setRepurposeFor] = useState<TrendItem | null>(null);
  const [repurposeBusy, setRepurposeBusy] = useState(false);
  const [repSet, setRepSet] = useState<RepurposeVariant[] | null>(null);

  const [hashtagFor, setHashtagFor] = useState<TrendItem | null>(null);
  const [copied, setCopied] = useState(false);

  const [scheduling, setScheduling] = useState(false);

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
    await addIdea({
      title: t.title, description: t.play, platform: 'tiktok', priority: 'medium', effort_level: 'quick', status: 'idea',
      audience_promise: 'Jump on this while it is hot.', hook_idea: t.hook, content_angle: t.angle,
      inspiration_source: `🔥 ${regionLabelOf(t.region)} trend`, pillar: t.niche,
      repurpose_plan: `Format: ${t.format}. Post fast while it is ${t.direction}.`,
      impact: 4, confidence: 3,
    } as never);
    setFlash(`Saved "${t.title.slice(0, 44)}" to your Idea Bank.`);
  };

  /* ---- repurpose from trend ---- */
  const openRepurpose = (t: TrendItem): void => {
    setRepurposeFor(t); setRepSet(null); setRepurposeBusy(true);
    // Build a ContentIdea-shaped object for the repurpose engine
    const fake: ContentIdea = {
      id: t.id, user_id: '', created_at: '', updated_at: '', sync_pending: 0,
      title: t.title, description: t.play, platform: 'tiktok', priority: 'medium', effort_level: 'quick',
      audience_promise: '', hook_idea: t.hook, content_angle: t.angle,
      inspiration_source: `🔥 ${regionLabelOf(t.region)} trend`, pillar: t.niche,
      repurpose_plan: t.format, status: 'idea',
      impact: 4, confidence: 3,
    };
    void repurposeIdeaSmart(fake)
      .then(setRepSet)
      .catch(() => setRepSet(repurposeIdea(fake)))
      .finally(() => setRepurposeBusy(false));
  };

  const saveRepurposed = async (): Promise<void> => {
    if (!repurposeFor || !repSet) return;
    setRepurposeBusy(true);
    try {
      for (const v of repSet) {
        await addIdea({
          title: v.title, description: v.repurpose_plan, platform: v.platform, priority: 'medium', effort_level: 'medium', status: 'idea',
          audience_promise: 'Repurposed from a hot trend.', hook_idea: v.hook, content_angle: v.angle,
          inspiration_source: `↻ repurposed from "${repurposeFor.title.slice(0, 40)}"`, pillar: repurposeFor.niche,
          repurpose_plan: v.repurpose_plan, impact: 4, confidence: 3,
        } as never);
      }
      setFlash(`Repurposed "${repurposeFor.title.slice(0, 40)}" into ${repSet.length} formats.`);
      setRepurposeFor(null);
    } finally { setRepurposeBusy(false); }
  };

  /* ---- schedule next move (top pick → calendar + board + script) ---- */
  const scheduleNextMove = async (p: NextPick): Promise<void> => {
    if (scheduling) return;
    setScheduling(true);
    try {
      const tomorrow = toDateKey(new Date(Date.now() + 86_400_000));
      const idea = p.idea;

      // 1. Schedule to calendar
      await schedulePlatformPost(userId, tomorrow, {
        platform: (idea.platform || 'tiktok') as never,
        caption: idea.hook_idea || idea.title,
        content_type: 'ugc',
        status: 'scheduled',
      } as never);

      // 2. Add to production board
      await addBoard({
        title: idea.title, column_name: 'filming', platform: idea.platform || 'tiktok',
        priority: 'high', due_date: tomorrow, sponsor: null, video_type: idea.content_angle || 'ugc',
        subtasks: [], status: 'active',
      } as never);

      // 3. Generate script draft
      try {
        const brain = buildBrain({
          niche: idea.pillar || idea.content_angle || 'creator',
          topic: idea.title,
          platform: idea.platform || 'tiktok',
          content: idea.hook_idea || idea.title,
        }, []);
        await addScript({
          title: idea.title, platform: idea.platform || 'tiktok', status: 'draft',
          hook: brain.hooks[0]?.text || idea.hook_idea || '', structure: brain.structure.name,
          script_body: '', caption: brain.caption, tags: brain.tags,
          board_card_id: null, source_idea_id: idea.id,
        } as never);
      } catch { /* script generation optional */ }

      // 4. Update idea status
      if (idea.id) {
        try { await addIdea({ ...idea, status: 'scheduled' } as never); } catch { /* best effort */ }
      }

      setFlash(`Scheduled "${idea.title.slice(0, 40)}" → ${tomorrow} calendar + board + script.`);
    } finally { setScheduling(false); }
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
                {i === 0 && <div className="row" style={{ gap: 8, marginTop: 10 }}>
                  <button className="btn primary btn-sm" disabled={scheduling} onClick={() => void scheduleNextMove(p)}><CalendarCheck size={14}/> {scheduling ? 'Scheduling…' : 'Schedule next move → tomorrow'}</button>
                </div>}
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
              <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                <button className="btn primary btn-sm" onClick={() => void saveTrend(t)}><Flame size={14}/> Save as idea</button>
                <button className="btn soft btn-sm" onClick={() => openRepurpose(t)}><Repeat size={14}/> Repurpose</button>
                <button className="btn ghost btn-sm" onClick={() => setHashtagFor(t)}><Copy size={14}/> Hashtags</button>
              </div>
            </div>;
          })}
        </div>
      )}
    </SectionBlock>

    {/* ---- repurpose modal ---- */}
    {repurposeFor && <Modal title={`↻ Repurpose "${repurposeFor.title.slice(0, 44)}"`} onClose={() => setRepurposeFor(null)} wide
      footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={() => setRepurposeFor(null)}>Cancel</button><button className="btn primary" disabled={repurposeBusy} onClick={() => void saveRepurposed()}><Repeat size={15}/> {repurposeBusy ? 'Saving…' : `Save all ${repSet?.length ?? 4} as ideas`}</button></div>}>
      {repurposeBusy ? <p className="muted" style={{ textAlign: 'center', padding: 28 }}>Generating repurposed variants…</p> :
        (repSet ?? repurposeIdea({
          id: repurposeFor.id, user_id: '', created_at: '', updated_at: '', sync_pending: 0,
          title: repurposeFor.title, description: repurposeFor.play, platform: 'tiktok', priority: 'medium', effort_level: 'quick',
          audience_promise: '', hook_idea: repurposeFor.hook, content_angle: repurposeFor.angle,
          inspiration_source: '', pillar: repurposeFor.niche, repurpose_plan: '', status: 'idea',
          impact: 4, confidence: 3,
        })).map((v) => <div className="bs-option" key={v.title}>
          <div className="bs-option-body">
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <Pill color="sky">{v.platform}</Pill>
              <Pill color="lavender">{v.angle}</Pill>
            </div>
            <strong style={{ fontSize: 14, margin: '6px 0 4px', lineHeight: 1.35 }}>{v.title}</strong>
            <span className="muted" style={{ fontSize: 12 }}>🎣 {v.hook}</span>
            <span className="hint" style={{ fontSize: 11.5 }}>📋 {v.repurpose_plan}</span>
          </div>
        </div>)
      }
    </Modal>}

    {/* ---- hashtag modal ---- */}
    {hashtagFor && (() => {
      const pack = hashtagPack(hashtagFor);
      return <Modal title={`#${hashtagFor.title.slice(0, 40)} — hashtags`} onClose={() => setHashtagFor(null)}
        footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={() => setHashtagFor(null)}>Close</button><button className="btn primary" onClick={() => { navigator.clipboard.writeText(pack.caption).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {}); }}><Copy size={15}/> {copied ? 'Copied!' : 'Copy caption + tags'}</button></div>}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {pack.hashtags.map((h) => <Pill key={h} color="mint">#{h}</Pill>)}
        </div>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.5, background: 'var(--surface-2)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>{pack.caption}</pre>
      </Modal>;
    })()}

    {/* hashtag modal trigger (hidden — copyHashtags copies directly, but let's open modal on trend tag click) */}
    {/* The trend-tag spans already show hashtags visually — modal is triggered via the Hashtags button */}
  </div>;
}
