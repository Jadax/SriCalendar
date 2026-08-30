export const PLATFORMS = ['tiktok', 'instagram', 'youtube', 'linkedin', 'pinterest', 'x', 'shorts', 'reels', 'newsletter', 'podcast'] as const;
/** Video formats used when logging what a published post actually was. */
export const POST_FORMATS = ['reel', 'demo', 'tutorial', 'before-after', 'review', 'get-ready', 'story', 'carousel', 'vlog', 'trend', 'other'] as const;
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
/** UGC deliverable lifecycle inside a client deal. */
export const DELIVERABLE_STATUSES = ['contracted', 'filmed', 'submitted', 'revision', 'approved', 'published', 'paid'] as const;
/** The order deliverables naturally move through (revision loops back to filming). */
export const DELIVERABLE_FLOW: Record<string, string> = {
  contracted: 'filmed',
  filmed: 'submitted',
  submitted: 'revision',
  revision: 'filmed',
  approved: 'published',
  published: 'paid',
  paid: '',
};
export const DELIVERABLE_STATUS_META: Record<string, { emoji: string; label: string; color: 'mint' | 'coral' | 'lavender' | 'sky' | 'yellow' | 'gray' }> = {
  contracted: { emoji: '🤝', label: 'Contracted', color: 'gray' },
  filmed: { emoji: '🎬', label: 'Filmed', color: 'sky' },
  submitted: { emoji: '📤', label: 'Submitted', color: 'yellow' },
  revision: { emoji: '🔄', label: 'Revisions', color: 'coral' },
  approved: { emoji: '✅', label: 'Approved', color: 'mint' },
  published: { emoji: '🌍', label: 'Published', color: 'lavender' },
  paid: { emoji: '💸', label: 'Paid', color: 'mint' },
};
/** Outreach CRM statuses; the absence of a row means "not contacted". */
export const OUTREACH_STATUSES = ['sent', 'replied', 'discussing', 'collab', 'done'] as const;
export const OUTREACH_STATUS_META: Record<string, { emoji: string; label: string; color: 'mint' | 'coral' | 'lavender' | 'sky' | 'yellow' | 'gray' }> = {
  sent: { emoji: '📩', label: 'Sent', color: 'sky' },
  replied: { emoji: '👀', label: 'Replied', color: 'yellow' },
  discussing: { emoji: '📋', label: 'Discussing', color: 'lavender' },
  collab: { emoji: '🤝', label: 'Collab', color: 'mint' },
  done: { emoji: '✅', label: 'Done', color: 'coral' },
};
export const OUTREACH_CHANNELS = ['email', 'dm', 'form', 'other'] as const;
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

/** Returns a copy of the list sorted alphabetically by its display (cap) value, without mutating the source. */
export function alpha<T extends string>(list: readonly T[]): T[] {
  return [...list].sort((a, b) => cap(a).localeCompare(cap(b)));
}

/** Sorts a list by a display accessor (used for object arrays like currency/streams). */
export function alphaBy<T>(list: readonly T[], display: (item: T) => string): T[] {
  return [...list].sort((a, b) => display(a).localeCompare(display(b)));
}

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
  return template.replace(/\{([a-zA-Z_ /-]+)\}/g, (_all, key: string) => {
    if (key.includes('/')) return key.split('/').filter(Boolean).join(' or ');
    return defaults[key] ?? key;
  });
}