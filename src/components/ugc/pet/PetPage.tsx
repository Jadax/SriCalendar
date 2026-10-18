import { useState, type ReactElement } from 'react';
import { CalendarCheck, Copy, HeartHandshake, Sparkles } from 'lucide-react';
import { usePetData } from '../../../hooks/usePetData';
import { useCopy } from '../../../hooks/useCopy';
import { adaptIdea, defaultPetProfile, generatePetIdeas, passesFiveWordTest, PET_ANGLES, PET_EDIT_STEPS, PET_HASHTAGS, PET_MUSIC_MOODS, PET_PERSONALITIES, PET_PILLARS, PET_PLAYBOOK, PET_TOOLS, PET_WELFARE, type PetIdea, type PetProfile } from '../../../lib/petBrain';
import { schedulePlatformPost } from '../../../lib/calendarActions';
import { toDateKey } from '../../../utils/dateUtils';
import { cx, EmptyState, PageHead, Pill, SectionBlock, StatCard, SubTabs } from '../shared/primitives';

interface Props { userId: string }
type PetTab = 'profile' | 'ideas' | 'shoot';

const PLATFORM_CHOICE = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'reels', label: 'IG Reels' },
  { id: 'shorts', label: 'YT Shorts' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'instagram', label: 'IG feed' },
];

