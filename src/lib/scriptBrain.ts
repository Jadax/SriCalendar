import { CAPTION_TEMPLATES, CTA_TEMPLATES, HOOK_CATEGORIES, HOOK_CATEGORY_META, HOOK_TEMPLATES, SCRIPT_STRUCTURES } from '../data/hookTemplates';
import { NICHE_HASHTAGS } from '../data/creatorIntelligence';
import { PLATFORMS } from '../data/options';
import { generateCaptions } from './creatorBrain';
import type { HookItem } from '../types/ugc';

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

/* ---------------------------------------------------------------------------
 * 5-Beat UGC Script Generator — full spoken script from hook + topic
 * ------------------------------------------------------------------------- */

/** The 5-beat UGC script structure. */
export interface ScriptBeat {
  beat: string;
  timing: string;
  dialogue: string;
  visual: string;
  onScreen: string;
}

export interface FullScript {
  beats: ScriptBeat[];
  totalWords: number;
  estimatedSeconds: number;
  title: string;
  hook: string;
  caption: string;
  cta: string;
  hashtags: string[];
  editingNotes: string[];
}

/** Niche-specific beat modifiers — what to say in each beat. */
const NICHE_BEAT_GUIDES: Record<string, { problem: string; solution: string; proof: string; cta: string }> = {
  beauty: {
    problem: 'Name the specific skin/hair problem. "My foundation separated by noon" not "my skin was bad".',
    solution: 'Introduce the product as a friend explaining, not a salesperson. "So I found this..."',
    proof: 'Show the product on your face/hair. Zoom into the texture. Compare before/after.',
    cta: 'Follow for more {niche} tips and save this for your next routine.',
  },
  fitness: {
    problem: 'Name the specific fitness frustration. "I was stuck at the same weight for 3 months".',
    solution: 'Introduce the workout/supplement as a discovery. "Then I tried this..."',
    proof: 'Show yourself doing the exercise. Mention specific numbers: reps, weight, days.',
    cta: 'Follow for more {niche} wins. Tag someone who needs this.',
  },
  food: {
    problem: 'Name the daily dinner struggle. "It is 6pm and I have no idea what to cook".',
    solution: 'Introduce the recipe as a shortcut. "This 15-minute recipe changed my weeknights".',
    proof: 'Show the finished dish. Zoom into the texture. Take a bite on camera.',
    cta: 'Save this recipe and follow for easy {niche} dinners.',
  },
  fashion: {
    problem: 'Name the outfit frustration. "I stare at a full closet and have nothing to wear".',
    solution: 'Introduce the styling trick as a discovery. "Then I learned this one rule".',
    proof: 'Show the full outfit. Turn around. Show the details up close.',
    cta: 'Follow for more {niche} inspo. Tag your go-to style twin.',
  },
  tech: {
    problem: 'Name the tech frustration. "My phone dies at 3pm every single day".',
    solution: 'Introduce the tool/setting as a discovery. "This one setting changed everything".',
    proof: 'Screen-record the result. Show the before/after metrics.',
    cta: 'Save this and follow for honest {niche} takes.',
  },
  travel: {
    problem: 'Name the travel frustration. "I spent 6 hours planning a 2-day trip".',
    solution: 'Introduce the itinerary/hack as a shortcut. "This template does it in 5 minutes".',
    proof: 'Show the actual places. Name specific restaurants, streets, prices.',
    cta: 'Save this for your next trip and follow for {niche} hacks.',
  },
  parenting: {
    problem: 'Name the parenting moment. "The 3pm meltdown that happens every school day".',
    solution: 'Introduce the technique/product as a parent-to-parent tip. "A mum friend told me this".',
    proof: 'Show the result. "It worked in 20 seconds" — be specific about time.',
    cta: 'Follow for more {niche} tips and tag a parent who needs this.',
  },
  finance: {
    problem: 'Name the money frustration. "I earn decent money but have nothing at the end of the month".',
    solution: 'Introduce the budgeting hack as a discovery. "Then I set up this one transfer".',
    proof: 'Show the actual numbers on screen. "I saved R2,000 in 30 days".',
    cta: 'Save this and follow for more {niche} tips.',
  },
  gaming: {
    problem: 'Name the gaming frustration. "I keep losing the same fight over and over".',
    solution: 'Introduce the setting/strategy as a discovery. "This one change fixed it".',
    proof: 'Show the gameplay clip. Show the settings screen. Show the result.',
    cta: 'Follow for more {niche} plays and comment your best clip.',
  },
  lifestyle: {
    problem: 'Name the daily frustration. "My mornings are chaotic and I leave the house stressed".',
    solution: 'Introduce the routine/hack as a discovery. "This 10-minute reset changed my mornings".',
    proof: 'Show yourself doing the routine. Show the calm result.',
    cta: 'Follow for more {niche} tips and try this tomorrow morning.',
  },
};

