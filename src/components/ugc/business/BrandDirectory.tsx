import { useMemo, useState, type ReactElement } from 'react';
import { Mail, Instagram, Globe, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { SA_BRANDS, BRAND_CATEGORIES, CONTACT_METHODS, OUTREACH_DIFFICULTY, BUDGET_TIERS, CREATOR_WORKFLOW, type SaBrand, type BrandCategory } from '../../../data/saBrands';
import { cx, PageHead, Pill, SectionBlock } from '../shared/primitives';

interface Props { userId: string }

interface BrandStatus {
  [key: string]: 'none' | 'contacted' | 'interested' | 'pitched' | 'collaborating' | 'done';
}

const STATUS_OPTIONS: { id: BrandStatus[string]; label: string; color: 'mint' | 'coral' | 'lavender' | 'sky' | 'yellow' }[] = [
  { id: 'none', label: '—', color: 'mint' },
  { id: 'contacted', label: '📩 Contacted', color: 'sky' },
  { id: 'interested', label: '👀 Interested', color: 'yellow' },
  { id: 'pitched', label: '📋 Pitched', color: 'lavender' },
  { id: 'collaborating', label: '🤝 Collaborating', color: 'mint' },
  { id: 'done', label: '✅ Done', color: 'coral' },
];

function getStatusColor(status: BrandStatus[string]): 'sky' | 'yellow' | 'lavender' | 'mint' | 'coral' {
  return STATUS_OPTIONS.find((s) => s.id === status)?.color ?? 'mint';
}

function getStatusLabel(status: BrandStatus[string]): string {
  return STATUS_OPTIONS.find((s) => s.id === status)?.label ?? '—';
}

type ViewMode = 'directory' | 'workflow' | 'templates';

/** Business page sub-tab: comprehensive directory of SA beauty, wellness & haircare brands with proven outreach. */
export function BrandDirectory({ userId }: Props): ReactElement {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<BrandCategory | 'all'>('all');
  const [countryFilter, setCountryFilter] = useState<'all' | 'ZA' | 'international'>('all');
  const [statuses, setStatuses] = useState<BrandStatus>({});
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('directory');
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = SA_BRANDS;
    if (countryFilter !== 'all') {
      result = result.filter((b) => b.country === countryFilter);
    }
    if (categoryFilter !== 'all') {
      result = result.filter((b) => b.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((b) =>
        b.name.toLowerCase().includes(q) ||
        b.notes.toLowerCase().includes(q) ||
        b.subcategory.toLowerCase().includes(q) ||
        b.keyProducts.some((p) => p.toLowerCase().includes(q))
      );
    }
    return result;
  }, [search, categoryFilter, countryFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: SA_BRANDS.length };
    for (const b of SA_BRANDS) { counts[b.category] = (counts[b.category] || 0) + 1; }
    return counts;
  }, []);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of Object.values(statuses)) {
      if (s !== 'none') counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [statuses]);

  const updateStatus = (brandName: string, status: BrandStatus[string]): void => {
    setStatuses((prev) => ({ ...prev, [brandName]: status }));
  };

  const copyTemplate = async (key: string, text: string): Promise<void> => {
    try { await navigator.clipboard.writeText(text); setCopiedTemplate(key); setTimeout(() => setCopiedTemplate(null), 2000); } catch { /* ignore */ }
  };

  return <div className="ugc-page">
    <PageHead eyebrow="Business · Brands" title="Brand Directory 🤝"
      subtitle={`${SA_BRANDS.length} beauty, wellness & haircare brands with proven outreach strategies.`} />

    {/* View mode toggle */}
    <div className="section-block" style={{ marginBottom: 14 }}>
      <div className="subtabs">
        <button className={cx('subtab', viewMode === 'directory' && 'active')} onClick={() => setViewMode('directory')}>📋 Directory</button>
        <button className={cx('subtab', viewMode === 'workflow' && 'active')} onClick={() => setViewMode('workflow')}>⚡ Workflow</button>
        <button className={cx('subtab', viewMode === 'templates' && 'active')} onClick={() => setViewMode('templates')}>✉️ Templates</button>
      </div>
    </div>

    {viewMode === 'directory' && <>
      {/* Stats bar */}
      {Object.keys(statusCounts).length > 0 && (
        <div className="section-block" style={{ marginBottom: 14 }}>
          <div className="mini-grid">
            {STATUS_OPTIONS.filter((s) => s.id !== 'none').map((s) => (
              <div key={s.id} className="stat-card" style={{ opacity: (statusCounts[s.id] ?? 0) > 0 ? 1 : 0.4 }}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{statusCounts[s.id] ?? 0}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Country filter */}
      <div className="section-block" style={{ marginBottom: 10 }}>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className={cx('niche-chip', countryFilter === 'all' && 'active')} onClick={() => setCountryFilter('all')}>
            🌍 All ({SA_BRANDS.length})
          </button>
          <button className={cx('niche-chip', countryFilter === 'ZA' && 'active')} onClick={() => setCountryFilter('ZA')}>
            🇿🇦 South Africa ({SA_BRANDS.filter((b) => b.country === 'ZA').length})
          </button>
          <button className={cx('niche-chip', countryFilter === 'international' && 'active')} onClick={() => setCountryFilter('international')}>
            🌐 International ({SA_BRANDS.filter((b) => b.country === 'international').length})
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="section-block" style={{ marginBottom: 10 }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9b7ce1', pointerEvents: 'none' }} />
          <input
            className="input"
            placeholder="Search brands, strategies, categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 32, width: '100%', boxSizing: 'border-box' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9b7ce1' }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category filters */}
      <div className="section-block" style={{ marginBottom: 18 }}>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className={cx('niche-chip', categoryFilter === 'all' && 'active')} onClick={() => setCategoryFilter('all')}>
            All ({SA_BRANDS.length})
          </button>
          {BRAND_CATEGORIES.filter((c) => (categoryCounts[c.id] ?? 0) > 0).map((c) => (
            <button key={c.id} className={cx('niche-chip', categoryFilter === c.id && 'active')} onClick={() => setCategoryFilter(c.id)}>
              {c.icon} {c.label} ({categoryCounts[c.id] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {/* Brand list */}
      <SectionBlock title={countryFilter === 'all' ? 'All brands' : countryFilter === 'ZA' ? '🇿🇦 South African Brands' : '🌐 International Brands'}
        hint={`${filtered.length} brand${filtered.length !== 1 ? 's' : ''}`}>

        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🔍</p>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--heading)' }}>No brands found</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="brand-grid">
            {filtered.map((brand) => {
              const status = statuses[brand.name] ?? 'none';
              const isExpanded = expandedBrand === brand.name;
              const diff = OUTREACH_DIFFICULTY[brand.outreachDifficulty];
              const budget = BUDGET_TIERS[brand.typicalBudget];
              const contact = CONTACT_METHODS[brand.contactMethod];
              return (
                <div key={brand.name} className={cx('brand-card', isExpanded && 'expanded')}>
                  <div className="brand-card-header" onClick={() => setExpandedBrand(isExpanded ? null : brand.name)}>
                    <div className="brand-card-info">
                      <h4 className="brand-card-name">{brand.name}</h4>
                      <span className="brand-card-sub">{brand.subcategory} · {brand.country === 'ZA' ? '🇿🇦 SA' : '🌐 International'}</span>
                    </div>
                    <div className="brand-card-actions" onClick={(e) => e.stopPropagation()}>
                      <Pill color={diff.color}>{diff.label.split(' —')[0]}</Pill>
                      {status !== 'none' && <Pill color={getStatusColor(status)}>{getStatusLabel(status)}</Pill>}
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="brand-card-details">
                      <p className="brand-card-notes">{brand.notes}</p>

                      {/* Key products */}
                      {brand.keyProducts.length > 0 && (
                        <div className="brand-products-box">
                          <strong>Key Products:</strong>
                          <div className="brand-products-list">
                            {brand.keyProducts.map((p) => <span key={p} className="brand-product-chip">{p}</span>)}
                          </div>
                        </div>
                      )}

                      {/* Key events */}
                      {brand.keyEvents.length > 0 && (
                        <div className="brand-products-box">
                          <strong>Events & Programmes:</strong>
                          <div className="brand-products-list">
                            {brand.keyEvents.map((e) => <span key={e} className="brand-product-chip">{e}</span>)}
                          </div>
                        </div>
                      )}

                      {/* Quick info */}
                      <div className="brand-quick-info">
                        <span className="brand-info-chip">📧 {contact.label}</span>
                        <span className="brand-info-chip">💰 {budget.label} ({budget.range})</span>
                      </div>

                      {/* Links */}
                      <div className="brand-card-links">
                        {brand.instagram && (
                          <a href={`https://instagram.com/${brand.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="brand-link">
                            <Instagram size={13} /> {brand.instagram}
                          </a>
                        )}
                        {brand.tiktok && (
                          <a href={`https://tiktok.com/${brand.tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="brand-link">
                            🎵 {brand.tiktok}
                          </a>
                        )}
                        {brand.email && (
                          <a href={`mailto:${brand.email}`} className="brand-link">
                            <Mail size={13} /> {brand.email}
                          </a>
                        )}
                        {brand.website && (
                          <a href={`https://${brand.website}`} target="_blank" rel="noopener noreferrer" className="brand-link">
                            <Globe size={13} /> {brand.website}
                          </a>
                        )}
                      </div>

                      {/* Ready-to-send message */}
                      <div className="brand-message-box">
                        <div className="brand-message-header">
                          <span>✉️ Ready-to-Send Message</span>
                          <button className="btn soft" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => void copyTemplate(brand.name, brand.readyToSendMessage)}>
                            {copiedTemplate === brand.name ? '✅ Copied!' : '📋 Copy'}
                          </button>
                        </div>
                        <pre className="brand-message-body">{brand.readyToSendMessage}</pre>
                      </div>

                      {/* Status tracker */}
                      <div className="brand-card-status-row">
                        <span className="hint" style={{ fontSize: 11, marginRight: 6 }}>Status:</span>
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s.id}
                            className={cx('status-chip', status === s.id && 'active')}
                            onClick={() => updateStatus(brand.name, s.id)}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionBlock>
    </>}

    {viewMode === 'workflow' && (
      <SectionBlock title="Creator Workflow" hint="complete guide from ideation to payment">
        <div className="workflow-steps-full">
          {CREATOR_WORKFLOW.map((step) => (
            <div key={step.step} className="workflow-step-full">
              <div className="workflow-step-icon-full">{step.icon}</div>
              <div className="workflow-step-content">
                <h4 className="workflow-step-title">Step {step.step}: {step.title}</h4>
                <p className="workflow-step-desc">{step.description}</p>
                <span className="workflow-step-time">⏱ {step.timeframe}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionBlock>
    )}

    {viewMode === 'templates' && (
      <SectionBlock title="Outreach Tips" hint="proven strategies that actually get replies">
        <div className="outreach-tips">
          <div className="tip-card">
            <h4>📧 Email Best Practices</h4>
            <ul>
              <li>Keep under 120 words — creators read on phone between edits</li>
              <li>Reference ONE specific video/post they made — shows you actually watched</li>
              <li>Name a real number first — proves you have budget, not asking "what are your rates?"</li>
              <li>One clear CTA: "Would you be open to reviewing a quick media kit?"</li>
              <li>Subject line under 50 characters gets 12% higher open rates</li>
            </ul>
          </div>
          <div className="tip-card">
            <h4>📱 DM Best Practices</h4>
            <ul>
              <li>Under 100 words — DMs need to be short</li>
              <li>Reference a specific post by name or timestamp</li>
              <li>Move to email after they express interest</li>
              <li>DMs work best for nano (1K–10K) and micro (10K–50K) creators</li>
              <li>Warm outreach (engaged with their content first) gets 50–65% reply rate</li>
            </ul>
          </div>
          <div className="tip-card">
            <h4>🔄 Follow-Up Rules</h4>
            <ul>
              <li>Follow-up #1: 5 business days after first message (+7–12% recovery)</li>
              <li>Follow-up #2: 5 days after #1, use "Should I close the loop?" (+8–15%)</li>
              <li>After 2 non-responses, stop. Add to 90-day re-engagement list</li>
              <li>Never send follow-ups from a different sender name — looks like a CRM</li>
              <li>Reply within 4 hours if they respond — rate drops 35% after 24h</li>
            </ul>
          </div>
          <div className="tip-card">
            <h4>💡 What Works in SA</h4>
            <ul>
              <li>Clicks and Dis-Chem have formal influencer programmes — apply through them</li>
              <li>Dove's #DoveCreatorCollective accepts creators with 1.5K–15K followers</li>
              <li>Small SA brands (Skin Functional, Candi & Co) respond fast to DMs</li>
              <li>L'Oréal brands work through Styling Concepts PR or Dentsu Creative agencies</li>
              <li>Always create content BEFORE pitching — shows your work, not just your words</li>
            </ul>
          </div>
        </div>
      </SectionBlock>
    )}
  </div>;
}
