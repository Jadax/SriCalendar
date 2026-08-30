import { describe, expect, it } from 'vitest';
import { channelOf, daysOverdue, draftOutreachFollowUp, followUpsDue } from './outreachBrain';
import type { OutreachContact } from '../types/ugc';
import type { SaBrand } from '../data/saBrands';

const row = (r: Partial<OutreachContact>): OutreachContact => ({
  id: r.id ?? 'o1', user_id: 'u', created_at: '2026-08-01', updated_at: '2026-08-01', sync_pending: 0,
  brand: r.brand ?? 'Clicks', brand_category: r.brand_category ?? null, channel: r.channel ?? 'email',
  contact: r.contact ?? null, status: r.status ?? 'sent', sent_at: r.sent_at ?? null,
  last_touched: r.last_touched ?? null, follow_up_at: r.follow_up_at ?? null,
  template: r.template ?? null, notes: r.notes ?? null, deal_id: r.deal_id ?? null,
});

const brand: SaBrand = {
  name: 'Clicks', country: 'ZA', category: 'retailers', subcategory: 'Pharmacy', website: 'clicks.co.za',
  instagram: '@clicks', tiktok: '@clicks', email: 'hello@clicks.co.za', contactMethod: 'form',
  outreachDifficulty: 'medium', typicalBudget: 'mid', keyProducts: [], keyEvents: [],
  notes: 'Formal influencer programme', readyToSendMessage: 'Hi!',
};

describe('outreachBrain', () => {
  it('returns nothing when there is never outreach', () => {
    expect(followUpsDue([], '2026-08-15')).toHaveLength(0);
  });

  it('surfaces sent rows whose follow-up is today or earlier', () => {
    const items = [
      row({ id: 'a', brand: 'A', status: 'sent', follow_up_at: '2026-08-15' }),
      row({ id: 'b', brand: 'B', status: 'sent', follow_up_at: '2026-08-10' }),
      row({ id: 'c', brand: 'C', status: 'sent', follow_up_at: '2026-08-20' }),
    ];
    const due = followUpsDue(items, '2026-08-15');
    expect(due.map((r) => r.brand).sort()).toEqual(['A', 'B']);
  });

  it('ignores won conversations and rows without a follow-up date', () => {
    const items = [
      row({ id: 'a', brand: 'A', status: 'collab', follow_up_at: '2026-08-01' }),
      row({ id: 'b', brand: 'B', status: 'done', follow_up_at: '2026-08-01' }),
      row({ id: 'c', brand: 'C', status: 'replied', follow_up_at: null }),
    ];
    expect(followUpsDue(items, '2026-08-15')).toHaveLength(0);
  });

  it('counts days overdue', () => {
    expect(daysOverdue('2026-08-10', '2026-08-15')).toBe(5);
    expect(daysOverdue('2026-08-20', '2026-08-15')).toBe(-5);
  });

  it('maps directory contact methods to CRM channels', () => {
    expect(channelOf(brand)).toBe('form');
    expect(channelOf({ ...brand, contactMethod: 'dm' })).toBe('dm');
    expect(channelOf({ ...brand, contactMethod: 'agency' })).toBe('email');
    expect(channelOf(null)).toBe('email');
  });

  it('drafts a warm human follow-up without em dashes', () => {
    const draft = draftOutreachFollowUp(row({ status: 'sent', sent_at: '2026-08-10' }), brand, null);
    expect(draft).toContain('Clicks');
    expect(draft).toContain('back on 2026-08-10');
    expect(draft).toContain('Quick follow-up');
    expect(draft).not.toContain('—');
  });

  it('falls back gracefully when nothing about the contact is known', () => {
    const draft = draftOutreachFollowUp(null, null, null);
    expect(draft).toContain('the team');
    expect(draft).toContain('a few days back');
  });
});