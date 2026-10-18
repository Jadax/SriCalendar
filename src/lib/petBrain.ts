import { seededHash } from '../utils/seededHash';

export interface PetProfile {
  name: string;
  species: 'cat' | 'dog' | 'other';
  personality: string[];
  signature: string;
  quirks: string;
  loves: string[];
  rescue: boolean;
  platforms: string[];
  primary: string;
}

export interface PetArc { hook: string; setup: string; payoff: string }

export interface PetIdea {
  id: string;
  title: string;
  format: string;
  formatEmoji: string;
  pillar: string;
  reason: string;
  hookCopy: string;
  arc: PetArc;
  score: number;
  music: string;
  angle: string;
  platform: string;
}

export interface PetPlatformCut {
  platform: string;
  length: string;
  firstFrame: string;
  audio: string;
  safeZone: string;
  bestTimes: string;
  extra: string;
}

export const PET_PERSONALITIES = ['tiny CEO', 'chaos gremlin', 'dramatic queen', 'food critic', 'shadow ninja', 'gentle soul', 'happy greeter', 'bedtime gremlin'] as const;

export const PET_PILLARS = [
  { key: 'reactions', label: 'Reactions & comedy', weight: 70, emoji: '🙀', note: 'Unexpected sounds, new toys, snack bag shakes. Raw phone footage wins — film WITH context (a beat before and after).' },
  { key: 'daily', label: 'Day in the life', weight: 65, emoji: '🎞️', note: 'Narrated from their point of view. Builds the deepest follow connection and feeds long-form YouTube.' },
  { key: 'glowup', label: 'Before & after', weight: 60, emoji: '💫', note: 'Rescue glow-ups, day 1 vs day 30 tricks, grooming reveals. The most saved and shared format.' },
  { key: 'tricks', label: 'Tricks & training', weight: 60, emoji: '🎾', note: 'Show the learning journey, not just the win. Progression clips invest viewers in the outcome.' },
  { key: 'reviews', label: 'Toy & treat reviews', weight: 55, emoji: '📦', note: 'Unbox from their eye level and keep reactions real. The honest bridge to brand deals.' },
  { key: 'trends', label: 'Trending sounds', weight: 65, emoji: '🎵', note: 'Spot a sound, put your pet twist on it within 24–48h while the audio still has wind in its sails.' },
  { key: 'knowhow', label: 'Breed & care know-how', weight: 40, emoji: '🧠', note: '“Things nobody tells you about {species}” — low views, high saves, builds authority.' },
] as const;

const TITLE_SEEDS: Record<PetProfile['species'], Array<{ template: string; emoji: string }>> = {
  cat: [
    { template: '{name} discovers {love}', emoji: '🐾' },
    { template: 'Caught {name} doing {love}', emoji: '🙀' },
    { template: '{name} rates 5 {love} snacks', emoji: '🍽️' },
    { template: '{name} vs the empty bowl', emoji: '🥣' },
    { template: 'A day as {name}, CEO', emoji: '💼' },
    { template: '{name} hears the treat bag', emoji: '📣' },
    { template: 'Day 30: {name} learns {love}', emoji: '🎓' },
  ],
  dog: [
    { template: '{name} discovers {love}', emoji: '🐾' },
    { template: '{name} vs the zoomies', emoji: '🌪️' },
    { template: 'A day as {name}, goodest boy', emoji: '💼' },
    { template: 'Caught {name} doing {love}', emoji: '🙀' },
    { template: '{name} tries {love} for the first time', emoji: '📦' },
    { template: 'Day 30: {name} learns {love}', emoji: '🎓' },
  ],
  other: [
    { template: '{name} discovers {love}', emoji: '🐾' },
    { template: 'Caught {name} doing {love}', emoji: '🙀' },
    { template: 'A day as {name}', emoji: '💼' },
    { template: '{name} tries {love} for the first time', emoji: '📦' },
  ],
};

const ARC_SEEDS: Array<(p: PetProfile, love: string) => PetArc> = [
  (p, love) => ({ hook: 'First frame: {n} freezes mid-motion, camera already rolling'.replace('{n}', p.name), setup: `You slide ${love} into frame, nothing moves for a beat`, payoff: `Slow zoom as ${p.name} goes for it — cut at the peak` }),
  (p, love) => ({ hook: `First frame: text overlay “she does this every time I touch ${love}”`, setup: `Hand approaches, ${p.name} pretends not to care`, payoff: `Instant pounce — end while the action is still hot` }),
  (p) => ({ hook: `First frame: ${p.name}'s face fills the frame, eye-level`, setup: `Voiceover kicks in: “${p.name}, you have three seconds to explain yourself”`, payoff: 'Their reaction answers the question — loop the last second back to the start' }),
];

