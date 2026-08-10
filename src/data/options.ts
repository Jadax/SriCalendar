export const PLATFORMS = ['tiktok', 'instagram', 'youtube', 'linkedin', 'pinterest', 'x', 'shorts', 'reels', 'newsletter', 'podcast'] as const;
export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const EFFORT_LEVELS = ['quick', 'medium', 'big'] as const;
export const IDEA_STATUSES = ['idea', 'scripted', 'scheduled', 'published', 'discarded'] as const;
export const SCRIPT_STATUSES = ['draft', 'ready', 'filming', 'published'] as const;
export const BOARD_COLUMNS = ['idea', 'scripting', 'preproduction', 'filming', 'editing', 'review', 'scheduled', 'published', 'repurposed'] as const;
export const DEAL_STATUSES = ['cold', 'contacted', 'negotiating', 'accepted', 'delivered', 'declined'] as const;
export const PAYMENT_STATUSES = ['pending', 'partial', 'paid'] as const;
export const INVOICE_STATUSES = ['draft', 'sent', 'overdue', 'paid'] as const;
export const GOAL_TYPES = ['audience', 'revenue', 'content', 'skill'] as const;
export const GOAL_STATUSES = ['active', 'at-risk', 'achieved', 'paused'] as const;
export const PERIODS = ['daily', 'weekly', 'monthly'] as const;
export const KNOWLEDGE_CATEGORIES = ['gear', 'software', 'presets', 'music', 'b-roll', 'links', 'templates', 'learning'] as const;
export const COLLAB_STATUSES = ['active', 'pending', 'done', 'declined'] as const;
export const RIGHTS_PERIODS = ['30-day organic', '90-day whitelisting + paid ads', '6 months full rights', '12 months full rights', 'perpetual'] as const;

export const PRIORITY_META: Record<string, { emoji: string; color: 'coral' | 'yellow' | 'lavender' | 'gray' }> = {
  urgent: { emoji: '🔥', color: 'coral' },
  high: { emoji: '⭐', color: 'coral' },
  medium: { emoji: '💫', color: 'yellow' },
  low: { emoji: '🌱', color: 'gray' },
};
export const EFFORT_META: Record<string, { emoji: string }> = {
  quick: { emoji: '⚡' },
  medium: { emoji: '🕒' },
  big: { emoji: '🏔️' },
};
export const PLATFORM_META: Record<string, { color: 'mint' | 'coral' | 'lavender' | 'peach' | 'sky' | 'yellow' | 'gray' }> = {
  tiktok: { color: 'coral' },
  instagram: { color: 'lavender' },
  youtube: { color: 'coral' },
  linkedin: { color: 'sky' },
  pinterest: { color: 'coral' },
  x: { color: 'gray' },
  shorts: { color: 'coral' },
  reels: { color: 'lavender' },
  newsletter: { color: 'mint' },
  podcast: { color: 'peach' },
};

/** Title-cases a stored value for display in dropdowns and pills without changing the stored key. */
const CAP_OVERRIDES: Record<string, string> = {
  tiktok: 'TikTok',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  pinterest: 'Pinterest',
  x: 'X',
  cta: 'CTA',
  'b-roll': 'B-roll',
  'at-risk': 'At-risk',
  'gear': 'Gear',
};
export function cap(value: string): string {
  if (!value) return value;
  if (CAP_OVERRIDES[value]) return CAP_OVERRIDES[value];
  return value
    .split(/(\s|-)/)
    .map((word) => (word && /^[a-z]/.test(word) ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join('');
}

export function escapeRegExp(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/** Fills {token} placeholders in a hook template with sensible defaults. */
export function fillTemplate(template: string, topic: string, niche: string): string {
  const defaults: Record<string, string> = {
    topic, niche,
    n: '30', number: '30', days: '30', time: 'a weekend', amount: '$100', step: 'one tiny step',
    metric: 'watch time', thing: 'technique', format: 'short video', result: 'the result', tool: 'free tool',
    free: 'free', price: '$50/mo', guide: 'guide', minutes: '3', outcome: 'growth', tiny: 'small',
    resource: 'a phone camera', unexpected: 'something clicked', event: 'small win', word: 'SOUND OFF',
    platform: 'the algorithm', week: 'this week', month: 'this month', trend: 'that trend', audio: 'this audio',
    viral: 'viral moment', moment: 'moment', community: 'community', hours: '24', seconds: '3', year: 'year',
    deliverable: 'editorial', workflow: 'workflow', process: 'process', framework: 'framework', expert: 'pro',
    role: 'creator', challenge: 'challenge', method: 'method', total: '30', action: 'start', trick: 'trick',
    secret: 'secret', sneaky: 'small', detail: 'detail', setting: 'mode', feature: 'feature', warning: 'warning',
    clause: 'clause', famous: 'successful', creator: 'creator', normal: 'everyday', example: 'video',
    session: 'shoot', score: 'score', saturation: 'saturation', feed: 'feeds', tip: 'tip', rule: 'rule',
    project: 'project', frequency: 'every week', nacho: 'start', secrets: 'secrets', soc: 'content',
  };
  return template.replace(/\{([a-zA-Z_]+)\}/g, (_all, key: string) => defaults[key] ?? key);
}