const NICHE_HOOK_STARTERS: Record<string, string[]> = {
  beauty: [
    'If your {product} is not working, watch this.',
    'Stop using {product} like this. It is making your skin worse.',
    'The {ingredient} your dermatologist wishes you knew about.',
    'I tested {product} for 30 days. Here is the honest truth.',
    'Your skincare routine is missing this one step.',
  ],
  fitness: [
    'If you are not seeing results, this is why.',
    'I tried {workout} for 30 days. The results surprised me.',
    'The {exercise} mistake that is killing your gains.',
    'Stop doing {exercise} like this. Do this instead.',
    'This 10-minute workout replaced my 1-hour gym session.',
  ],
  food: [
    'If you are tired of the same dinner rotation, try this.',
    'This {recipe} takes 15 minutes and feeds 4 people.',
    'I stopped ordering takeout after learning this recipe.',
    'The {ingredient} hack that makes everything taste better.',
    'This is the easiest {dish} you will ever make.',
  ],
  fashion: [
    'If your outfits never look right, the problem is the fit.',
    'This {item} goes with everything in your closet.',
    'The styling rule that changed how I get dressed.',
    'Stop wearing {item} like this. Try this instead.',
    'This {item} looks expensive but costs under R{price}.',
  ],
  tech: [
    'If your {device} is slow, this one setting fixes it.',
    'This free {tool} does what paid ones charge for.',
    'The {setting} nobody changes. Fix this now.',
    'I replaced 5 apps with this one {tool}.',
    'Your {device} can do this. You just do not know it yet.',
  ],
  travel: [
    'If you are planning a trip, save this first.',
    'This {destination} itinerary costs under R{price} total.',
    'The {destination} hack nobody tells you at the airport.',
    'I found a spot that looks like {place} but costs nothing.',
    'Skip the tourist traps. Go here instead.',
  ],
  parenting: [
    'If your {child} does this, try this one sentence.',
    'The {age}-year-old hack that ended our bedtime battle.',
    'Stop fighting screen time. Try this instead.',
    'This one routine saved my sanity as a {parent_type}.',
    'The lunchbox trick that comes back empty every time.',
  ],
  finance: [
    'If you are broke at the end of the month, fix this one thing.',
    'I tracked my spending for 90 days. Here is what shocked me.',
    'The {habit} that saved me R{amount} in 30 days.',
    'Stop doing this with your {account}. It is losing you money.',
    'This {strategy} pays within 30 days of starting.',
  ],
  gaming: [
    'If you keep losing, this {setting} change fixes it.',
    'This {strategy} is why I climbed from {rank} to {rank2}.',
    'The {game} update that changed everything. Nobody noticed.',
    'Stop playing like this. Do this instead.',
    'This free {tool} gave me an unfair advantage.',
  ],
  lifestyle: [
    'If your mornings are chaotic, try this 10-minute reset.',
    'This routine changed how I start every day.',
    'The {habit} that stuck after I stopped overthinking it.',
    'If you feel stuck, start with this one tiny change.',
    'This is the honest version of a {day} routine.',
  ],
};

