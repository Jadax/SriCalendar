import { generateText, isGeminiConfigured, type ResponseSchema } from './geminiClient';
import { buildBrain, type BrainContext, type BrainResult } from './scriptBrain';
import type { HookItem } from '../types/ugc';
import { HOOK_SCIENCE } from '../data/creatorIntelligence';

export { isGeminiConfigured } from './geminiClient';

const BRAIN_SCHEMA: ResponseSchema = {
  type: 'OBJECT',
  properties: {
    hooks: { type: 'ARRAY', items: { type: 'STRING' }, description: '3 strong opening hooks, each one sentence.' },
    hook_reasons: { type: 'ARRAY', items: { type: 'STRING' }, description: 'One short reason per hook.' },
    caption: { type: 'STRING', description: 'Ready-to-post caption under 200 characters.' },
    cta: { type: 'STRING' },
    structure: { type: 'STRING', description: 'Beat-by-beat video structure with rough timings.' },
    titles: { type: 'ARRAY', items: { type: 'STRING' }, description: '4 platform-ready video titles.' },
    tags: { type: 'ARRAY', items: { type: 'STRING' }, description: '8 lowercase hashtags without #.' },
    description: { type: 'STRING', description: '2-4 sentence post description ready to publish.' },
    editingNotes: { type: 'ARRAY', items: { type: 'STRING' }, description: '4-6 practical editing notes.' },
    best_time: { type: 'STRING', description: 'Best day + time to post, e.g. "Sunday 9am".' },
  },
  required: ['hooks', 'hook_reasons', 'caption', 'cta', 'structure', 'titles', 'tags', 'description', 'editingNotes', 'best_time'],
};

/**
 * Static persona + rules. Kept byte-identical across every call so Gemini's request
 * prefix is stable (good for implicit caching) and the user turn stays tiny.
 */
const COACH_SYSTEM = `You are a warm, brilliant UGC coach helping a creator (who is not technical and speaks like a real person) publish short-form video content.

Rules:
- Write like a real person talks. NO corporate words, NO "unlock the power", NO hype.
- Every hook must be 1 sentence, conversational, that stops the scroll in 1.3 seconds.
- Respect these proven findings: ${HOOK_SCIENCE.slice(0, 4).join(' ')}
- Match the tone to the platform (TikTok/Shorts = fast and casual, LinkedIn = still friendly but sharper).
- Never use em dashes in the copy you write.
- Give the single best posting time for the platform based on 2026 data.`;

function brainPrompt(ctx: BrainContext, winningHooks: string[]): string {
  const hooks = winningHooks.length ? `\n\nHooks this creator has already proven work (steal their energy, not their words):\n${winningHooks.map((h) => `- ${h}`).join('\n')}` : '';
  return `Content brief:
- Niche: ${ctx.niche || 'general'}
- Topic: ${ctx.topic}
- Target platform: ${ctx.platform}
- What the video shows/contains: ${ctx.content || 'not specified'}${hooks}`;
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
    const raw = await generateText(brainPrompt(ctx, winning), BRAIN_SCHEMA, signal, { system: COACH_SYSTEM, temperature: 0.9, maxOutputTokens: 1400 });
    return brainToResult(raw);
  } catch {
    return buildBrain(ctx, myHooks);
  }
}
