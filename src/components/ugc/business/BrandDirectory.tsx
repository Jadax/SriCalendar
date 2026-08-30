import { useMemo, useState, type ReactElement } from 'react';
import { Mail, Instagram, Globe, Search, X, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { SA_BRANDS, BRAND_CATEGORIES, CONTACT_METHODS, OUTREACH_DIFFICULTY, BUDGET_TIERS, CREATOR_WORKFLOW, type SaBrand, type BrandCategory } from '../../../data/saBrands';
import { OUTREACH_CHANNELS, OUTREACH_STATUSES, OUTREACH_STATUS_META, cap } from '../../../data/options';
import { cx, Field, FormRow, Modal, PageHead, Pill, SectionBlock, confirmDelete } from '../shared/primitives';
import { useCollection } from '../../../hooks/useCollection';
import { toDateKey } from '../../../utils/dateUtils';
import { channelOf, daysOverdue, draftOutreachFollowUp, followUpsDue } from '../../../lib/outreachBrain';
import type { OutreachContact } from '../../../types/ugc';

const outreachStatusMeta = (s: string): { emoji: string; label: string; color: 'mint' | 'coral' | 'lavender' | 'sky' | 'yellow' | 'gray' } =>
  OUTREACH_STATUS_META[s] ?? { emoji: '・', label: s, color: 'gray' };

interface Props { userId: string }

type ViewMode = 'directory' | 'workflow' | 'templates';

function addDaysKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** Business sub-tab: SA beauty, wellness & haircare directory with a persisted outreach CRM. */
export function BrandDirectory({ userId }: Props): ReactElement {
  const outreach = useCollection('outreach', userId);
  const media = useCollection('media_kit', userId);
  const mediaKit = media.items[0] ?? null;

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<BrandCategory | 'all'>('all');
  const [countryFilter, setCountryFilter] = useState<'all' | 'ZA' | 'international'>('all');
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('directory');
  const [copied, setCopied] = useState<string | null>(null);
  const [editing, setEditing] = useState<OutreachContact | null>(null);
  const [followDraft, setFollowDraft] = useState<{ brand: string; text: string } | null>(null);

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const byBrand = useMemo(() => {
    const map = new Map<string, OutreachContact>();
    for (const row of outreach.items) map.set(row.brand, row);
    return map;
  }, [outreach.items]);

  const due = useMemo(() => followUpsDue(outreach.items, todayKey), [outreach.items, todayKey]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of outreach.items) counts[row.status] = (counts[row.status] ?? 0) + 1;
    return counts;
  }, [outreach.items]);

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

  const copyText = async (key: string, text: string): Promise<void> => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 2000); } catch { /* ignore */ }
  };

  const setStatus = async (brandName: string, status: string): Promise<void> => {
    const touch = todayKey;
    const existing = byBrand.get(brandName);
    if (status === 'none') {
      if (existing) await outreach.remove(existing.id);
      return;
    }
    const nextFollowUp = status === 'collab' || status === 'done' ? null : addDaysKey(touch, 5);
    if (existing) {
      await outreach.update(existing.id, { status, last_touched: touch, follow_up_at: nextFollowUp });
      return;
    }
    const brand = SA_BRANDS.find((b) => b.name === brandName) ?? null;
    await outreach.add({
      brand: brandName, brand_category: brand?.category ?? null,
      channel: channelOf(brand), contact: brand?.email ?? null,
      status, sent_at: status === 'sent' ? touch : null,
      last_touched: touch, follow_up_at: nextFollowUp,
      template: brand?.readyToSendMessage ?? null, notes: null, deal_id: null,
    });
  };

  const snooze = async (id: string, followUpAt: string): Promise<void> => {
    await outreach.update(id, { follow_up_at: addDaysKey(followUpAt, 3) });
  };

  const openDraft = (brandName: string): void => {
    const contact = byBrand.get(brandName) ?? null;
    const brand = SA_BRANDS.find((b) => b.name === brandName) ?? null;
    setFollowDraft({ brand: brandName, text: draftOutreachFollowUp(contact, brand, mediaKit) });
  };

  const saveEdit = async (): Promise<void> => {
    if (!editing) return;
    await outreach.update(editing.id, {
      status: editing.status,
      channel: editing.channel,
      contact: editing.contact?.trim() || null,
      sent_at: editing.sent_at || null,
      last_touched: editing.last_touched || null,
      follow_up_at: editing.follow_up_at || null,
      notes: editing.notes?.trim() || null,
    });
    setEditing(null);
  };

  return <div className="ugc-page">
    <PageHead eyebrow="Business · Brands" title="Brand Directory 🤝"
      subtitle="Beauty, wellness & haircare brands with proven outreach. Your status, follow-ups and notes now persist across every device." />

    {/* View mode toggle */}
    <div className="section-block" style={{ marginBottom: 14 }}>
      <div className="subtabs">
        <button className={cx('subtab', viewMode === 'directory' && 'active')} onClick={() => setViewMode('directory')}>📋 Directory</button>
        <button className={cx('subtab', viewMode === 'workflow' && 'active')} onClick={() => setViewMode('workflow')}>⚡ Workflow</button>
        <button className={cx('subtab', viewMode === 'templates' && 'active')} onClick={() => setViewMode('templates')}>✉️ Templates</button>
      </div>
    </div>

    {viewMode === 'directory' && <>
      {due.length > 0 && (
        <SectionBlock title={`🔔 ${due.length} follow-up${due.length === 1 ? '' : 's'} waiting`} hint="a one-line nudge keeps you on their radar">
          <div className="nudge-list">
            {due.map((r) => {
              const days = daysOverdue(r.follow_up_at ?? todayKey, todayKey);
              const meta = OUTREACH_STATUS_META[r.status];
              return <div className="nudge" key={r.id}>
                <span className="nudge-emoji">📨</span>
                <div className="nudge-body">
                  <div className="row" style={{ gap: 6 }}>
                    <span className="nudge-title">{r.brand}</span>
                    {meta && <Pill color={meta.color}>{meta.label}</Pill>}
                  </div>
                  <p>{days <= 0 ? 'Follow-up is due today. Reply fast while the thread is warm.' : `${days} day${days === 1 ? '' : 's'} overdue. Reply, send a nudge, or close the loop.`}</p>
                  <div className="row" style={{ gap: 8 }}>
                    <button className="btn soft small" onClick={() => openDraft(r.brand)}>📮 Draft follow-up</button>
                    <button className="btn ghost small" onClick={() => void snooze(r.id, r.follow_up_at ?? todayKey)}>⏰ +3 days</button>
                  </div>
                </div>
              </div>;
            })}
          </div>
        </SectionBlock>
      )}

      {/* Stats bar */}
      {Object.keys(statusCounts).length > 0 && (
        <div className="section-block" style={{ marginBottom: 14 }}>
          <div className="mini-grid">
            {OUTREACH_STATUSES.map((s) => {
              const meta = outreachStatusMeta(s);
              return <div key={s} className="stat-card" style={{ opacity: (statusCounts[s] ?? 0) > 0 ? 1 : 0.4 }}>
                <div className="stat-label">{meta.emoji} {meta.label}</div>
                <div className="stat-value">{statusCounts[s] ?? 0}</div>
              </div>;
            })}
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
              const row = byBrand.get(brand.name);
              const status = row?.status ?? 'none';
              const statusMeta = OUTREACH_STATUS_META[status];
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
                      <Pill color={diff.color}>{diff.label}</Pill>
                      {status === 'none' && <span className="hint" style={{ fontSize: 11 }}>not contacted</span>}
                      {status !== 'none' && statusMeta && <Pill color={statusMeta.color}>{statusMeta.emoji} {statusMeta.label}</Pill>}
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
                          <button className="btn soft" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => void copyText(brand.name, brand.readyToSendMessage)}>
                            {copied === brand.name ? '✅ Copied!' : '📋 Copy'}
                          </button>
                        </div>
                        <pre className="brand-message-body">{brand.readyToSendMessage}</pre>
                      </div>

                      {/* Outreach timeline */}
                      {row && (
                        <div className="brand-products-box">
                          <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
                            <strong>Outreach:</strong>
                            <button className="btn ghost" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => setEditing({ ...row })}>
                              <Pencil size={11} /> Edit
                            </button>
                          </div>
                          <div className="brand-quick-info">
                            <span className="brand-info-chip">📤 Sent {row.sent_at ?? 'not set'}</span>
                            <span className="brand-info-chip">👋 Last touch {row.last_touched ?? 'never'}</span>
                            <span className="brand-info-chip">⏰ Next follow-up {row.follow_up_at ?? 'not set'}</span>
                            <span className="brand-info-chip">📱 {cap(row.channel)}</span>
                          </div>
                          {row.notes && <p className="brand-card-notes" style={{ marginTop: 8 }}>{row.notes}</p>}
                          <div className="row" style={{ gap: 8, marginTop: 8 }}>
                            {(status === 'sent' || status === 'replied' || status === 'discussing') && (
                              <button className="btn soft small" onClick={() => openDraft(brand.name)}>📮 Draft follow-up</button>
                            )}
                            <button className="btn soft small" onClick={() => void copyText(`${brand.name}-template`, brand.readyToSendMessage)}>
                              {copied === `${brand.name}-template` ? '✅ Copied!' : '📋 Copy message'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Status tracker */}
                      <div className="brand-card-status-row">
                        <span className="hint" style={{ fontSize: 11, marginRight: 6 }}>Status:</span>
                        <button
                          className={cx('status-chip', status === 'none' && 'active')}
                          onClick={() => void setStatus(brand.name, 'none')}
                        >
                          —
                        </button>
                        {OUTREACH_STATUSES.map((s) => {
                          const meta = outreachStatusMeta(s);
                          return <button
                            key={s}
                            className={cx('status-chip', status === s && 'active')}
                            onClick={() => void setStatus(brand.name, s)}
                          >
                            {meta.emoji} {meta.label}
                          </button>;
                        })}
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

    {/* Outreach edit modal */}
    {editing && <Modal title={`Outreach · ${editing.brand}`} onClose={() => setEditing(null)} wide
      footer={<div className="row" style={{ justifyContent: 'space-between', marginTop: 16 }}>
        <button className="btn ghost" onClick={() => { confirmDelete(() => { void outreach.remove(editing.id); setEditing(null); }); }}>Delete</button>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
          <button className="btn primary" onClick={() => void saveEdit()}>Save</button>
        </div>
      </div>}>
      <div className="grid" style={{ gap: 14 }}>
        <FormRow>
          <Field label="Status"><select className="select" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>{OUTREACH_STATUSES.map((s) => <option key={s} value={s}>{outreachStatusMeta(s).emoji} {outreachStatusMeta(s).label}</option>)}</select></Field>
          <Field label="Channel"><select className="select" value={editing.channel} onChange={(e) => setEditing({ ...editing, channel: e.target.value })}>{OUTREACH_CHANNELS.map((c) => <option key={c} value={c}>{cap(c)}</option>)}</select></Field>
          <Field label="Contact"><input className="input" value={editing.contact ?? ''} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} placeholder="email or handle"/></Field>
        </FormRow>
        <FormRow>
          <Field label="Sent on"><input type="date" className="date-input" value={editing.sent_at ?? ''} onChange={(e) => setEditing({ ...editing, sent_at: e.target.value })}/></Field>
          <Field label="Last touch"><input type="date" className="date-input" value={editing.last_touched ?? ''} onChange={(e) => setEditing({ ...editing, last_touched: e.target.value })}/></Field>
          <Field label="Next follow-up"><input type="date" className="date-input" value={editing.follow_up_at ?? ''} onChange={(e) => setEditing({ ...editing, follow_up_at: e.target.value })}/></Field>
        </FormRow>
        <Field label="Notes"><textarea className="textarea" rows={3} value={editing.notes ?? ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} placeholder="Who to ask for, what they said, next best move"/></Field>
      </div>
    </Modal>}

    {/* Follow-up draft modal */}
    {followDraft && <Modal title={`Follow-up for ${followDraft.brand}`} onClose={() => setFollowDraft(null)}
      footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn ghost" onClick={() => setFollowDraft(null)}>Close</button>
        <button className="btn primary" onClick={() => void copyText(`draft-${followDraft.brand}`, followDraft.text)}>{copied === `draft-${followDraft.brand}` ? '✅ Copied!' : '📋 Copy to clipboard'}</button>
      </div>}>
      <p className="hint" style={{ marginBottom: 10 }}>A short, warm nudge. Edit as needed before sending.</p>
      <pre className="brand-message-body" style={{ whiteSpace: 'pre-wrap' }}>{followDraft.text}</pre>
    </Modal>}
  </div>;
}