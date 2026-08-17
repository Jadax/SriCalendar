import { useMemo, useState, type ReactElement } from 'react';
import { ExternalLink, Eye } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { NICHES } from '../../../data/creatorIntelligence';
import { cx, EmptyState, PageHead, Pill, SectionBlock } from '../shared/primitives';
import type { BoardCard, ContentIdea } from '../../../types/ugc';

interface Props { userId: string }

interface PortfolioEntry {
  id: string;
  title: string;
  platform: string | null;
  niche: string;
  brand: string | null;
  date: string;
  hook: string | null;
  source: 'board' | 'idea';
}

const PLATFORM_COLORS: Record<string, 'coral' | 'mint' | 'lavender' | 'yellow' | 'sky'> = {
  tiktok: 'coral', instagram: 'lavender', youtube: 'mint', x: 'sky', facebook: 'yellow',
};

const NICHE_PHILOSOPHY: Record<string, string> = {
  fitness: 'Workouts, gym content, and wellness routines that inspire movement.',
  beauty: 'Skincare, makeup, and beauty routines that educate and empower.',
  fashion: 'OOTD, styling tips, and hauls that build personal style.',
  food: 'Recipes, reviews, and food hacks that bring people to the table.',
  travel: 'Vlogs, guides, and travel tips for the curious explorer.',
  tech: 'Reviews, unboxing, and tech tips that demystify gadgets.',
  parenting: 'Parenting tips, hacks, and family moments that resonate.',
  finance: 'Budgeting, saving, and investing content that builds wealth.',
  gaming: 'Gameplay, reviews, and streams that entertain and connect.',
  lifestyle: 'Daily vlogs, routines, and lifestyle content that inspires.',
};

