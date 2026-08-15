import { useMemo, useState, type ReactElement } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useCollection } from '../../hooks/useCollection';
import { GOAL_OPTIONS, EXPERIENCE_OPTIONS, NICHE_OPTIONS, starterPillars, starterGoals, starterHooks, starterChecklists, starterMediaKit, type OnboardingProfile } from '../../data/onboarding';

interface Props {
  userId: string;
  initialName: string;
  onComplete: (profile: OnboardingProfile) => void;
}

/** First-run wizard: sets the name, niches, goal and experience, then preconfigures the whole workspace. */
export function OnboardingWizard({ userId, initialName, onComplete }: Props): ReactElement {
  const pillars = useCollection('content_pillars', userId);
  const goals = useCollection('goals', userId);
  const hooks = useCollection('hook_library', userId);
  const checklists = useCollection('production_checklists', userId);
  const media = useCollection('media_kit', userId);

  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName ?? '');
  const [niches, setNiches] = useState<string[]>([]);
  const [goal, setGoal] = useState<number>(500);
  const [experience, setExperience] = useState('new');
  const [busy, setBusy] = useState(false);

  const canNext = step === 0 ? name.trim().length > 1 : step === 1 ? niches.length > 0 : step === 2 || step === 3;

  const toggleNiche = (value: string): void => {
    setNiches((cur) => (cur.includes(value) ? cur.filter((n) => n !== value) : [...cur, value]));
  };

  const finish = async (): Promise<void> => {
    if (busy) return;
    setBusy(true);
    const profile: OnboardingProfile = { name: name.trim(), niches, goal, experience, onboarded: true };
    try {
      await Promise.all([
        ...starterPillars(niches).map((p) => pillars.add(p as never)),
        ...starterGoals(goal).map((g) => goals.add(g as never)),
        ...starterHooks(niches).map((h) => hooks.add(h as never)),
        ...starterChecklists().map((c) => checklists.add(c as never)),
        media.add(starterMediaKit(niches, experience) as never),
      ]);
      onComplete(profile);
    } catch {
      setBusy(false);
    }
  };

  const progress = ((step + 1) / 4) * 100;

  return <div className="welcome-backdrop" role="dialog" aria-modal="true" aria-label="Welcome to your creator workspace">
    <section className="welcome-modal onboarding">
      <div className="onboarding-progress"><div className="onboarding-progress-fill" style={{ width: `${progress}%` }}/></div>

      {step === 0 && <>
        <div className="welcome-icon"><Sparkles size={26}/></div>
        <p className="eyebrow">Welcome, this one is for you</p>
        <h2>Let's make it yours</h2>
        <p>A tiny setup so everything from ideas to invoicing is ready the way you like it.</p>
        <label htmlFor="onboard-name" style={{ fontSize: 13, fontWeight: 800, color: '#5d4f79' }}>First name</label>
        <input id="onboard-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus autoComplete="given-name" placeholder="e.g. Sri" />
        <p className="hint" style={{ marginTop: 8 }}>It's just for your daily hello and dashboard.</p>
      </>}

      {step === 1 && <>
        <div className="welcome-icon">💄</div>
        <p className="eyebrow">Step 2 of 4</p>
        <h2>What do you love making?</h2>
        <p>Pick one or two — a clear niche beats "a bit of everything".</p>
        <div className="onboarding-grid">
          {NICHE_OPTIONS.map((n) => {
            const active = niches.includes(n.value);
            return <button key={n.value} type="button" className={`onboarding-card ${active ? 'active' : ''}`} onClick={() => toggleNiche(n.value)}>
              <span style={{ fontSize: 22 }}>{n.emoji}</span>
              <strong>{n.label}</strong>
              <small>{n.tagline}</small>
            </button>;
          })}
        </div>
        <p className="hint" style={{ marginTop: 10 }}>{niches.length === 0 ? 'Select at least one to continue.' : `Selected: ${niches.map((n) => NICHE_OPTIONS.find((o) => o.value === n)?.label).join(' + ')}`}</p>
      </>}

      {step === 2 && <>
        <div className="welcome-icon">💰</div>
        <p className="eyebrow">Step 3 of 4</p>
        <h2>Your money goal</h2>
        <p>This sets your revenue goals and rate guidance. You can change it anytime.</p>
        <div className="onboarding-grid two-col">
          {GOAL_OPTIONS.map((g) => {
            const active = goal === g.value;
            return <button key={g.value} type="button" className={`onboarding-card ${active ? 'active' : ''}`} onClick={() => setGoal(g.value)}>
              <span style={{ fontSize: 22 }}>{g.emoji}</span>
              <strong>${g.value.toLocaleString()} / mo</strong>
              <small>{g.note}</small>
            </button>;
          })}
        </div>
      </>}

      {step === 3 && <>
        <div className="welcome-icon">🎬</div>
        <p className="eyebrow">Step 4 of 4</p>
        <h2>Where are you now?</h2>
        <p>We'll match your starter rate card and guidance to your experience.</p>
        <div className="onboarding-grid two-col">
          {EXPERIENCE_OPTIONS.map((e) => {
            const active = experience === e.value;
            return <button key={e.value} type="button" className={`onboarding-card ${active ? 'active' : ''}`} onClick={() => setExperience(e.value)}>
              <span style={{ fontSize: 22 }}>{e.emoji}</span>
              <strong>{e.label}</strong>
              <small>{e.note}</small>
            </button>;
          })}
        </div>
      </>}

      <div className="onboarding-nav">
        {step > 0 && <button className="btn ghost" onClick={() => setStep((s) => s - 1)} disabled={busy}><ArrowLeft size={15}/> Back</button>}
        <span className="spacer"/>
        {step < 3
          ? <button className="btn primary" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>Continue <ArrowRight size={15}/></button>
          : <button className="btn primary" onClick={() => void finish()} disabled={busy}>{busy ? <><Loader2 size={15} className="spin"/> Setting up your workspace…</> : 'Finish, I\'m ready 🎉'}</button>}
      </div>
    </section>
  </div>;
}