/** Generate a full 5-beat UGC script from a topic + niche. */
export function buildFullScript(ctx: BrainContext, myHooks: HookItem[]): FullScript {
  const platform = PLATFORMS.includes(ctx.platform as never) ? ctx.platform : 'tiktok';
  const niche = ctx.niche || 'lifestyle';
  const topic = ctx.topic || niche;
  const seed = seededHash(`${topic}${niche}${platform}`);

  // Pick hook from templates
  const nicheHooks = NICHE_HOOK_STARTERS[niche] ?? NICHE_HOOK_STARTERS.lifestyle!;
  const hookTemplate = nicheHooks[seed % nicheHooks.length]!;
  const hook = smartFill(hookTemplate, ctx);

  // Pick niche beat guide
  const guide = NICHE_BEAT_GUIDES[niche] ?? NICHE_BEAT_GUIDES.lifestyle!;

  const beats: ScriptBeat[] = [
    {
      beat: 'HOOK',
      timing: '0-3s',
      dialogue: hook,
      visual: 'Face to camera, mid-action or surprised expression. Cut within 1.3 seconds.',
      onScreen: hook,
    },
    {
      beat: 'PROBLEM',
      timing: '3-7s',
      dialogue: `${guide.problem.slice(0, 80)}`,
      visual: 'Close-up or b-roll of the problem. Relatable, not staged.',
      onScreen: 'the problem in 3 words',
    },
    {
      beat: 'SOLUTION',
      timing: '7-12s',
      dialogue: `So ${guide.solution.slice(0, 80)}`,
      visual: 'Product in hand or on screen. Show it naturally, not posed.',
      onScreen: productOnScreen(niche),
    },
    {
      beat: 'PROOF',
      timing: '12-20s',
      dialogue: guide.proof.slice(0, 100),
      visual: 'Before/after or live demo. Zoom into the result.',
      onScreen: 'the proof on screen',
    },
    {
      beat: 'CTA',
      timing: '25-30s',
      dialogue: guide.cta.replace('{niche}', niche),
      visual: 'Back to face, confident delivery. End on a smile or nod.',
      onScreen: 'Follow + Save',
    },
  ];

  const totalWords = beats.reduce((s, b) => s + b.dialogue.split(/\s+/).length, 0);
  const estimatedSeconds = Math.round((totalWords / 140) * 60);

  // Build hashtags
  const pool = NICHE_HASHTAGS[niche.toLowerCase()] ?? NICHE_HASHTAGS.lifestyle!;
  const platformTag = platform === 'tiktok' ? 'tiktok' : platform === 'instagram' || platform === 'reels' ? 'reels' : 'shorts';
  const hashtags = [...new Set([...pool, platformTag, 'ugc', 'creator'])].slice(0, 8);

  // Build caption
  const captionSet = generateCaptions({ title: topic, hook, promise: guide.solution.slice(0, 60), niche, platform });

  // Editing notes
  const editingNotes = [
    'Cut every 3-5 seconds. Never let a single shot hold longer than 5s.',
    'Add on-beat captions. Keep them readable, not tiny.',
    'Open with the most intense visual frame — pattern interrupt in 1.3 seconds.',
    'Loop the ending back to the opening frame to boost replays.',
    `Film for ${platform === 'youtube' ? 'YouTube' : 'TikTok/Reels'} — ${platform === 'youtube' ? '16:9 or 9:16' : '9:16 vertical'}.`,
    'Hold a clean clip at the start for text overlay.',
    niche === 'beauty' ? 'Film in natural light. Show product texture up close.' :
    niche === 'fitness' ? 'Film the exercise from 2 angles. Show form, not just effort.' :
    niche === 'food' ? 'Film the finished dish first. Zoom into steam, texture, bite.' :
    niche === 'fashion' ? 'Film the full outfit, then the details. Show movement.' :
    niche === 'tech' ? 'Screen-record the demo. Show the settings, then the result.' :
    'Keep it natural. UGC works because it feels real, not polished.',
  ];

  return {
    beats,
    totalWords,
    estimatedSeconds,
    title: topic,
    hook,
    caption: captionSet.captions[0] ?? '',
    cta: captionSet.cta,
    hashtags,
    editingNotes,
  };
}

function productOnScreen(niche: string): string {
  const map: Record<string, string> = {
    beauty: 'Product name + close-up of texture/application',
    fitness: 'Exercise form + rep counter overlay',
    food: 'Ingredient laydown + timer overlay',
    fashion: 'Outfit mirror shot + price tags',
    tech: 'Screen recording + setting highlighted',
    travel: 'Location pin + cost overlay',
    parenting: 'Before/after moment + time stamp',
    finance: 'Number on screen + account balance',
    gaming: 'Gameplay clip + settings overlay',
    lifestyle: 'Routine shot + time stamp',
  };
  return map[niche] ?? 'Product on screen with text overlay';
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
