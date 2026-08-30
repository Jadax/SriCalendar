import type { MediaKitProfile, OutreachContact } from '../types/ugc';
import type { SaBrand } from '../data/saBrands';

/**
 * Outreach CRM brain: decides which brand touchpoints need a nudge today and
 * drafts a plain, human follow-up. Pure and deterministic, no AI required.
 */

const ACTIVE_STATUSES = new Set(['sent', 'replied', 'discussing']);

/** Rows that need a follow-up today or earlier and are still in the conversation. */
export function followUpsDue(items: OutreachContact[], todayKey: string): OutreachContact[] {
  return items
    .filter((r) => ACTIVE_STATUSES.has(r.status) && r.follow_up_at && r.follow_up_at <= todayKey)
    .sort((a, b) => (a.follow_up_at ?? '').localeCompare(b.follow_up_at ?? ''));
}

/** Whole days between a follow-up date and today; negative means still in the future. */
export function daysOverdue(followUpAt: string, todayKey: string): number {
  const a = new Date(`${followUpAt}T00:00:00`).getTime();
  const b = new Date(`${todayKey}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Maps a directory brand's contact method to the CRM channel value. */
export function channelOf(brand: SaBrand | null): string {
  if (!brand) return 'email';
  if (brand.contactMethod === 'dm') return 'dm';
  if (brand.contactMethod === 'form') return 'form';
  return 'email';
}

/** A short warm follow-up for a brand that went quiet after outreach. */
export function draftOutreachFollowUp(contact: OutreachContact | null, brand: SaBrand | null, mediaKit: MediaKitProfile | null): string {
  const brandName = contact?.brand || brand?.name || 'the team';
  const lastTouch = contact?.last_touched || contact?.sent_at;
  const when = lastTouch ? `back on ${lastTouch}` : 'a few days back';
  const name = mediaKit?.display_name || 'Your name';
  const handle = mediaKit?.social_instagram || mediaKit?.social_tiktok;
  const line = handle ? `In case it helps, I am ${handle} on Instagram.` : 'Happy to send links to my recent work.';
  return `Hi ${brandName} team,

Quick follow-up on the message I sent ${when}. I know inboxes get busy, just wanted to make sure it did not slip through.

${line}

Warm regards,
${name}`;
}