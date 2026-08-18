/**
 * Multi-provider script engine — orchestrates free LLM APIs for UGC script generation.
 * Gemini (already integrated) > Groq (fast) > OpenRouter (free) > Cerebras (bulk).
 * All use OpenAI-compatible chat completions format.
 */

export interface ScriptRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ScriptResponse {
  text: string;
  provider: string;
  model: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  rpm: number;
  enabled: boolean;
}

const STORAGE_KEY = 'script_providers';

export function getProviderConfigs(): ProviderConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ProviderConfig[];
  } catch { /* ignore */ }
  return DEFAULT_PROVIDERS;
}

export function saveProviderConfigs(configs: ProviderConfig[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

export function isAnyProviderConfigured(): boolean {
  return getProviderConfigs().some((c) => c.enabled && c.apiKey && !c.apiKey.startsWith('YOUR_'));
}

const DEFAULT_PROVIDERS: ProviderConfig[] = [
  { id: 'groq', name: 'Groq (free)', baseUrl: 'https://api.groq.com/openai/v1', apiKey: '', model: 'llama-3.3-70b-versatile', maxTokens: 2048, rpm: 10, enabled: true },
  { id: 'openrouter', name: 'OpenRouter (free)', baseUrl: 'https://openrouter.ai/api/v1', apiKey: '', model: 'openrouter/free', maxTokens: 2048, rpm: 5, enabled: true },
  { id: 'cerebras', name: 'Cerebras (free)', baseUrl: 'https://api.cerebras.ai/v1', apiKey: '', model: 'gpt-oss-120b', maxTokens: 2048, rpm: 10, enabled: true },
];

const buckets = new Map<string, { count: number; resetAt: number }>();

function canRequest(config: ProviderConfig): boolean {
  const now = Date.now();
  const b = buckets.get(config.id);
  if (!b || now > b.resetAt) { buckets.set(config.id, { count: 0, resetAt: now + 60_000 }); return true; }
  return b.count < Math.min(config.rpm, 5);
}

function recordRequest(config: ProviderConfig): void {
  const now = Date.now();
  const b = buckets.get(config.id);
  if (!b || now > b.resetAt) buckets.set(config.id, { count: 1, resetAt: now + 60_000 });
  else b.count++;
}

async function callProvider(config: ProviderConfig, req: ScriptRequest): Promise<ScriptResponse> {
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...(config.id === 'openrouter' ? { 'HTTP-Referer': 'https://sri-calendar.vercel.app', 'X-Title': 'SriCalendar' } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: req.systemPrompt },
        { role: 'user', content: req.userPrompt },
      ],
      max_tokens: req.maxTokens ?? config.maxTokens,
      temperature: req.temperature ?? 0.7,
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Provider ${config.id} returned ${res.status}`);
  const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = json.choices?.[0]?.message?.content;
  if (!text) throw new Error(`Empty response from ${config.id}`);
  return { text, provider: config.id, model: config.model };
}

/**
 * Generate text using the first available free LLM provider.
 * Falls through providers on failure, returns null if all fail.
 */
export async function generateWithProviders(req: ScriptRequest): Promise<ScriptResponse | null> {
  const configs = getProviderConfigs().filter((c) => c.enabled && c.apiKey && !c.apiKey.startsWith('YOUR_'));
  for (const config of configs) {
    if (!canRequest(config)) continue;
    try {
      recordRequest(config);
      return await callProvider(config, req);
    } catch { /* try next provider */ }
  }
  return null;
}

/** Build a UGC script generation system prompt. */
export function buildScriptSystemPrompt(niche: string, platform: string): string {
  return `You are a UGC short-form script strategist for ${niche} content on ${platform}.

Write in first person as a real person talking to a friend. Never sound like an ad.
Structure every script using this 5-beat framework:
1. HOOK (0-3s): Pattern-interrupt or specific pain callout. Spoken word-for-word.
2. PROBLEM (3-7s): The specific moment the pain shows up + the feeling.
3. SOLUTION (7-12s): What the product is, friend-explaining-to-friend language.
4. PROOF (12-20s): Show the product working, one specific evidence point.
5. CTA (25-30s): One action, one destination.

Rules:
- Never say "guys", "literally" (as filler), or "this product changed my life"
- Include specific numbers and specific negatives
- No marketing language: no "innovative", "next-generation", "obsessed"
- Each beat must sound spoken, not scripted
- Keep the total under 150 words for a 30-second video
- No em dashes`;
}