export function PetPage({ userId }: Props): ReactElement {
  const { pet, save } = usePetData(userId);
  const [tab, setTab] = useState<PetTab>('profile');
  const [seed, setSeed] = useState(0);
  const [flash, setFlash] = useState('');
  const { copied, copy } = useCopy(2000);
  const profile = pet.profile;

  const updateProfile = (patch: Partial<PetProfile>): void => save({ profile: { ...profile, ...patch } });

  const generateIdeas = (): void => {
    const next = generatePetIdeas({ ...profile, name: profile.name.trim() || 'Your star' }, 7, `s${seed}`);
    setSeed((n) => n + 1);
    save({ ideas: next, doneIds: [] });
    setFlash('7 fresh ideas, built from the patterns the biggest pet accounts run on.');
    setTimeout(() => setFlash(''), 3200);
  };

  const scheduleIdea = async (idea: PetIdea): Promise<void> => {
    await schedulePlatformPost(userId, toDateKey(new Date()), {
      platform: idea.platform as never,
      title: idea.title.replace(/^[^ ]+ /, ''),
      status: 'scheduled',
      notes: `Hook: ${idea.arc.hook}\nSetup: ${idea.arc.setup}\nPayoff: ${idea.arc.payoff}\nMusic: ${idea.music}`,
    } as never);
    save({ scheduledIds: [...pet.scheduledIds, idea.id] });
    setFlash(`"${idea.title.replace(/^[^ ]+ /, '')}" is on today's calendar.`);
    setTimeout(() => setFlash(''), 3200);
  };

  const toggleDone = (ideaId: string): void => {
    save({ doneIds: pet.doneIds.includes(ideaId) ? pet.doneIds.filter((id) => id !== ideaId) : [...pet.doneIds, ideaId] });
  };

  const copyIdea = (idea: PetIdea): void => {
    const text = `${idea.title}\nFormat: ${idea.format}\nFirst frame: ${idea.arc.hook}\nSetup: ${idea.arc.setup}\nPayoff: ${idea.arc.payoff}\nMusic: ${idea.music}\nAngle: ${idea.angle}`;
    void copy(text, idea.id);
  };

  const profileReady = profile.name.trim().length > 0 && profile.personality.length > 0;
  const avgScore = pet.ideas.length > 0 ? Math.round(pet.ideas.reduce((sum, idea) => sum + idea.score, 0) / pet.ideas.length) : 0;
  const topIdea = pet.ideas[0];
  const cuts = topIdea && profile.platforms.length > 0 ? adaptIdea(topIdea, profile.platforms) : [];

  return <div>
    <PageHead eyebrow="Pet HQ" title="🐾 Pet Studio" subtitle="A second social empire, one whisker at a time" actions={profileReady ? <div className="row"><button className="btn primary small" onClick={generateIdeas}><Sparkles size={14} /> New idea round</button></div> : undefined} />

    {flash && <div className="flash-banner" role="status" onClick={() => setFlash('')}>{flash} <span className="muted">tap to dismiss</span></div>}

    <div className="grid grid-4">
      <StatCard emoji="🐾" label="Star of the show" value={profile.name.trim() || 'Unnamed yet'} note={profile.species} />
      <StatCard emoji="💡" label="Ideas banked" value={String(pet.ideas.length)} note={`${pet.doneIds.length} filmed`} />
      <StatCard emoji="📈" label="Avg hype score" value={avgScore ? `${avgScore}/100` : '—'} note="based on top-account patterns" />
      <StatCard emoji="📱" label="Platforms" value={String(profile.platforms.length)} note={`${profile.primary || 'tiktok'} leads`} />
    </div>

    <SubTabs tabs={[{ id: 'profile', label: 'Profile', icon: '🐾' }, { id: 'ideas', label: 'Ideas', icon: '💡' }, { id: 'shoot', label: 'Shoot & edit', icon: '🎥' }]} active={tab} onChange={setTab} />

    {tab === 'profile' && (
      <div className="pet-grid">
        <SectionBlock title="Who is the star?" hint="personality drives every idea the brain generates">
          <div className="form-row">
            <label className="field"><span>Name</span><input className="input" value={profile.name} onChange={(event) => updateProfile({ name: event.target.value })} placeholder="Mochi" /></label>
            <label className="field"><span>Species</span><select className="select" value={profile.species} onChange={(event) => updateProfile({ species: event.target.value as PetProfile['species'] })}><option value="cat">Cat</option><option value="dog">Dog</option><option value="other">Other floof</option></select></label>
          </div>
          <label className="field"><span>Signature look or talent</span><input className="input" value={profile.signature} onChange={(event) => updateProfile({ signature: event.target.value })} placeholder="one lid always half-closed, judged face" /><span className="hint">the instantly-recognizable visual hook top accounts lean on</span></label>
          <label className="field"><span>Quirks & running jokes</span><input className="input" value={profile.quirks} onChange={(event) => updateProfile({ quirks: event.target.value })} placeholder="screams at 5am like I forgot a staff meeting" /></label>
          <label className="field"><span>Loves (comma separated)</span><input className="input" value={profile.loves.join(', ')} onChange={(event) => updateProfile({ loves: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder="the treat bag, empty boxes, chasing the printer" /></label>
          <div className="pet-chips">{PET_PERSONALITIES.map((personality) => (
            <button key={personality} className={cx('chip-btn', profile.personality.includes(personality) && 'on')} onClick={() => updateProfile({ personality: profile.personality.includes(personality) ? profile.personality.filter((item) => item !== personality) : [...profile.personality, personality] })}>{personality}</button>
          ))}</div>
        </SectionBlock>

        <SectionBlock title="Platforms & vibe" hint="where the second empire runs">
          <div className="pet-chips">{PLATFORM_CHOICE.map((platform) => (
            <button key={platform.id} className={cx('chip-btn', profile.platforms.includes(platform.id) && 'on')} onClick={() => updateProfile({ platforms: profile.platforms.includes(platform.id) ? profile.platforms.filter((item) => item !== platform.id) : [...profile.platforms, platform.id] })}>{platform.label}</button>
          ))}</div>
          <label className="field" style={{ marginTop: 10 }}><span>Primary platform</span><select className="select" value={profile.primary} onChange={(event) => updateProfile({ primary: event.target.value })}>{profile.platforms.map((id) => <option key={id} value={id}>{PLATFORM_CHOICE.find((p) => p.id === id)?.label ?? id}</option>)}</select><span className="hint">where the account grows fastest — everything else supports the lead</span></label>
          <div className="pet-rescue"><HeartHandshake size={16} /> Rescue story? {profile.rescue ? 'Yes — the glow-up format is your superpower.' : 'No — before & after tricks still work. Day 1 vs day 30 it is.'} <button className="btn ghost small" onClick={() => updateProfile({ rescue: !profile.rescue })}>{profile.rescue ? 'Switch off' : 'Switch on'}</button></div>
        </SectionBlock>

        <SectionBlock title="Content pillars" hint="the mix the top accounts run (70% fun, 20% teaching, 10% selling)">
          <div className="pet-pillars">
            {PET_PILLARS.map((pillar) => (
              <div key={pillar.key} className="pet-pillar"><div className="pet-pillar-head"><span>{pillar.emoji}</span><strong>{pillar.label}</strong><Pill color="lavender">{pillar.weight}</Pill></div><p>{pillar.note.replace('{species}', profile.species)}</p></div>
            ))}
          </div>
        </SectionBlock>
      </div>
    )}

    {tab === 'ideas' && (pet.ideas.length === 0 ? (
      <EmptyState emoji={'\u{1F423}'} title="No ideas hatched yet" note="Save the profile, then hit New idea round — the brain turns personality, quirks and loves into shootable video plans." />
    ) : (
      <div className="pet-idea-grid">
        {pet.ideas.map((idea) => (
          <div key={idea.id} className={cx('ugc-card', pet.doneIds.includes(idea.id) && 'pet-done')}>
            <div className="pet-idea-head"><h3>{idea.title}</h3><Pill color={idea.score >= 85 ? 'coral' : idea.score >= 78 ? 'lavender' : 'sky'}>{idea.score}</Pill></div>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', margin: '8px 0' }}>
              <Pill color="peach">{idea.formatEmoji} {idea.format}</Pill>
              <Pill color="sky">{idea.platform}</Pill>
              {passesFiveWordTest(idea.title) && <Pill color="mint">5-word test ✓</Pill>}
            </div>
            <p className="card-sub"><b>First frame:</b> {idea.arc.hook}</p>
            <p className="card-sub"><b>Setup:</b> {idea.arc.setup}</p>
            <p className="card-sub"><b>Payoff:</b> {idea.arc.payoff}</p>
            <div className="pet-mini-note"><span>🎵</span><p>{idea.music}</p></div>
            <div className="pet-mini-note"><span>🎥</span><p>{idea.angle}</p></div>
            <p className="hint" style={{ marginTop: 8 }}>{idea.reason}</p>
            <div className="row" style={{ gap: 6, marginTop: 10 }}>
              <button className="btn soft small" onClick={() => void scheduleIdea(idea)} disabled={pet.scheduledIds.includes(idea.id)}><CalendarCheck size={13} /> {pet.scheduledIds.includes(idea.id) ? 'On calendar' : 'Add to calendar'}</button>
              <button className="btn ghost small" onClick={() => copyIdea(idea)}><Copy size={13} /> {copied === idea.id ? 'Copied!' : 'Copy'}</button>
              <button className="btn ghost small" onClick={() => toggleDone(idea.id)}>{pet.doneIds.includes(idea.id) ? '↺ Not filmed' : '✓ Filmed'}</button>
            </div>
          </div>
        ))}
      </div>
    ))}

    {tab === 'shoot' && (
      <div className="pet-grid">
        <SectionBlock title="Film it right" hint="four angles, one rule: get on their level">
          <div className="pet-pillars">
            {PET_ANGLES.map((angle) => <div key={angle.name} className="pet-pillar"><div className="pet-pillar-head"><span>{angle.emoji}</span><strong>{angle.name}</strong></div><p>{angle.tip}</p></div>)}
          </div>
          <div className="pet-note-box">📱 Phone is enough: natural window light, wipe the lens, prop it steady. Add a cheap tripod when you batch a week.</div>
        </SectionBlock>

        <SectionBlock title="The 5-minute edit" hint="trim dead air, hook them, end hot">
          <div className="pet-steps">
            {PET_EDIT_STEPS.map((step, index) => <div key={step.step} className="pet-step"><span className="pet-step-num">{index + 1}</span><div><strong>{step.step}</strong><p>{step.tip}</p></div></div>)}
          </div>
          <div className="pet-note-box">✂️ {PET_TOOLS}</div>
        </SectionBlock>

        {cuts.length > 0 ? (
          <SectionBlock title="One shoot, native everywhere" hint={`built from the top idea · ${profile.primary} leads`}>
            <div className="pet-cuts">
              {cuts.map((cut) => (
                <div key={cut.platform} className="ugc-card">
                  <div className="pet-idea-head"><h3>{cut.platform}</h3><Pill color="sky">{cut.length}</Pill></div>
                  <p className="card-sub"><b>First frame:</b> {cut.firstFrame}</p>
                  <p className="card-sub"><b>Audio:</b> {cut.audio}</p>
                  <p className="card-sub"><b>Safe zone:</b> {cut.safeZone}</p>
                  <p className="card-sub"><b>Best times:</b> {cut.bestTimes}</p>
                  <p className="hint" style={{ marginTop: 8 }}>{cut.extra}</p>
                </div>
              ))}
            </div>
          </SectionBlock>
        ) : (
          <EmptyState emoji={'\u{1F39E}\uFE0F'} title="Generate ideas to unlock per-platform cuts" note="The cut plan adapts each idea's first frame, audio and safe zone for every platform you picked." />
        )}

        <SectionBlock title="Music & sound moods" hint="match the sound to what's on screen">
          <div className="pet-pillars">
            {Object.entries(PET_MUSIC_MOODS).map(([pillar, mood]) => (
              <div key={pillar} className="pet-pillar"><div className="pet-pillar-head"><span>🎵</span><strong>{PET_PILLARS.find((p) => p.key === pillar)?.label ?? pillar}</strong></div><p>{mood}</p></div>
            ))}
          </div>
        </SectionBlock>

        <SectionBlock title="Welfare first" hint="their comfort is the brand — and the best footage comes from a happy pet">
          <div className="pet-welfare">
            {PET_WELFARE.map((line) => <div key={line} className="pet-welfare-row"><span>✅</span><p>{line}</p></div>)}
          </div>
          <div className="pet-note-box">🏷️ Hashtag starters: {PET_HASHTAGS.join(' ')}</div>
        </SectionBlock>
      </div>
    )}
  </div>;
}
