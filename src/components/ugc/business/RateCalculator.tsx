import { useMemo, useState, type ReactElement } from 'react';
import { Copy } from 'lucide-react';
import { suggestRate, suggestRateSmart, isGeminiConfigured as brainGemini, type RateSuggestion } from '../../../lib/creatorBrain';
import { DELIVERABLE_LABELS, FOLLOWERS_BANDS, PACKAGE_TIERS, PLATFORM_LADDER, RATE_TIERS, USAGE_ADDONS } from '../../../data/creatorIntelligence';
import { alphaBy } from '../../../data/options';
import { cap } from '../../../data/options';
import { EmptyState, Field, FormRow, PageHead, Pill, SectionBlock } from '../shared/primitives';

interface Props { userId: string }

const DEFAULT_STATE = {
  tier: 'intermediate', deliverable: 'short', usage: 'paid90', bundle: 'single', followers: 12000, niche: 'beauty',
};

/** PILLAR 3.5 — pricing intelligence: a defensible rate band so creators never quote too low. */
export function RateCalculator(_props: Props): ReactElement {
  const [tier, setTier] = useState(DEFAULT_STATE.tier);
  const [deliverable, setDeliverable] = useState(DEFAULT_STATE.deliverable);
  const [usage, setUsage] = useState(DEFAULT_STATE.usage);
  const [bundle, setBundle] = useState(DEFAULT_STATE.bundle);
  const [followers, setFollowers] = useState(DEFAULT_STATE.followers);
  const [niche, setNiche] = useState(DEFAULT_STATE.niche);
  const [smartBusy, setSmartBusy] = useState(false);
  const [smart, setSmart] = useState<RateSuggestion | null>(null);
  const [copied, setCopied] = useState(false);

  const suggestion = useMemo<RateSuggestion>(() => smart ?? suggestRate({ tier, deliverable, usage, bundle, followers, niche }), [tier, deliverable, usage, bundle, followers, niche, smart]);

  const band = FOLLOWERS_BANDS.find((b) => followers >= b.min && followers <= b.max) ?? FOLLOWERS_BANDS[0]!;

  const runSmart = async (): Promise<void> => {
    setSmartBusy(true);
    try { setSmart(await suggestRateSmart({ tier, deliverable, usage, bundle, followers, niche })); } catch { setSmart(null); } finally { setSmartBusy(false); }
  };

  const copyLine = async (): Promise<void> => {
    const dl = DELIVERABLE_LABELS[deliverable]!;
    const us = USAGE_ADDONS.find((u) => u.id === usage)!;
    const text = `${dl.label} — $${suggestion.band.low}–$${suggestion.band.high} (aim $${suggestion.mid}), ${us.label.toLowerCase()}${niche ? ` · ${niche}` : ''}`;
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* clipboard unavailable */ }
  };

  const usageAddon = USAGE_ADDONS.find((u) => u.id === usage)!;

  return <div className="ugc-page">
    <PageHead eyebrow="Pillar 3 · Business" title="Rates & pricing 🧮" subtitle="A defensible rate band so you never quote too low. Market data from 2026 UGC marketplace benchmarks."
      actions={[
        <button key="smart" className="btn soft" onClick={() => void runSmart()} disabled={smartBusy}>{smartBusy ? 'Thinking…' : brainGemini ? '✨ AI rate review' : '✨ AI rate review (offline)'}</button>,
        <button key="copy" className="btn primary" onClick={() => void copyLine()}>{copied ? 'Copied ✓' : <><Copy size={15}/> Copy rate line</>}</button>,
      ]} />

    <div className="grid grid-2">
      <SectionBlock title="Scope" hint="what you're selling">
        <div className="grid" style={{ gap: 14 }}>
          <FormRow>
            <Field label="Experience tier"><select className="select" value={tier} onChange={(e) => setTier(e.target.value)}>{RATE_TIERS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></Field>
            <Field label="Deliverable"><select className="select" value={deliverable} onChange={(e) => setDeliverable(e.target.value)}>{Object.entries(DELIVERABLE_LABELS).map(([key, d]) => <option key={key} value={key}>{d.label}</option>)}</select></Field>
          </FormRow>
          <FormRow>
            <Field label="Usage rights"><select className="select" value={usage} onChange={(e) => setUsage(e.target.value)}>{alphaBy(USAGE_ADDONS, (u) => u.label).map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}</select></Field>
            <Field label="Package"><select className="select" value={bundle} onChange={(e) => setBundle(e.target.value)}>{PACKAGE_TIERS.map((p) => <option key={p.id} value={p.id}>{p.label}{p.discount ? ` (−${Math.round(p.discount * 100)}%)` : ''}</option>)}</select></Field>
            <Field label="Niche"><input className="input" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="beauty, fitness, tech…"/></Field>
          </FormRow>
          <Field label={`Audience size — ${band.label} followers (${followers.toLocaleString()})`}><input type="range" min={0} max={500000} step={500} className="range-input" value={followers} onChange={(e) => setFollowers(Number(e.target.value))}/></Field>
          <div className="hint" style={{ fontSize: 11.5 }}>{RATE_TIERS.find((t) => t.id === tier)?.note} {DELIVERABLE_LABELS[deliverable]?.note} {usageAddon.note}</div>
        </div>
      </SectionBlock>

      <SectionBlock title="What the market says" hint={smart ? 'AI-reviewed estimate' : 'deterministic estimate'}>
        <div className="rate-hero">
          <div className="rate-band"><strong>${suggestion.band.low.toLocaleString()}</strong><span>low</span></div>
          <div className="rate-arrow">→</div>
          <div className="rate-band mid"><strong>${suggestion.mid.toLocaleString()}</strong><span>mid (aim here)</span></div>
          <div className="rate-arrow">→</div>
          <div className="rate-band"><strong>${suggestion.band.high.toLocaleString()}</strong><span>high</span></div>
        </div>
        <p className="rate-per">{suggestion.perDeliverable}{deliverable === 'bundle' ? ' across the package' : ''}</p>
        <div className="rate-drivers">
          {suggestion.drivers.map((d) => <div className="rate-driver" key={d}><span>▸</span>{d}</div>)}
        </div>
        <div className="row" style={{ marginTop: 12, flexWrap: 'wrap', gap: 6 }}>
          <Pill color="lavender">quote high, negotiate down</Pill>
          <Pill color="yellow">{usageAddon.label} +{Math.round(usageAddon.pct * 100)}%</Pill>
        </div>
        <div className="hint" style={{ fontSize: 11.5, marginTop: 10 }}>Add-ons you can quote separately:</div>
        <div className="mini-grid">
          {suggestion.addons.slice(0, 4).map((a) => <div className="stat-card" key={a.label}><div className="stat-label">{a.label}</div><div className="stat-value">+{Math.round(a.pct * 100)}%</div><div className="stat-note">{a.note}</div></div>)}
        </div>
      </SectionBlock>
    </div>

    <SectionBlock title="Where to find work" hint="the marketplace ladder — join in order">
      {PLATFORM_LADDER.length === 0 ? <EmptyState emoji="🤝" title="No marketplaces configured" note="Add the platforms you apply on and track each stage."/> :
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Platform</th><th>Join</th><th>Best for</th><th>Note</th></tr></thead><tbody>{PLATFORM_LADDER.map((p) => <tr key={p.name}><td><strong>{p.name}</strong></td><td><Pill color={p.stage === 'Day 1' ? 'mint' : p.stage.startsWith('After') ? 'yellow' : 'sky'}>{p.stage}</Pill></td><td>{p.what}</td><td className="muted">{p.note}</td></tr>)}</tbody></table></div>}
    </SectionBlock>
  </div>;
}
