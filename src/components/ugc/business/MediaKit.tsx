import { useMemo, useState, type ReactElement } from 'react';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCollection } from '../../../hooks/useCollection';
import { CURRENCIES, formatMoney } from '../../../utils/money';
import { alphaBy } from '../../../data/options';
import { EmptyState, Field, FormRow, Modal, PageHead, Pill } from '../shared/primitives';
import type { MediaKitProfile, RateCard, PastCollab } from '../../../types/ugc';

interface Props { userId: string }

const emptyRates = (): RateCard => ({ id: crypto.randomUUID(), name: '', price: 0, includes: '', negotiable: true });
const emptyCollab = (): PastCollab => ({ id: crypto.randomUUID(), brand: '', format: '', year: '' });
const emptyProfile = (): MediaKitProfile => ({ id: '', user_id: '', display_name: '', tagline: '', bio: '', email: '', location: '', niche: '', form_factor: 'Long-form + Shorts', audience_demographics: {}, rates: [emptyRates()], past_collabs: [], availability: '2 videos per month', currency: 'USD', created_at: '', updated_at: '', sync_pending: 0 });

/** PILLAR 3.4 — one-page media kit with self-updating stats and a shareable preview. */
export function MediaKit({ userId }: Props): ReactElement {
  const mk = useCollection('media_kit', userId);
  const analytics = useCollection('analytics', userId);
  const profile = mk.items[0] ?? null;
  const [editing, setEditing] = useState<MediaKitProfile | null>(null);

  const stats = useMemo(() => {
    const latest = new Map<string, { followers: number; views: number; reach: number; date: string }>();
    for (const entry of analytics.items) {
      const prev = latest.get(entry.platform);
      if (!prev || new Date(entry.date).getTime() > new Date(prev.date).getTime()) latest.set(entry.platform, { followers: entry.followers, views: entry.views, reach: entry.reach, date: entry.date });
    }
    const followers = [...latest.values()].reduce((sum, s) => sum + s.followers, 0);
    const rows = analytics.items.filter((e) => e.followers > 0);
    const engagement = rows.length ? rows.reduce((sum, e) => sum + (((e.likes + e.comments + e.shares + e.saves) / e.followers) * 100), 0) / rows.length : 0;
    const avgReach = analytics.items.length ? analytics.items.reduce((sum, e) => sum + e.reach, 0) / analytics.items.length : 0;
    return { followers, engagement, avgReach };
  }, [analytics.items]);

  const openSave = async (profileToSave: MediaKitProfile): Promise<void> => {
    if (!profile) await mk.add(profileToSave as never);
    else await mk.replace({ ...profile, ...profileToSave, updated_at: new Date().toISOString() });
    setEditing(null);
  };

  const shareCopy = async (): Promise<void> => {
    const cur = profile?.currency || 'USD';
    const text = `📸 ${profile?.display_name || 'Creator'} · Media Kit\n${profile?.tagline || ''}\n${profile?.bio || ''}\n\nRates from ${formatMoney(Math.min(...(profile?.rates.map((r) => r.price) ?? [0])), cur)}`;
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
  };

  return <>
    <PageHead eyebrow="Pillar 3 · Business" title="Media kit 📇" subtitle="The one-pager brands scan. Stats refresh from your analytics automatically."
      actions={profile ? [
        <button key="share" className="btn soft" onClick={() => void shareCopy()}><ExternalLink size={14}/> Copy share text</button>,
        <button key="edit" className="btn primary" onClick={() => setEditing({ ...profile })}><Pencil size={15}/> Edit kit</button>,
      ] : [<button key="create" className="btn primary" onClick={() => setEditing(emptyProfile())}><Plus size={15}/> Create media kit</button>]} />

    {profile ? <section className="section-block"><PreviewProfile profile={profile} stats={stats} /></section> :
      <MarketsEmpty />}

    {editing && <Modal title="Edit media kit" onClose={() => setEditing(null)} wide
      footer={<div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn primary" onClick={() => void openSave(editing)}>Save kit</button></div>}>
      <div className="grid" style={{ gap: 14 }}>
        <FormRow>
          <Field label="Display name"><input className="input" value={editing.display_name ?? ''} onChange={(e) => setEditing({ ...editing, display_name: e.target.value })}/></Field>
          <Field label="Tagline"><input className="input" value={editing.tagline ?? ''} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} placeholder="e.g. Documenting the soft-life side of creating"/></Field>
        </FormRow>
        <FormRow>
          <Field label="Rate card currency"><select className="select" value={editing.currency ?? 'USD'} onChange={(e) => setEditing({ ...editing, currency: e.target.value })}>{alphaBy(CURRENCIES, (c) => c.name).map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code} · {c.name}</option>)}</select></Field>
        </FormRow>
        <FormRow>
          <Field label="Email"><input type="email" className="input" value={editing.email ?? ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })}/></Field>
          <Field label="Location"><input className="input" value={editing.location ?? ''} onChange={(e) => setEditing({ ...editing, location: e.target.value })}/></Field>
          <Field label="Niche"><input className="input" value={editing.niche ?? ''} onChange={(e) => setEditing({ ...editing, niche: e.target.value })}/></Field>
        </FormRow>
        <FormRow>
          <Field label="Form factor"><input className="input" value={editing.form_factor ?? ''} onChange={(e) => setEditing({ ...editing, form_factor: e.target.value })} placeholder="Long-form + Shorts"/></Field>
          <Field label="Availability"><input className="input" value={editing.availability ?? ''} onChange={(e) => setEditing({ ...editing, availability: e.target.value })} placeholder="2 videos / month"/></Field>
        </FormRow>
        <Field label="Bio"><textarea className="textarea" value={editing.bio ?? ''} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} placeholder="Who you are, who you reach, why you are trustworthy…"/></Field>
        <Field label="Audience demographics"><textarea className="textarea" rows={2} value={demographicsText(editing)} onChange={(e) => setEditing({ ...editing, audience_demographics: parseDemographics(e.target.value) })} placeholder="Age: 18–34 · Gender: 60% female · Geo: US/UK · Interests: beauty, wellness"/></Field>

        <div>
          <div className="block-head"><h2 style={{ fontSize: 14 }}>Rate card</h2></div>
          <div className="grid" style={{ gap: 8 }}>
            {(editing.rates ?? []).map((rate, idx) => <div key={rate.id} className="field-row" style={{ gridTemplateColumns: '1fr 110px 1.4fr 1fr 36px' }}>
              <input className="input" placeholder="Package (e.g. 1 Reel + static)" value={rate.name} onChange={(e) => setEditing(updateRate(editing, idx, { name: e.target.value }))}/>
              <input type="number" className="input" min={0} value={rate.price} onChange={(e) => setEditing(updateRate(editing, idx, { price: Number(e.target.value) }))} aria-label="Price"/>
              <input className="input" placeholder="What it includes (30-day usage…)" value={rate.includes} onChange={(e) => setEditing(updateRate(editing, idx, { includes: e.target.value }))}/>
              <select className="select" value={rate.negotiable ? 'yes' : 'no'} onChange={(e) => setEditing(updateRate(editing, idx, { negotiable: e.target.value === 'yes' }))}><option value="yes">Negotiable</option><option value="no">Fixed</option></select>
              <button className="icon-btn" onClick={() => setEditing({ ...editing, rates: (editing.rates ?? []).filter((_, i) => i !== idx) })} aria-label="Remove rate"><Trash2 size={14}/></button>
            </div>)}
            <button className="btn small ghost" style={{ justifySelf: 'start' }} onClick={() => setEditing({ ...editing, rates: [...(editing.rates ?? []), emptyRates()] })}>+ Add package</button>
          </div>
        </div>

        <div>
          <div className="block-head"><h2 style={{ fontSize: 14 }}>Past collaborations</h2></div>
          <div className="grid" style={{ gap: 8 }}>
            {(editing.past_collabs ?? []).map((collab, idx) => <div key={collab.id} className="field-row" style={{ gridTemplateColumns: '1fr 1fr 90px 36px' }}>
              <input className="input" placeholder="Brand" value={collab.brand} onChange={(e) => setEditing(updateCollab(editing, idx, { brand: e.target.value }))}/>
              <input className="input" placeholder="Format" value={collab.format} onChange={(e) => setEditing(updateCollab(editing, idx, { format: e.target.value }))}/>
              <input className="input" placeholder="Year" value={collab.year} onChange={(e) => setEditing(updateCollab(editing, idx, { year: e.target.value }))}/>
              <button className="icon-btn" onClick={() => setEditing({ ...editing, past_collabs: (editing.past_collabs ?? []).filter((_, i) => i !== idx) })} aria-label="Remove collab"><Trash2 size={14}/></button>
            </div>)}
            <button className="btn small ghost" style={{ justifySelf: 'start' }} onClick={() => setEditing({ ...editing, past_collabs: [...(editing.past_collabs ?? []), emptyCollab()] })}>+ Add collab</button>
          </div>
        </div>
      </div>
    </Modal>}
  </>;
}

