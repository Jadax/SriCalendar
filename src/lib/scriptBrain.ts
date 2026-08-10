import { CAPTION_TEMPLATES, CTA_TEMPLATES, HOOK_CATEGORIES, HOOK_CATEGORY_META, HOOK_TEMPLATES, SCRIPT_STRUCTURES } from '../data/hookTemplates';
import { PLATFORMS } from '../data/options';
import type { HookItem, Script } from '../types/ugc';

export interface BrainContext {
  niche: string;
  topic: string;
  platform: string;
  content: string;
}

export interface HookPick {
  text: string;
  category: string;
  score: number;
  reason: string;
}

export interface BrainResult {
  hooks: HookPick[];
  caption: string;
  cta: string;
  structure: { name: string; body: string };
  editingNotes: string[];
  titles: string[];
  tags: string[];
  description: string;
}

/** Archetype affinity per platform: which hook style wins headlines on each feed. */
const PLATFORM_ARCHETYPES: Record<string, string[]> = {
  tiktok: ['Curiosity', 'Rebel', 'Tension'],
  instagram: ['Empathy', 'Action', 'Mystery'],
  reels: ['Empathy', 'Curiosity', 'Action'],
  youtube: ['Mastery', 'Reward', 'Narrative'],
  shorts: ['Action', 'Curiosity', 'Rebel'],
  linkedin: ['Reward', 'Proof', 'Mastery'],
  pinterest: ['Reward', 'Empathy', 'Relevance'],
  x: ['Rebel', 'Contrast', 'Proof'],
  newsletter: ['Curiosity', 'Narrative', 'Reward'],
  podcast: ['Narrative', 'Mastery', 'Relevance'],
};

const ARCHETYPE_CATEGORIES: Record<string, string[]> = {
  Curiosity: ['Question', 'Curiosity Gap'],
  Reward: ['Big Promise', 'Authority & How-to'],
  Proof: ['Stat & Number', 'Authority & How-to'],
  Contrast: ['Myth-Bust', 'Contrarian'],
  Rebel: ['Contrarian', 'Myth-Bust'],
  Narrative: ['Story', 'Relatable'],
  Mystery: ['Curiosity Gap', 'Story'],
  Tension: ['Danger & Stakes', 'Story'],
  Empathy: ['Relatable', 'Story'],
  Mastery: ['Authority & How-to', 'Big Promise'],
  Action: ['Challenge', 'Big Promise'],
  Relevance: ['Trend & Culture', 'Question'],
};

