import { useMemo, useState, type ReactElement } from 'react';
import { ArrowRight, CalendarCheck, Flame, Lightbulb, Megaphone, Repeat, Sparkles } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { loadProfile } from '../../../data/onboarding';
import { trendingNow, rankIdeasForNext, regionLabelOf } from '../../../lib/creatorBrain';
import { schedulePlatformPost } from '../../../lib/calendarActions';
import { toDateKey } from '../../../utils/dateUtils';
import { cx, EmptyState, PageHead, Pill, SectionBlock } from '../shared/primitives';

interface Props { userId: string }

interface PipelineStage {
  id: string;
  label: string;
  icon: string;
  color: 'mint' | 'lavender' | 'sky' | 'yellow' | 'coral' | 'peach';
}

const STAGES: PipelineStage[] = [
  { id: 'idea', label: 'Ideas', icon: '\u{1F4A1}', color: 'yellow' },
  { id: 'scripted', label: 'Scripted', icon: '\u{1F4DD}', color: 'lavender' },
  { id: 'filming', label: 'Filming', icon: '\u{1F3AC}', color: 'sky' },
  { id: 'editing', label: 'Editing', icon: '\u2702\uFE0F', color: 'peach' },
  { id: 'scheduled', label: 'Scheduled', icon: '\u{1F4C5}', color: 'mint' },
  { id: 'published', label: 'Published', icon: '\u{1F680}', color: 'coral' },
];

