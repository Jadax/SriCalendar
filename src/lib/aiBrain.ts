import { generateText, isGeminiConfigured, type ResponseSchema } from './geminiClient';
import { buildBrain, type BrainContext, type BrainResult } from './scriptBrain';
import type { HookItem } from '../types/ugc';
import { HOOK_SCIENCE } from '../data/creatorIntelligence';

export { isGeminiConfigured } from './geminiClient';

const BRAIN_SCHEMA: ResponseSchema = {
  type: 'OBJECT',
  properties: {
    hooks: { type: 'ARRAY', items: { type: 'STRING' }, description: '3 strong opening hooks, each one sentence, that would stop a scroll in the first 1.3 seconds.' },
    hook_reasons: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Why each hook works, one short sentence each, plain English.' },
    caption: { type: 'STRING', description: 'A ready-to-post caption under 200 characters with 2-3 line breaks.' },
    cta: { type: 'STRING', description: 'One short call-to-action encouraging a save, follow or comment.' },
    structure: { type: 'STRING', description: 'A beat-by-beat structure of the video (hook, 2-3 body beats, payoff, CTA) with rough timings.' },
    titles: { type: 'ARRAY', items: { type: 'STRING' }, description: '4 platform-ready video titles.' },
    tags: { type: 'ARRAY', items: { type: 'STRING' }, description: '8 relevant lowercase hashtags without the # symbol.' },
    description: { type: 'STRING', description: 'A 2-4 sentence post description ready to publish.' },
    editingNotes: { type: 'ARRAY', items: { type: 'STRING' }, description: '4-6 practical editing notes: cuts per second, captions, pacing, first-3-seconds.' },
    best_time: { type: 'STRING', description: 'One best day + time to post this on the target platform, e.g. "Sunday 9am".' },
  },
  required: ['hooks', 'hook_reasons', 'caption', 'cta', 'structure', 'titles', 'tags', 'description', 'editingNotes', 'best_time'],
};

function brainPrompt(ctx: BrainContext, winningHooks: string[]): string {
  const hooks = winningHooks.length ? `\n\nHooks this creator has already proven work (steal their energy, not their words):\n${winningHooks.map((h) => `- ${h}`).join('\n')}` : '';
  return `You are a warm, brilliant UGC coach helping a creator (who is not technical and speaks like a real person) publish short-form video content.

Content brief:
- Niche: ${ctx.niche || 'general'}
- Topic: ${ctx.topic}
- Target platform: ${ctx.platform}
- What the video shows/contains: ${ctx.content || 'not specified'}${hooks}

Rules:
- Write like a real person talks. NO corporate words, NO "unlock the power", NO hype.
- The hook must be 1 sentence, conversational, that stops the scroll in 1.3 seconds.
- Respect these proven findings: ${HOOK_SCIENCE.slice(0, 4).join(' ')}
- Match the tone to the platform (TikTok/Shorts = fast and casual, LinkedIn = still friendly but sharper).
- Never use em dashes in the copy you write.
- Give the single best posting time for this platform based on 2026 data.`;
}

function brainToResult(raw: string): BrainResult {
  const parsed = JSON.parse(raw) as {
    hooks?: string[]; hook_reasons?: string[]; caption?: string; cta?: string; structure?: string;
    titles?: string[]; tags?: string[]; description?: string; editingNotes?: string[]; best_time?: string;
  };
  const reasons = parsed.hook_reasons ?? [];
  const notes = [...(parsed.editingNotes ?? [])];
  if (parsed.best_time) notes.push(`Best time to post: ${parsed.best_time}.`);
  return {
    hooks: (parsed.hooks ?? []).map((text, i) => ({ text, category: 'AI', score: 100 - i, reason: reasons[i] ?? 'Strong retention pattern for your feed.' })),
    caption: parsed.caption ?? '',
    cta: parsed.cta ?? '',
    structure: { name: 'AI structure', body: parsed.structure ?? '' },
    titles: parsed.titles ?? [],
    tags: parsed.tags ?? [],
    description: parsed.description ?? '',
    editingNotes: notes,
  };
}

/**
 * The full co-pilot package: hooks, caption, structure, titles, tags, description and editing notes.
 * Uses Gemini when a key is configured; otherwise falls back to the proven offline brain.
 */
export async function buildBrainSmart(ctx: BrainContext, myHooks: HookItem[], signal?: AbortSignal): Promise<BrainResult> {
  if (!isGeminiConfigured) return buildBrain(ctx, myHooks);
  const winning = myHooks.filter((h) => h.status === 'winning').map((h) => h.content).slice(0, 5);
  try {
    const raw = await generateText(brainPrompt(ctx, winning), BRAIN_SCHEMA, signal);
    return brainToResult(raw);
  } catch {
    return buildBrain(ctx, myHooks);
  }
}