/** PILLAR 2 — Portfolio Gallery: visual showcase of published work by niche (stolen from ugcbylinda.com). */
export function PortfolioGallery({ userId }: Props): ReactElement {
  const { items: board } = useCollection('production_board', userId);
  const { items: ideas } = useCollection('content_ideas', userId);
  const [nicheFilter, setNicheFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'spotlight'>('grid');

  const entries = useMemo<PortfolioEntry[]>(() => {
    const published = board
      .filter((c: BoardCard) => c.column_name === 'published' || c.status === 'published')
      .map((c: BoardCard): PortfolioEntry => ({
        id: c.id, title: c.title, platform: c.platform, niche: (c.video_type || 'lifestyle') as string,
        brand: c.sponsor, date: c.updated_at || c.created_at, hook: null, source: 'board',
      }));
    const publishedIdeas = ideas
      .filter((i: ContentIdea) => i.status === 'published')
      .map((i: ContentIdea): PortfolioEntry => ({
        id: i.id, title: i.title, platform: i.platform, niche: (i.pillar || 'lifestyle') as string,
        brand: i.inspiration_source?.includes('🤝') ? i.inspiration_source : null,
        date: i.updated_at || i.created_at, hook: i.hook_idea, source: 'idea',
      }));
    const seen = new Set<string>();
    return [...published, ...publishedIdeas].filter((e) => {
      const key = e.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [board, ideas]);

  const filtered = useMemo(() =>
    nicheFilter === 'all' ? entries : entries.filter((e) => e.niche === nicheFilter),
    [entries, nicheFilter],
  );

  const nicheCounts = useMemo(() => {
    const counts: Record<string, number> = { all: entries.length };
    for (const e of entries) { counts[e.niche] = (counts[e.niche] || 0) + 1; }
    return counts;
  }, [entries]);

  return <div className="ugc-page">
    <PageHead eyebrow="Studio · Portfolio" title="Portfolio Gallery ✨"
      subtitle={`Your published work at a glance. ${entries.length} piece${entries.length !== 1 ? 's' : ''} live.`} />

    <div className="section-block" style={{ marginBottom: 18 }}>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className={cx('niche-chip', nicheFilter === 'all' && 'active')} onClick={() => setNicheFilter('all')}>
            All ({entries.length})
          </button>
          {NICHES.filter((n) => (nicheCounts[n] ?? 0) > 0).map((n) => (
            <button key={n} className={cx('niche-chip', nicheFilter === n && 'active')} onClick={() => setNicheFilter(n)}>
              {n} ({nicheCounts[n] ?? 0})
            </button>
          ))}
        </div>
        <div className="subtabs" style={{ width: 'auto' }}>
          <button className={cx('subtab', viewMode === 'grid' && 'active')} onClick={() => setViewMode('grid')}>📋 Grid</button>
          <button className={cx('subtab', viewMode === 'spotlight' && 'active')} onClick={() => setViewMode('spotlight')}>✨ Spotlight</button>
        </div>
      </div>
    </div>

    <SectionBlock title={nicheFilter === 'all' ? 'All published work' : `${nicheFilter} portfolio`}
      hint={`${filtered.length} piece${filtered.length !== 1 ? 's' : ''}${nicheFilter !== 'all' ? ` in ${nicheFilter}` : ''}`}>

      {nicheFilter !== 'all' && NICHE_PHILOSOPHY[nicheFilter] && (
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 14, fontStyle: 'italic' }}>
          💡 {NICHE_PHILOSOPHY[nicheFilter]}
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState emoji="🎨" title="No published work yet"
          note="Move content through your Production Board to 'Published' or mark ideas as published — they'll show up here as your visual portfolio." />
      ) : viewMode === 'spotlight' ? (
        <div className="portfolio-spotlight">
          {filtered.slice(0, 6).map((e, i) => (
            <div key={e.id} className={cx('portfolio-spotlight-card', i === 0 && 'featured')}>
              <div className="portfolio-spotlight-number">#{i + 1}</div>
              <div className="portfolio-card-header">
                <Pill color={PLATFORM_COLORS[e.platform || ''] || 'gray'}>{e.platform || 'ugc'}</Pill>
                <Pill color="gray">{e.niche}</Pill>
                {i === 0 && <Pill color="coral">✨ featured</Pill>}
              </div>
              <h4 className="portfolio-card-title">{e.title}</h4>
              {e.hook && <p className="portfolio-card-hook">"{e.hook.slice(0, 120)}{e.hook.length > 120 ? '…' : ''}"</p>}
              {e.brand && <span className="portfolio-card-brand">🤝 {e.brand}</span>}
              <div className="portfolio-card-footer">
                <span className="hint" style={{ fontSize: 11 }}>{new Date(e.date).toLocaleDateString()}</span>
                <span className="hint" style={{ fontSize: 11 }}>{e.source === 'board' ? 'board' : 'idea'}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="portfolio-grid">
          {filtered.map((e) => (
            <div key={e.id} className="portfolio-card">
              <div className="portfolio-card-header">
                <Pill color={PLATFORM_COLORS[e.platform || ''] || 'gray'}>{e.platform || 'ugc'}</Pill>
                <Pill color="gray">{e.niche}</Pill>
              </div>
              <h4 className="portfolio-card-title">{e.title}</h4>
              {e.hook && <p className="portfolio-card-hook">"{e.hook.slice(0, 80)}{e.hook.length > 80 ? '…' : ''}"</p>}
              {e.brand && <span className="portfolio-card-brand">🤝 {e.brand}</span>}
              <div className="portfolio-card-footer">
                <span className="hint" style={{ fontSize: 11 }}>{new Date(e.date).toLocaleDateString()}</span>
                <span className="hint" style={{ fontSize: 11 }}>{e.source === 'board' ? 'board' : 'idea'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionBlock>

    {entries.length > 0 && (
      <SectionBlock title="Portfolio stats" hint="quick overview of your published content">
        <div className="mini-grid">
          <div className="stat-card">
            <div className="stat-label">Total pieces</div>
            <div className="stat-value">{entries.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Niches covered</div>
            <div className="stat-value">{new Set(entries.map((e) => e.niche)).size}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Platforms used</div>
            <div className="stat-value">{new Set(entries.map((e) => e.platform).filter(Boolean)).size}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Brand collabs</div>
            <div className="stat-value">{entries.filter((e) => e.brand).length}</div>
          </div>
        </div>
      </SectionBlock>
    )}
  </div>;
}