export function PipelineView({ userId }: Props): ReactElement {
  const { items: ideas, add: addIdea } = useCollection('content_ideas', userId);
  const { items: board } = useCollection('production_board', userId);
  const { items: scripts } = useCollection('scripts', userId);
  const [niches, setNiches] = useState<string[]>([]);
  const [region, setRegion] = useState('world');
  const [flash, setFlash] = useState('');

  useMemo(() => { setNiches(loadProfile(userId)?.niches ?? []); }, [userId]);

  const pipeline = useMemo(() => {
    return STAGES.map((stage) => {
      let items: Array<{ id: string; title: string; platform: string; status: string; source?: string }> = [];

      if (stage.id === 'idea') {
        items = ideas
          .filter((i) => i.status === 'idea')
          .map((i) => ({ id: i.id, title: i.title, platform: i.platform || 'tiktok', status: i.status }));
      } else if (stage.id === 'scripted') {
        items = ideas
          .filter((i) => i.status === 'scripted')
          .map((i) => ({ id: i.id, title: i.title, platform: i.platform || 'tiktok', status: i.status }));
        const linkedIdeaIds = new Set(ideas.filter((i) => i.status === 'scripted').map((i) => i.id));
        scripts
          .filter((s) => !s.source_idea_id || !linkedIdeaIds.has(s.source_idea_id))
          .forEach((s) => items.push({ id: s.id, title: s.title, platform: s.platform || 'tiktok', status: s.status, source: 'script' }));
      } else if (stage.id === 'filming' || stage.id === 'editing') {
        items = board
          .filter((b) => b.column_name === stage.id || (stage.id === 'filming' && b.column_name === 'scripting'))
          .map((b) => ({ id: b.id, title: b.title, platform: b.platform || 'tiktok', status: b.status || 'active' }));
      } else if (stage.id === 'scheduled') {
        items = ideas
          .filter((i) => i.status === 'scheduled')
          .map((i) => ({ id: i.id, title: i.title, platform: i.platform || 'tiktok', status: 'scheduled' }));
      } else if (stage.id === 'published') {
        items = ideas
          .filter((i) => i.status === 'published')
          .map((i) => ({ id: i.id, title: i.title, platform: i.platform || 'tiktok', status: 'published' }));
      }

      return { ...stage, items };
    });
  }, [ideas, board, scripts]);

  const totalItems = pipeline.reduce((s, p) => s + p.items.length, 0);
  const bottleneck = pipeline.reduce((max, p) => p.items.length > max.items.length ? p : max, pipeline[0]!);
  const trends = useMemo(() => trendingNow(niches, region), [niches, region]);
  const nextTrend = trends[0];

  const scheduleQuick = async (item: { id: string; title: string; platform: string }): Promise<void> => {
    const tomorrow = toDateKey(new Date(Date.now() + 86_400_000));
    await schedulePlatformPost(userId, tomorrow, {
      platform: item.platform as never,
      title: item.title,
      status: 'scheduled',
      notes: '',
    } as never);
    setFlash(`Scheduled "${item.title.slice(0, 40)}" for ${tomorrow}`);
    setTimeout(() => setFlash(''), 3000);
  };

  return <div>
    {flash && <div className="flash-banner" role="status" onClick={() => setFlash('')}>{flash} <span className="muted">tap to dismiss</span></div>}
    <PageHead eyebrow="Studio pipeline" title={`Content Pipeline ${STAGES[0]!.icon}`}
      subtitle="Track every idea from spark to published. See where things get stuck." />

    <SectionBlock title="Pipeline status" hint={`${totalItems} items across ${STAGES.length} stages`}>
      <div className="pipeline-overview">
        {pipeline.map((stage, i) => (
          <div key={stage.id} className={cx('pipeline-stage-card', stage.items.length > 0 && 'has-items')}>
            <div className="pipeline-stage-header">
              <span className="pipeline-stage-icon">{stage.icon}</span>
              <div>
                <strong className="pipeline-stage-label">{stage.label}</strong>
                <span className="pipeline-stage-count">{stage.items.length} items</span>
              </div>
            </div>
            <div className="pipeline-bar">
              <div className="pipeline-bar-fill" style={{ width: `${totalItems > 0 ? (stage.items.length / totalItems) * 100 : 0}%`, background: `var(--${stage.color})` }} />
            </div>
            {i < pipeline.length - 1 && <ArrowRight size={14} className="pipeline-arrow" />}
          </div>
        ))}
      </div>
      {bottleneck.items.length > 0 && (
        <p className="hint" style={{ marginTop: 12, fontSize: 12 }}>
          <strong>{bottleneck.label}</strong> has the most items ({bottleneck.items.length}). This is likely your bottleneck.
        </p>
      )}
    </SectionBlock>

    <SectionBlock title="Quick pipeline actions" hint="keep the pipeline moving">
      <div className="pipeline-actions">
        {nextTrend && (
          <div className="pipeline-action-card">
            <Flame size={18} />
            <div>
              <strong>Jump on a trend</strong>
              <p className="muted" style={{ fontSize: 12 }}>{nextTrend.title}</p>
            </div>
            <Pill color="coral">{nextTrend.direction}</Pill>
          </div>
        )}
        <div className="pipeline-action-card">
          <Lightbulb size={18} />
          <div>
            <strong>Brainstorm new ideas</strong>
            <p className="muted" style={{ fontSize: 12 }}>Generate {niches.length > 0 ? niches.join(', ') : 'niche'} content ideas</p>
          </div>
          <Pill color="yellow">+ ideas</Pill>
        </div>
        <div className="pipeline-action-card">
          <Megaphone size={18} />
          <div>
            <strong>Check what's trending</strong>
            <p className="muted" style={{ fontSize: 12 }}>{regionLabelOf(region)} trends in your niche</p>
          </div>
          <Pill color="sky">{trends.length} trends</Pill>
        </div>
        <div className="pipeline-action-card">
          <Repeat size={18} />
          <div>
            <strong>Repurpose published content</strong>
            <p className="muted" style={{ fontSize: 12 }}>Turn 1 post into 4+ formats</p>
          </div>
          <Pill color="lavender">repurpose</Pill>
        </div>
      </div>
    </SectionBlock>

    {pipeline.filter((s) => s.items.length > 0).map((stage) => (
      <SectionBlock key={stage.id} title={`${stage.icon} ${stage.label}`} hint={`${stage.items.length} item${stage.items.length !== 1 ? 's' : ''}`}>
        <div className="pipeline-items">
          {stage.items.slice(0, 8).map((item) => (
            <div key={item.id} className="pipeline-item">
              <div className="pipeline-item-info">
                <strong style={{ fontSize: 13 }}>{item.title}</strong>
                <div className="row" style={{ gap: 6, marginTop: 4 }}>
                  <Pill color="sky">{item.platform}</Pill>
                  {item.source && <Pill color="gray">{item.source}</Pill>}
                </div>
              </div>
              {stage.id !== 'published' && (
                <button className="btn ghost btn-sm" onClick={() => void scheduleQuick(item)}>
                  <CalendarCheck size={13} /> Schedule
                </button>
              )}
            </div>
          ))}
          {stage.items.length > 8 && (
            <p className="hint" style={{ fontSize: 12, textAlign: 'center' }}>+ {stage.items.length - 8} more items</p>
          )}
        </div>
      </SectionBlock>
    ))}

    {totalItems === 0 && (
      <EmptyState emoji={STAGES[0]!.icon} title="Your pipeline is empty"
        note="Start by adding ideas in the Idea Bank or saving trends from Trend Pulse. Every idea flows through: Idea -> Script -> Film -> Edit -> Schedule -> Publish." />
    )}
  </div>;
}