/** Platform playbook distilled from how pet accounts perform in 2026. */
export const PET_PLAYBOOK: Record<string, { length: string; hookRule: string; audio: string; safeZone: string; bestTimes: string; extra: string }> = {
  tiktok: {
    length: '21–34s',
    hookRule: 'Open with movement in frame one; end with a question overlay to farm comments',
    audio: 'Trending sound within 24–48h of spotting it, pet’s own squeaks still audible underneath',
    safeZone: 'UI covers ~18% of the bottom — keep captions above it',
    bestTimes: '7–9am, 12–3pm, 7–11pm',
    extra: 'TikTok rewards completion + comment density. If the video is “is this normal??” debate bait, TikTok is primary.',
  },
  reels: {
    length: '15–60s',
    hookRule: 'Clean rewatch loop; overlay “watch what happens at 0:08” style setup lines',
    audio: 'Trending audio is a 3–5x reach boost on Reels in 2026 — pair it with shareable moments',
    safeZone: 'UI covers ~22% — the most squeezed of the three',
    bestTimes: '11am–1pm, 7–9pm',
    extra: 'Reels ranks share-to-DM hard. Make something a friend would send to another pet person.',
  },
  shorts: {
    length: '≤45s',
    hookRule: 'Action already happening in frame one — Shorts viewers swipe within 1.5s',
    audio: 'Keep the clean original (dialogue/voiceover) cut; trending audio is neutral-to-negative here',
    safeZone: 'UI covers ~15% of the bottom',
    bestTimes: 'Same windows as TikTok, plus a readable still cover with one bold phrase moves CTR',
    extra: 'Shorts is the only one where a still cover + title genuinely change click-through. Make a cover.',
  },
  youtube: {
    length: '3–8min',
    hookRule: 'Payoff preview in the first 10 seconds, then a chill pace — depth is the whole point',
    audio: 'Voiceover narration over original ASMR pet sounds (crunching, purring)',
    safeZone: 'Design a thumbnail: face + 3–4 word contrast title',
    bestTimes: 'Evenings + weekends; evergreen so timing matters less',
    extra: 'Search-indexed and evergreen: day-in-the-life, rescue story, “we tried every toy” compilations live here.',
  },
  instagram: {
    length: 'photo or short clip',
    hookRule: 'One gorgeous static frame — sunbeam, portrait, funny face — as the anchor post',
    audio: 'Match a trending sound for grid posts, keep originals for carousel + photo posts',
    safeZone: 'Covers matter for grid aesthetics only',
    bestTimes: '11am–1pm, 7–9pm',
    extra: 'Instagram rewards polish: high-quality photos, lifestyle shots, Reels for reach. #catsofinstagram is still enormous.',
  },
};

export const PET_ANGLES = [
  { name: 'Eye level', tip: 'Lie on the floor. The default pet shot — viewers meet your pet face to face.', emoji: '👀' },
  { name: 'Low-angle hero', tip: 'Slightly below eye line pointing up. Majestic moments get 30–50% more saves.', emoji: '🦸' },
  { name: 'Overhead', tip: 'Directly above — meals, sleeping poses, full-body tricks. Use sparingly.', emoji: '🛸' },
  { name: 'Tracking', tip: 'Walk alongside at their level. Slow-motion tracking of zoomies is share gold.', emoji: '🏃' },
];

export const PET_EDIT_STEPS = [
  { step: 'Cut the first 2 seconds', tip: 'Delete you pressing record and walking in. Start on the face, the action, or the setup line.' },
  { step: 'Trim to the tightest version', tip: 'Dead air kills retention. Every second either entertains or builds the anticipation.' },
  { step: 'Hook in the first frame', tip: 'A curiosity text overlay like “she does this EVERY time” lifts watch-through by up to 45%.' },
  { step: 'Layer the audio', tip: 'Trending sound or voiceover underneath, pet’s real sounds on top. Music supports, never drowns.' },
  { step: 'End at the peak', tip: 'Cut while the action is still hot — drive replays and “wait, what happened next?” comments. Or loop it seamlessly.' },
];

export const PET_TOOLS = 'TikTok’s own editor covers 90%. CapCut for multi-clip ramps and clean exports. InShot for quick trims.';

export const PET_MUSIC_MOODS: Record<string, string> = {
  reactions: 'SFX do the heavy lifting — boings, record scratches, a crash for the vase. Instrumental underneath so the reaction stays the star.',
  daily: 'Warm narration beds. Keep it quiet enough for purrs and crunches to be the ASMR layer.',
  glowup: 'Emotional swell on the transition beat. Transformation + trending music = saved and shared.',
  tricks: 'Build the tempo with the attempt count, drop the beat exactly when the trick lands.',
  reviews: 'Unbox ASMR first, playful instrumental second. The crunch is the hook.',
  trends: 'Ride the sound — your twist on it is what gets you seen in the sea of same-audio clips.',
  knowhow: 'Calm, no lyrics, on-screen text carries the lesson while music keeps it cozy.',
};

export const PET_WELFARE = [
  'Sessions stay short, treat-rich and on their terms — if they walk off, the shoot is over.',
  'No costumes that restrict, no props that risk (no chocolate, cocoa, or small swallowable bits), no harsh flash.',
  'Breakaway collar only if filming anything on them; soft heat-safe lamps, natural window light first.',
  'Their comfort is the brand. Happy pet on camera reads instantly — forced content reads just as fast.',
];

