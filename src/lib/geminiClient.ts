import type { VideoAnalysis } from '../types/video';

const API_KEY: string = import.meta.env.VITE_GEMINI_API_KEY ?? '';
/** Free-tier multimodal model — swap here if Google renames/retires it. */
const MODEL = 'gemini-2.0-flash';
const BASE = 'https://generativelanguage.googleapis.com';

export const isGeminiConfigured = Boolean(API_KEY);

export interface SchemaProperty {
  type: 'STRING' | 'NUMBER' | 'ARRAY' | 'OBJECT' | 'BOOLEAN';
  description?: string;
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
}
export interface ResponseSchema { type: 'OBJECT'; properties: Record<string, SchemaProperty>; required?: string[] }

/**
 * Per-call generation options. `system` carries the stable persona/rules text so the
 * request prefix stays identical between calls of the same type (best for implicit
 * prompt caching on Gemini's free tier); only the variable data goes in the user turn.
 */
export interface GenerateOptions {
  system?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/** One structured text-generation call against Gemini's free tier. */
export async function generateText(prompt: string, schema: ResponseSchema, signal?: AbortSignal, opts?: GenerateOptions): Promise<string> {
  if (!isGeminiConfigured) throw new Error('No Gemini API key configured. Add VITE_GEMINI_API_KEY to your .env file.');
  const res = await fetch(`${BASE}/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      ...(opts?.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: opts?.temperature ?? 0.8,
        maxOutputTokens: opts?.maxOutputTokens ?? 1024,
      },
    }),
  });
  if (!res.ok) throw new Error(await describeError(res));
  const generated = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = generated.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no response.');
  return text;
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING', description: 'A scroll-stopping, platform-ready video title under 90 characters.' },
    description: { type: 'STRING', description: 'A 2-4 sentence caption/description a creator could post as-is.' },
    hook: { type: 'STRING', description: 'The single best opening line to say in the first 2 seconds.' },
    hashtags: { type: 'ARRAY', items: { type: 'STRING' }, description: '5-8 relevant hashtags, no # symbol, lowercase.' },
    tags: { type: 'ARRAY', items: { type: 'STRING' }, description: '4-8 short topical keywords for search/SEO, no # symbol.' },
    suggested_pillar: { type: 'STRING', description: 'One or two words naming the content pillar/theme this video fits (e.g. Tutorial, Behind the scenes, Storytime).' },
    platform_fit: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Which platforms this clip suits best, from: tiktok, instagram, youtube, linkedin, pinterest, x, shorts, reels.' },
  },
  required: ['title', 'description', 'hook', 'hashtags', 'tags', 'suggested_pillar', 'platform_fit'],
};

const VIDEO_SYSTEM = `You are a social media growth strategist watching a creator's raw video clip.
Watch and listen to the full clip, then produce metadata that helps the creator publish it fast:
a catchy title, a ready-to-post description, the strongest possible opening hook line, hashtags,
SEO tags, the content pillar it belongs to, and which platforms it's best suited for.
Be specific to what actually happens/is said in the video, never generic placeholder text.
Write like a real person talks: no corporate words, no hype, no em dashes.`;

async function uploadVideo(blob: Blob, mimeType: string, displayName: string, signal?: AbortSignal): Promise<string> {
  const startRes = await fetch(`${BASE}/upload/v1beta/files?key=${API_KEY}`, {
    method: 'POST',
    signal,
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(blob.size),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: displayName } }),
  });
  if (!startRes.ok) throw new Error(await describeError(startRes));
  const uploadUrl = startRes.headers.get('x-goog-upload-url');
  if (!uploadUrl) throw new Error('Gemini did not return an upload URL. Check your API key and try again.');

  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    signal,
    headers: {
      'Content-Length': String(blob.size),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: blob,
  });
  if (!uploadRes.ok) throw new Error(await describeError(uploadRes));
  const uploaded = await uploadRes.json() as { file: { name: string; uri: string; state: string } };
  return uploaded.file.name;
}

async function waitUntilActive(fileName: string, signal?: AbortSignal): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const res = await fetch(`${BASE}/v1beta/${fileName}?key=${API_KEY}`, { signal });
    if (!res.ok) throw new Error(await describeError(res));
    const file = await res.json() as { uri: string; state: string; error?: { message: string } };
    if (file.state === 'ACTIVE') return file.uri;
    if (file.state === 'FAILED') throw new Error(file.error?.message ?? 'Gemini failed to process this video.');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error('Gemini took too long to process this clip. Try a shorter video.');
}

async function describeError(res: Response): Promise<string> {
  try {
    const body = await res.json() as { error?: { message?: string } };
    if (body.error?.message) return body.error.message;
  } catch { /* body wasn't JSON */ }
  if (res.status === 429) return 'Free-tier rate limit hit — wait a minute and try again.';
  if (res.status === 401 || res.status === 403) return 'Gemini rejected the API key. Check VITE_GEMINI_API_KEY.';
  return `Gemini request failed (${res.status}).`;
}

/** Uploads a clip to Gemini's free tier and returns AI-generated title/tags/description/hook. */
export async function analyzeVideo(blob: Blob, mimeType: string, displayName: string, signal?: AbortSignal): Promise<VideoAnalysis> {
  if (!isGeminiConfigured) throw new Error('No Gemini API key configured. Add VITE_GEMINI_API_KEY to your .env file.');

  const fileName = await uploadVideo(blob, mimeType, displayName, signal);
  try {
    const fileUri = await waitUntilActive(fileName, signal);
    const genRes = await fetch(`${BASE}/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: VIDEO_SYSTEM }] },
        contents: [{ role: 'user', parts: [{ file_data: { file_uri: fileUri, mime_type: mimeType } }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA, temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });
    if (!genRes.ok) throw new Error(await describeError(genRes));
    const generated = await genRes.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = generated.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini returned no analysis for this clip.');
    return JSON.parse(text) as VideoAnalysis;
  } finally {
    void fetch(`${BASE}/v1beta/${fileName}?key=${API_KEY}`, { method: 'DELETE' }).catch(() => undefined);
  }
}