/** Expands {token} placeholders using an intelligent, human-sounding default bank. */
function smartFill(text: string, ctx: BrainContext): string {
  const lower = `${ctx.niche} ${ctx.topic}`.toLowerCase();
  const kw = lower.split(/\s+/).filter((w) => w.length > 3).slice(0, 3);
  const topicKw = kw[0] ?? ctx.topic;
  const nicheKw = ctx.niche || ctx.topic;
  const defaults: Record<string, string> = {
    topic: ctx.topic || topicKw, niche: ctx.niche || ctx.topic,
    n: '30', number: '8', days: '30', time: 'a weekend', amount: '$100', step: 'one tiny step',
    metric: 'watch time', thing: nicheKw, technique: 'technique', format: 'short video', result: 'the result',
    tool: 'free tool', free: 'free', price: '$50/mo', guide: 'guide', minutes: '3', outcome: 'growth',
    tiny: 'small', resource: 'a phone camera', unexpected: 'something clicked', event: 'small win',
    word: 'SOUND OFF', platform: 'the algorithm', week: 'this week', month: 'this month',
    trend: 'that trend', audio: 'this audio', viral: 'viral moment', moment: 'moment',
    community: 'your community', hours: '24', seconds: '3', year: 'year', deliverable: 'editorial',
    workflow: 'workflow', process: 'process', framework: 'framework', expert: 'pro', role: 'creator',
    challenge: 'challenge', method: 'method', total: '30', action: 'start', trick: 'trick',
    secret: 'secret', sneaky: 'small', detail: 'detail', setting: 'mode', feature: 'feature',
    warning: 'warning', clause: 'clause', famous: 'successful', creator: 'creator', normal: 'everyday',
    example: 'video', session: 'shoot', score: 'score', saturation: 'saturation', feed: 'feeds',
    tip: 'tip', rule: 'rule', project: 'your audience', frequency: 'every week', nacho: 'start',
    secrets: 'secrets', soc: 'content', 'common mistake': 'common mistake', 'relatable scenario': 'you looked great on paper',
    'shocking claim': 'shocking claim', 'popular assumption': 'everyone thinks it works',
    approach: 'this approach', timeframe: 'a week', 'simple habit': 'simple habit', 'starting point': 'zero',
    'dream outcome': 'the result you want', system: 'system', smallest: 'smallest', biggest: 'biggest',
    'popular myth': 'the popular myth', 'expensive thing': 'expensive gear', 'popular strategy': 'the popular strategy',
    'small event': 'small email', 'small comment': 'small comment', 'famous creator': 'a famous creator',
    'viral example': 'that viral post', 'legal/brand': 'legal', subtle: 'subtle', 'small action': 'small action',
    'sneaky detail': 'tiny detail', lonel_y: 'lonely', 'relatable frustration': 'the frustration', emotion: 'that feeling', clip: 'clip',
    routine: 'routine', 'ridiculous method': 'ridiculous method', 'old trend': 'old trend', 'new trend': 'new trend',
    'viral moment': 'viral moment', 'hard thing': 'hard thing', objection: 'it feels too hard',
    'expert role': 'professional', steps: '3', outcome2: 'outcome',
  };
  return text.replace(/\{([a-zA-Z_ ]+)\}/g, (_all, key: string) => defaults[key] ?? 'that thing');
}