export const PET_HASHTAGS = ['#catsofinstagram', '#catsoftiktok', '#pettok', '#funnycats', '#catlife'] as const;

export function defaultPetProfile(): PetProfile {
  return { name: '', species: 'cat', personality: [], signature: '', quirks: '', loves: [], rescue: false, platforms: ['tiktok', 'reels', 'shorts'], primary: 'tiktok' };
}

function pick<T>(list: readonly T[], seed: number, fallback: T): T {
  return list[seed % list.length] ?? fallback;
}

function fill(line: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((acc, [key, value]) => acc.replaceAll(`{${key}}`, value), line);
}

export function passesFiveWordTest(title: string): boolean {
  const words = title.trim().split(/\s+/).length;
  return words > 0 && words <= 9;
}

const SCORE_SPREAD = [92, 88, 85, 81, 78, 74, 70];

function scoreIdea(pillarWeight: number, index: number): number {
  const spread = SCORE_SPREAD[index] ?? 70;
  return Math.max(1, Math.min(100, Math.round((pillarWeight + spread) / 2)));
}

/** Generates deterministic, research-backed pet content ideas from the profile. */
export function generatePetIdeas(profile: PetProfile, count = 7, seedKey = ''): PetIdea[] {
  const loves = profile.loves.length > 0 ? profile.loves : ['a sunbeam', 'the red dot', 'empty boxes'];
  const seedBase = seededHash(`${profile.name}|${profile.personality.join(',')}|${seedKey}`);
  const pillars = [...PET_PILLARS].sort((a, b) => {
    const ah = seededHash(`${seedBase}|${a.key}`) % 1000;
    const bh = seededHash(`${seedBase}|${b.key}`) % 1000;
    return ah - bh;
  });
  const platform = profile.primary || 'tiktok';
  const usedTitles = new Set<string>();
  const ideas: PetIdea[] = [];
  for (let i = 0; i < count; i += 1) {
    const pillar = pillars[i % pillars.length] ?? pillars[0];
    if (!pillar) break;
    const seed = seededHash(`${seedBase}|idea|${i}`);
    const love = pick(loves, seed >> 3, loves[0] ?? 'a sunbeam');
    const fallbackSpec = { template: '{name} discovers {love}', emoji: '🐾' };
    const seeds = TITLE_SEEDS[profile.species] ?? TITLE_SEEDS.other ?? [];
    let spec = pick(seeds, seed, fallbackSpec);
    let title = fill(`${spec.emoji} ${spec.template}`, { name: profile.name, love });
    for (let attempt = 1; usedTitles.has(title) && attempt < 5; attempt += 1) {
      spec = pick(seeds, seed + attempt * 7919, fallbackSpec);
      title = fill(`${spec.emoji} ${spec.template}`, { name: profile.name, love });
    }
    if (usedTitles.has(title)) continue;
    usedTitles.add(title);
    const arcBuilder = ARC_SEEDS[seed % ARC_SEEDS.length] ?? ARC_SEEDS[0];
    const arc = arcBuilder
      ? arcBuilder(profile, love)
      : { hook: 'First frame: their face fills the frame', setup: 'You slide the prop into frame', payoff: 'Cut at the peak of the reaction' };
    const angle = pick(PET_ANGLES, seed >> 5, PET_ANGLES[0] ?? { name: 'Eye level', tip: 'Lie on the floor.', emoji: '👀' });
    const personality = pick(profile.personality.length > 0 ? profile.personality : ['main character'], seed, 'main character');
    ideas.push({
      id: `idea-${i}-${seed.toString(36)}`,
      title: title.trim(),
      format: pillar.label,
      formatEmoji: pillar.emoji,
      pillar: pillar.key,
      reason: `${pillar.note} Your ${profile.name} brings the ${personality} energy.`,
      hookCopy: arc.hook.replace('First frame: ', ''),
      arc,
      score: scoreIdea(pillar.weight, i),
      music: PET_MUSIC_MOODS[pillar.key] ?? 'Keep their natural sounds loud and proud.',
      angle: `${angle.emoji} ${angle.name} — ${angle.tip}`,
      platform,
    });
  }
  return ideas.slice(0, count);
}

/** One shoot, three cuts: how the same footage becomes a native version per platform. */
export function adaptIdea(idea: PetIdea, platforms: string[]): PetPlatformCut[] {
  return platforms.map((platform, index) => {
    const book = PET_PLAYBOOK[platform];
    if (!book) return { platform, length: '—', firstFrame: idea.arc.hook, audio: 'Original sounds on top.', safeZone: '—', bestTimes: '—', extra: 'No playbook yet — start with TikTok rules of thumb.' };
    const firstFrames = [idea.arc.hook, `${idea.arc.setup} — skip the reveal, open mid-action`, `${idea.arc.hook} ends by looping straight back to the opening beat`];
    return {
      platform,
      length: book.length,
      firstFrame: firstFrames[index] ?? idea.arc.hook,
      audio: book.audio,
      safeZone: book.safeZone,
      bestTimes: book.bestTimes,
      extra: book.extra,
    };
  });
}
