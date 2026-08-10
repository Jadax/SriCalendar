export interface SceneFormula { title: string; opening: string; escalation: string; payoff: string; broll: string[] }

const GENERIC_BROLL = ['Golden-hour close-up details', 'Hands-at-work inserts', 'Slow push-in on the product', 'Timelapse of the full process', 'Reflection / mirror shot', 'Empty-set establishing wide', 'Cut-to-face reaction', 'Textured texture macro', 'Window-light silhouette', 'Transition: wipe through hands'];

export const SCENE_FORMULAS: Record<string, SceneFormula[]> = {
  General: [
    { title: 'The Ascent', opening: 'Establish the low point with a moody wide shot', escalation: 'Add three rising obstacles, each bigger than the last', payoff: 'Resolve with a sweeping golden-hour hero shot', broll: GENERIC_BROLL.slice(0, 5) },
    { title: 'The Reveal', opening: 'Tease the outcome with a blurred or shadowed object', escalation: 'Build curiosity through closer framing each cut', payoff: 'Snap to full clarity with a punch-in and audio spike', broll: GENERIC_BROLL.slice(2, 7) },
    { title: 'The Contrast', opening: '"Before" with flat, desaturated grade', escalation: 'Mid shifts show small wins desaturated-to-warm', payoff: '"After" in full saturated color + celebratory music', broll: GENERIC_BROLL.slice(1, 6) },
    { title: 'The Loop', opening: 'Start on a mid-action moment (time rewind hint)', escalation: 'Explain the setup in reverse chronology', payoff: 'Close the loop at the exact opening frame', broll: GENERIC_BROLL.slice(0, 8) },
    { title: 'The Countdown', opening: 'Show goal with a visible counter (day/task number)', escalation: 'Each break raises tension and the counter', payoff: 'Hit the final number with confetti-level payoff', broll: GENERIC_BROLL.slice(3, 9) },
    { title: 'The Test', opening: 'State the hypothesis on a chalkboard-style slate', escalation: 'Show failed attempts with comedic timing', payoff: 'Crown the winner with a freeze-frame + caption', broll: GENERIC_BROLL.slice(0, 6) },
  ],
  Beauty: [
    { title: 'Glow-Up Timelapse', opening: 'Bare-face macro of skin texture', escalation: 'Step-by-step product application close-ups', payoff: 'Final look reveal with ring-light bokeh', broll: ['Mascara wand macro', 'Bellows-style mirror reflection', 'Product lineup flat-lay', 'Bottle trio slow-mo'] },
    { title: 'The Fails Test', opening: 'Skeptical reaction shot', escalation: 'Attempts go increasingly wrong', payoff: 'The one method that actually works', broll: ['Swatch macro', 'Brush strokes', 'Blending cut', 'Before/after split'] },
    { title: 'GRWM Docu', opening: 'Morning-light setup pan', escalation: 'Tick through routine with rushed energy', payoff: 'Mirror self-check slow-mo reveal', broll: ['Coffee steam macro', 'Palette close-up', 'Desk clutter b-roll', 'Window light sweep'] },
  ],
  Tech: [
    { title: 'The Comparison Gauntlet', opening: 'Two devices side by side, both powered off', escalation: 'Benchmarks with gauges and overlays', payoff: 'Winner reveal with screen split', broll: ['Pcb macro', 'Cable close-up', 'Fan spin slow-mo', 'Benchmark chart insert'] },
    { title: 'The Repair', opening: 'Broken device dramatic angle', escalation: 'Each tool step layered with progress title cards', payoff: 'Power-on moment after fix', broll: ['Screwdriver macro', 'Board under light', 'Thermal cam insert', 'Final boot sequence'] },
    { title: 'The Downsizing', opening: 'Cable spaghetti desktop shot', escalation: 'Remove components one by one', payoff: 'Clean minimal desk final sweep', broll: ['Zip-tie close-up', 'Tidy desk pan', 'Cable routing inserts', 'After establishing wide'] },
  ],
  Food: [
    { title: 'The Sizzle Skillet', opening: 'Oil drop in slow motion at pan', escalation: 'Ingredients added with cutting sounds synced', payoff: 'Final plated dish hero shot', broll: ['Chopping macro', 'Steam rising', 'Cheese pull', 'Sauce drizzle'] },
    { title: 'The 3-Method Duel', opening: 'Three stations prepped', escalation: 'Cut between methods with a mini timer', payoff: 'Taste-test reaction rankings', broll: ['Ingredients flat-lay', 'Oven door steam', 'Kneading close-up', 'Tasting macro'] },
    { title: 'The Pantry Rescue', opening: 'Bare fridge wide shot', escalation: 'Improvise with odd pairings', payoff: 'Surprising finished meal reveal', broll: ['Fridge shelf pan', 'Spice jar macro', 'Pan flip slow-mo', 'Final plate top-down'] },
  ],
  Fitness: [
    { title: 'The Transformation Timeline', opening: 'Day-1 flat mirror shot', escalation: 'Weekly progress clips with date stamps', payoff: 'Final physique/energy reveal', broll: ['Weights macro', 'Sweat detail', 'Jump rope slow-mo', 'Gym establishing'] },
    { title: 'The Correct Form Fix', opening: 'Dramatic wrong-form freeze', escalation: 'Break down joint angles with overlays', payoff: 'Clean rep demonstration', broll: ['Form comparison split', 'Joint overlay insert', 'Rep slow-mo', 'Fade to correct setup'] },
    { title: 'The 60-Second Killer', opening: 'Timer slam on-screen', escalation: 'Fast circuit cuts between moves', payoff: 'Collapse-to-floor comedy + PR', broll: ['Watch macro', 'Kettlebell swing', 'Resting-breath macro', 'Celebration frame'] },
  ],
  Travel: [
    { title: 'The Hidden Gem Hunt', opening: 'Touristy chaos wide shot', escalation: 'Follow footprints away from the crowd', payoff: 'Secret viewpoint payoff reveal', broll: ['Map unfold insert', 'Footpath tracking shot', 'Local interaction', 'Golden light pan'] },
    { title: 'The Pack List', opening: 'Suitcase gaping open', escalation: 'Fast pack beats, item by item', payoff: 'Zipper close + boarding pass snap', broll: ['Fold macro', 'Passport insert', 'Backpack straps', 'Airport establishing'] },
    { title: 'The 48-Hours Race', opening: 'Clock starts at airport', escalation: 'Tick destinations with timestamps', payoff: 'Sunset finale montage', broll: ['Train window pan', 'Street food macro', 'Map pins insert', 'Night lights time-lapse'] },
  ],
  Gaming: [
    { title: 'The Impossible Run', opening: 'Final boss defeat screen from last time', escalation: 'Fail montage with increasing stakes', payoff: 'First-time clear emotional cut', broll: ['Controller macro', 'Screen mirror glint', 'Keyboard smash insert', 'Replay highlight'] },
    { title: 'The Tier List', opening: 'Shelf with all contenders', escalation: 'Each ranking beat with a context clip', payoff: 'Top-tier reveal with confetti grade', broll: ['Gameplay loop inserts', 'Score overlay', 'Reaction cams', 'Comparison split'] },
    { title: 'The Easter Egg Hunt', opening: 'Hipster claim "nobody found this"', escalation: 'Explorer-style search through levels', payoff: 'Hidden room discovery', broll: ['Glitch flash inserts', 'In-game detail close-ups', 'Map zoom', 'Discovery moment'] },
  ],
  Fashion: [
    { title: 'The Capsule Remix', opening: 'One small capsule wardrobe on rail', escalation: 'Style beats mixing 3 core pieces', payoff: 'Final 5-look street montage', broll: ['Fabric macro', 'Hanger pan', 'Layout flat-lay', 'Styling hands inserts'] },
    { title: 'The Thrift Score', opening: 'Empty rack wide shot', escalation: 'Sifting, trying, vetoing comedy beats', payoff: 'Fitting-room glow-up reveal', broll: ['Price tag macro', 'Try-on mirror cut', 'Coat hanger close-up', 'Streetwear final shot'] },
    { title: 'The One-Bag Challenge', opening: 'Tiny bag next to packed suitcase', escalation: 'Roll, tetris, cram attempts', payoff: 'Perfectly packed reveal + on-trip clip', broll: ['Rolling macro', 'Bag interior pan', 'Zipper close-up', 'On-street final'] },
  ],
};

export const NICHES = Object.keys(SCENE_FORMULAS);

/** Builds a fresh cinematic scene proposal by blending a formula with optional user context. */
export function generateScene(niche: string, topic: string): SceneFormula {
  const list: SceneFormula[] = (SCENE_FORMULAS[niche] ?? SCENE_FORMULAS.General)!;
  const fallback: SceneFormula = { title: 'Open Loop', opening: 'Start mid-action on the most surprising moment', escalation: 'Build three rising beats with changing framing', payoff: 'Close the loop on the opening frame', broll: GENERIC_BROLL };
  const formula: SceneFormula = list[Math.floor(Math.random() * list.length)] ?? fallback;
  const roll = (source: readonly string[]): string => source[Math.floor(Math.random() * source.length)] ?? 'extra footage';
  const extra: string = roll(GENERIC_BROLL);
  return {
    title: formula.title,
    opening: `${formula.opening} ("${topic}" teaser)`,
    escalation: formula.escalation,
    payoff: formula.payoff,
    broll: [...formula.broll, extra],
  };
}