/** Scores every hook, mixing platform archetype fit, topic relevance and your proven winners. */
export function pickHooks(ctx: BrainContext, myHooks: HookItem[], count = 3): HookPick[] {
  const platform = PLATFORMS.includes(ctx.platform as never) ? ctx.platform : 'tiktok';
  const archetypes = (PLATFORM_ARCHETYPES[platform] ?? PLATFORM_ARCHETYPES.tiktok)!;
  const favored = new Set(archetypes.flatMap((a) => ARCHETYPE_CATEGORIES[a] ?? []));
  const winningCategories = new Set(myHooks.filter((h) => h.status === 'winning').map((h) => (h.niche ?? '').toLowerCase()).filter(Boolean));
  const myText = myHooks.map((h) => h.content.toLowerCase()).filter(Boolean);

  const picks = HOOK_TEMPLATES.map((h, i) => {
    const filled = smartFill(h.text, ctx);
    const lower = filled.toLowerCase();
    let score = 0;
    // 1. Platform archetype fit (biggest signal for short-form)
    score += favored.has(h.category) ? 40 : 20;
    // 2. First-word strength (hooks that open with a payoff/word land better)
    if (/^(what|why|how|don't|stop|i |nobody|every|this|the exact|pov|a |one |1 )/i.test(filled)) score += 12;
    // 3. Topic relevance
    const tokens = ctx.topic.split(/\s+/).filter((w) => w.length > 3).map((w) => w.toLowerCase());
    if (tokens.some((t) => lower.includes(t))) score += 20;
    // 4. Your proven winner category boost
    if (winningCategories.has(ctx.niche.toLowerCase())) score += 4;
    // 5. Small determinism so the same script stays stable
    score += (i % 3);
    return { text: filled, category: h.category, score, reason: pickReason(h.category), i };
  });

  picks.sort((a, b) => b.score - a.score);
  return picks.slice(0, 40).sort(() => 0) /* stable-ish */ .slice(0, count).map(({ text, category, score, reason }) => ({ text, category, score, reason }));
}

function pickReason(category: string): string {
  const meta = HOOK_CATEGORY_META[category as keyof typeof HOOK_CATEGORY_META];
  return meta ? `${meta.archetype}: ${meta.hint}` : 'Strong retention pattern for your feed.';
}

/** Assembles the full co-pilot package for a script. */
export function buildBrain(ctx: BrainContext, myHooks: HookItem[]): BrainResult {
  const platform = PLATFORMS.includes(ctx.platform as never) ? ctx.platform : 'tiktok';
  const hooks = pickHooks(ctx, myHooks, 3);
  const topic = ctx.topic || ctx.niche || 'your topic';
  const niche = ctx.niche || null;

  const caption = smartFill(pickCaption(topic, niche, platform), ctx);
  const cta = smartFill(pickCta(topic, niche, platform), ctx);
  const structure = SCRIPT_STRUCTURES[Math.floor(seededHash(`${platform}${ctx.niche}`) % SCRIPT_STRUCTURES.length)]!;

  const titles = buildTitles(topic, niche, platform, hooks[0]?.text);
  const tags = buildTags(topic, niche, platform);
  const description = buildDescription(topic, niche, platform, hooks[0]?.text);
  const editingNotes = buildEditingNotes(platform, ctx.content);

  return { hooks, caption, cta, structure, titles, tags, description, editingNotes };
}

function seededHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) { h = (h << 5) - h + input.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

const NICHE_CAPTIONS: Record<string, string[]> = {
  beauty: ['The {niche} version of {topic}. Save this for your next getting-ready sesh 💅', 'Ran this {topic} myself so you don\u2019t have to. Which one are you guilty of? 👇'],
  tech: ['The {topic} breakdown, minus the jargon. Save it for your next upgrade. 🔧', 'I tested the reasoning behind {topic} so you can skip the guesswork.'],
  fitness: ['Your next {topic} starts here. Save the set, drop a 🔥 if you\u2019re in.', 'Nobody talks about this part of {topic}. Let\u2019s fix that in 60 seconds.'],
  food: ['{topic} in minutes, zero stress. Save this one for dinner tonight 🍳', 'The {topic} shortcut your takeout habit keeps hidden from you.'],
  fashion: ['{topic} done right. Save this before your next order 👗', 'Three ways to nail {topic} without buying anything new.'],
  travel: ['Your {topic} bucket list just got easier. Pin this for the next trip ✈️', 'The honest {topic} guide nobody at the airport will tell you.'],
  gaming: ['{topic} but make it quick. Watch till the end for the payoff 🎮', 'The {topic} clip that broke my lobbies. Let me know if you\u2019ve done it.'],
};

function pickCaption(topic: string, niche: string | null, _platform: string): string {
  const list = niche ? (NICHE_CAPTIONS[niche.toLowerCase()] ?? CAPTION_TEMPLATES) : CAPTION_TEMPLATES;
  return list[Math.floor(seededHash(`${topic}cap`) % list.length)]!;
}

function pickCta(topic: string, niche: string | null, _platform: string): string {
  if (niche) {
    const nicheCta: Record<string, string> = {
      beauty: 'Follow for more {niche} tips, and save this for your next routine.',
      tech: 'Save this and follow for the honest {niche} takes.',
      fitness: 'Follow for more {niche} wins, and tag someone who needs this.',
      food: 'Save this recipe and follow for easy {niche} dinners.',
      fashion: 'Follow for more {niche} inspo, and tag your go-to style twin.',
      travel: 'Save this for your next trip and follow for {niche} hacks.',
      gaming: 'Follow for more {niche} plays and comment your best clip.',
    };
    return nicheCta[niche.toLowerCase()] ?? `Follow for more ${niche} tips.`;
  }
  return CTA_TEMPLATES[Math.floor(seededHash(`${topic}cta`) % CTA_TEMPLATES.length)]!;
}

const NICHE_NOW: Record<string, string> = {
  beauty: 'clean-girl makeup',
  tech: 'the budget tech',
  fitness: 'quick home workouts',
  food: 'fast weeknight dinners',
  fashion: 'capsule wardrobes',
  travel: 'hidden-gem travel',
  gaming: 'that indie game',
  parenting: 'sane parenting',
  finance: 'side hustles',
};

function titleKw(niche: string): string {
  return NICHE_NOW[niche.toLowerCase()] ?? niche;
}

function buildTitles(topic: string, niche: string | null, platform: string, hook?: string): string[] {
  const kw = titleKw(niche ?? '');
  const base = topic.trim();
  const list: string[] = [];
  list.push(`the ${kw} secret nobody shares (${base})`);
  list.push(`stop overthinking ${base.toLowerCase()}`);
  list.push(`${base.toLowerCase()} — done the honest way`);
  list.push(`why ${base.toLowerCase()} keeps failing (and the fix)`);
  if (hook) list.push(`what nobody tells you about ${base.toLowerCase()}`);
  return [...new Set(list.filter(Boolean))].slice(0, 4);
}

function titleWord(topic: string): string {
  const words = topic.trim().split(/\s+/).filter(Boolean);
  return words.length > 3 ? '3' : words.length > 0 ? '1' : 'the';
}

function buildTags(topic: string, niche: string | null, platform: string): string[] {
  const nicheLower = (niche ?? '').toLowerCase();
  const nicheTags: Record<string, string[]> = {
    beauty: ['makeup', 'skincare', 'grwm', 'beautytok', 'makeuptutorial'],
    tech: ['tech', 'gadgets', 'techreview', 'techtok', 'unboxing'],
    fitness: ['fitness', 'workout', 'gym', 'fitnessmotivation', 'homeworkout'],
    food: ['food', 'cooking', 'recipe', 'foodtok', 'mealprep'],
    fashion: ['fashion', 'outfit', 'style', 'ootd', 'fashiontok'],
    travel: ['travel', 'traveltok', 'hiddengems', 'wanderlust', 'travelguide'],
    gaming: ['gaming', 'gamertok', 'indiegames', 'gamingclips', 'fyp'],
  };
  const base = nicheTags[nicheLower] ?? ['creator', 'ugc', nicheLower, 'tips'];
  const topicTag = topic.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).join('');
  const tags = [...base];
  if (topicTag) tags.unshift(topicTag, 'grow');
  tags.push('fyp', platform === 'youtube' ? 'shorts' : 'viral');
  return [...new Set(tags)].slice(0, 10);
}

function buildDescription(topic: string, niche: string | null, platform: string, hook?: string): string {
  const nicheText = niche?.toLowerCase();
  const nicheOpeners: Record<string, string> = {
    beauty: 'Saving you from another wasted trip to Sephora.',
    tech: 'The gear question everyone gets wrong.',
    fitness: 'You do not need a gym membership for this.',
    food: 'Dinner sorted in under 20 minutes.',
    fashion: 'Fewer, better pieces. That is the whole game.',
    travel: 'Skip the tourist traps on your next trip.',
    gaming: 'The run no one believes until they see it.',
  };
  const opener = (niche && nicheOpeners[niche]) || `This is ${topic} without the fluff.`;
  return `${opener}\n\n🎬 In this ${platform === 'youtube' ? 'video' : 'one'}:\n${hook ? `· ${hook}\n` : ''}· ${topic}\n\nSave this for later, and follow for more ${nicheText || 'creator'} content.`;
}

function buildEditingNotes(platform: string, content: string): string[] {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const notes: string[] = [];
  notes.push(`Cut every 4–6 seconds on ${platform === 'youtube' ? 'Shorts' : platform === 'newsletter' ? 'every paragraph' : 'short-form'}. Keep momentum in the first 3s.`);
  notes.push('Add on-beat captions (CapCut or Submagic) and keep them readable, never tiny.');
  notes.push('Loop the ending back to the opening frame to boost replays.');
  notes.push('Hold a muted/clean clip for a text-overlay moment at the hook.');
  if (words > 250) notes.push('Trim to under 60 seconds if this is a reel or TikTok. Shorter wins.');
  notes.push('Film your 2 best b-roll beats in horizontal too, in case you repurpose to YouTube.');
  return notes;
}