function MarketsEmpty(): ReactElement {
  return <section className="section-block"><EmptyState emoji="📇" title="No media kit yet" note="Build a one-page kit with your rates, stats and past work, then copy it into any brand pitch."/></section>;
}

function PreviewProfile({ profile, stats }: { profile: MediaKitProfile; stats: { followers: number; engagement: number; avgReach: number } }): ReactElement {
  const cur = profile.currency || 'USD';
  const er = stats.engagement.toFixed(2);
  const followers = stats.followers ? formatCompact(stats.followers) : '·';
  const reach = stats.avgReach ? formatCompact(stats.avgReach) : '·';
  const showRealStats = stats.followers > 0;
  return <div className="mk-preview">
    <div className="mk-hero">
      <div className="mk-avatar">{profile.display_name?.trim()?.[0]?.toUpperCase() ?? 'C'}</div>
      <h2>{profile.display_name || 'Your Name'}</h2>
      <p>{profile.tagline}</p>
    </div>
    <div className="mk-body">
      <div className="grid grid-3" style={{ gap: 10 }}>
        <div className="mk-stat"><strong>{followers}</strong><span>Followers</span></div>
        <div className="mk-stat"><strong>{er}%</strong><span>Engagement</span></div>
        <div className="mk-stat"><strong>{reach}</strong><span>Avg reach</span></div>
      </div>
      {!showRealStats && <div className="row" style={{ marginTop: 10 }}><Pill color="peach">demo stats. Add analytics to auto-fill</Pill></div>}
      <div className="mk-section-title">About</div>
      <p>{profile.bio || 'Bio goes here. Who you reach and why you are trustworthy.'}</p>
      <div className="mk-divider"/>
      <div className="grid grid-2" style={{ gap: 8 }}>
        {[profile.niche && ['🎯', 'Niche', profile.niche], profile.location && ['📍', 'Location', profile.location], profile.form_factor && ['🎬', 'Form factor', profile.form_factor], profile.availability && ['📅', 'Availability', profile.availability]].filter(Boolean).map((row, i) => {
          const [emoji, label, value] = row as [string, string, string];
          return <div key={i} className="mk-item"><div><b>{emoji} {label}</b></div><div>{value}</div></div>;
        })}
      </div>
      {(profile.audience_demographics.age || profile.audience_demographics.gender || profile.audience_demographics.geo) && <><div className="mk-section-title">Audience</div><div className="mk-list">{Object.entries(profile.audience_demographics).filter(([, v]) => v).map(([k, v]) => <div key={k} className="mk-item"><b>{k}</b><div>{v}</div></div>)}</div></>}
      {(profile.rates ?? []).filter((r) => r.name).length > 0 && <><div className="mk-section-title">Rates</div><div className="mk-list">{(profile.rates ?? []).filter((r) => r.name).map((r) => <div key={r.id} className="mk-item"><div><b>{r.name}</b>{r.includes ? <div className="muted" style={{ fontSize: 10.5 }}>{r.includes}</div> : null}</div><div><b>{formatMoney(r.price, cur)}</b> {r.negotiable ? <span className="muted" style={{ fontSize: 10 }}>nego</span> : null}</div></div>)}</div></>}
      {(profile.past_collabs ?? []).filter((c) => c.brand).length > 0 && <><div className="mk-section-title">Past collabs</div><div className="mk-list">{(profile.past_collabs ?? []).filter((c) => c.brand).map((c) => <div key={c.id} className="mk-item"><b>{c.brand}</b><div className="muted">{c.format} · {c.year}</div></div>)}</div></>}
      <div className="mk-contact">{profile.email ? `📧 ${profile.email}` : 'hello@example.com'}</div>
    </div>
  </div>;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function demographicsText(p: MediaKitProfile): string {
  const d = p.audience_demographics ?? {};
  return Object.entries(d).filter(([, v]) => v).map(([k, v]) => `${k.slice(0, 1).toUpperCase()}${k.slice(1)}: ${v}`).join(' · ');
}
function parseDemographics(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of text.split(/[·\n,;]/)) {
    const [key, ...rest] = part.split(':');
    if (key && rest.length) out[key.trim().toLowerCase()] = rest.join(':').trim();
  }
  return out;
}
function updateRate(p: MediaKitProfile, idx: number, patch: Partial<RateCard>): MediaKitProfile {
  return { ...p, rates: (p.rates ?? []).map((r, i) => (i === idx ? { ...r, ...patch } : r)) };
}
function updateCollab(p: MediaKitProfile, idx: number, patch: Partial<PastCollab>): MediaKitProfile {
  return { ...p, past_collabs: (p.past_collabs ?? []).map((c, i) => (i === idx ? { ...c, ...patch } : c)) };
}