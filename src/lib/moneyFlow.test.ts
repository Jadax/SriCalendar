import { describe, expect, it } from 'vitest';
import { dealPct, funnelStages, funnelStats, monthKeys, projectCashFlow, type FunnelStats } from './moneyFlow';
import type { BrandDeal, Invoice } from '../types/ugc';

const deal = (d: Partial<BrandDeal>): BrandDeal => ({
  id: d.id ?? 'd', user_id: 'u', created_at: '2026-01-01', updated_at: '2026-01-01', sync_pending: 0,
  brand_name: d.brand_name ?? 'Brand', contact_name: null, contact_email: null,
  deal_value: d.deal_value ?? 0, estimated_probability: d.estimated_probability ?? 60, currency: d.currency ?? 'USD',
  deliverables: null, usage_rights: null, rights_period: null, deadline: d.deadline ?? null,
  pitch_date: null, follow_up_date: null, payment_status: 'pending', status: d.status ?? 'cold',
  platform: null, notes: null,
});

const invoice = (i: Partial<Invoice>): Invoice => ({
  id: i.id ?? 'i', user_id: 'u', created_at: '2026-01-01', updated_at: '2026-01-01', sync_pending: 0,
  invoice_number: i.invoice_number ?? 'INV-1', brand_deal_id: null, client_note: null,
  recipient_name: null, recipient_email: null, issue_date: i.issue_date ?? '2026-08-01',
  due_date: i.due_date ?? '2026-09-01', line_items: [], subtotal: 0, tax: 0,
  total: i.total ?? 0, status: i.status ?? 'sent', currency: i.currency ?? 'USD', stream: null,
});

describe('moneyFlow · deal probability', () => {
  it('treats booked and delivered deals as certain', () => {
    expect(dealPct(deal({ status: 'accepted' }))).toBe(1);
    expect(dealPct(deal({ status: 'delivered' }))).toBe(1);
  });
  it('treats declined as zero and open deals by estimated probability', () => {
    expect(dealPct(deal({ status: 'declined' }))).toBe(0);
    expect(dealPct(deal({ status: 'contacted', estimated_probability: 40 }))).toBeCloseTo(0.4);
    expect(dealPct(deal({ status: 'negotiating', estimated_probability: 120 }))).toBe(1);
  });
});

describe('moneyFlow · funnel stages', () => {
  it('counts deals per stage in pipeline order', () => {
    const stages = funnelStages([
      deal({ status: 'cold' }), deal({ status: 'cold' }),
      deal({ status: 'contacted' }),
      deal({ status: 'declined', deal_value: 500 }),
    ]);
    expect(stages.map((s) => [s.id, s.count])).toEqual([
      ['cold', 2], ['contacted', 1], ['negotiating', 0], ['accepted', 0], ['delivered', 0], ['declined', 1],
    ]);
  });
  it('excludes declined value but keeps their counts', () => {
    const stages = funnelStages([
      deal({ status: 'cold', deal_value: 100 }),
      deal({ status: 'declined', deal_value: 200 }),
    ]);
    expect(stages.find((s) => s.id === 'cold')?.valueUsd).toBe(100);
    expect(stages.find((s) => s.id === 'declined')?.valueUsd).toBe(0);
  });
  it('converts deal currency into USD for the funnel', () => {
    const stages = funnelStages([deal({ status: 'accepted', deal_value: 1, currency: 'ZAR' })]);
    expect(stages.find((s) => s.id === 'accepted')?.valueUsd).toBeGreaterThan(0);
  });
});

describe('moneyFlow · funnel stats', () => {
  it('computes win rate from decided deals only', () => {
    const stats: FunnelStats = funnelStats([
      deal({ status: 'accepted' }), deal({ status: 'delivered' }), deal({ status: 'declined' }), deal({ status: 'cold' }),
    ], []);
    expect(stats.winRate).toBeCloseTo(2 / 3);
  });
  it('returns null win rate before anything is decided', () => {
    const stats = funnelStats([deal({ status: 'cold' })], []);
    expect(stats.winRate).toBeNull();
  });
  it('averages only booked + delivered deal values', () => {
    const stats = funnelStats([
      deal({ status: 'delivered', deal_value: 400 }),
      deal({ status: 'declined', deal_value: 900 }),
      deal({ status: 'cold', deal_value: 100 }),
    ], []);
    expect(stats.avgClosedUsd).toBe(400);
  });
  it('weights expected value by probability', () => {
    const stats = funnelStats([
      deal({ status: 'contacted', deal_value: 200, estimated_probability: 50 }),
      deal({ status: 'accepted', deal_value: 100 }),
    ], []);
    expect(stats.expectedUsd).toBeCloseTo(200);
  });
  it('sums outstanding unpaid invoices in USD', () => {
    const stats = funnelStats([], [
      invoice({ total: 500, status: 'sent' }), invoice({ total: 300, status: 'overdue' }), invoice({ total: 800, status: 'paid' }),
    ]);
    expect(stats.outstandingUsd).toBe(800);
  });
});

describe('moneyFlow · projection months', () => {
  it('produces a clean YYYY-MM list from the start month', () => {
    expect(monthKeys(new Date(2026, 8, 15), 3)).toEqual(['2026-09', '2026-10', '2026-11']);
  });
});

describe('moneyFlow · cash-flow projection', () => {
  const months = ['2026-09', '2026-10', '2026-11'];
  const monthOf = <T extends { month: string }>(rows: T[], key: string): T => {
    const found = rows.find((r) => r.month === key);
    if (!found) throw new Error(`missing month ${key}`);
    return found;
  };

  it('buckets paid invoices by issue month and unpaid by due month', () => {
    const { rows } = projectCashFlow([], [
      invoice({ total: 100, status: 'paid', issue_date: '2026-09-12', due_date: '2026-09-30' }),
      invoice({ total: 250, status: 'sent', issue_date: '2026-09-01', due_date: '2026-10-01' }),
      invoice({ total: 75, status: 'paid', issue_date: '2026-11-03' }),
    ], months);
    expect(monthOf(rows, '2026-09').paidUsd).toBe(100);
    expect(monthOf(rows, '2026-10').invoicedUsd).toBe(250);
    expect(monthOf(rows, '2026-11').paidUsd).toBe(75);
  });

  it('projects open deals into their deadline month at probability weight', () => {
    const { rows, ungatedUsd } = projectCashFlow([
      deal({ status: 'contacted', deal_value: 1000, estimated_probability: 40, deadline: '2026-10-15' }),
      deal({ status: 'accepted', deal_value: 600, deadline: '2026-09-15' }),
      deal({ status: 'negotiating', deal_value: 800, estimated_probability: 80, deadline: null }),
    ], [], months);
    expect(monthOf(rows, '2026-09').expectedUsd).toBeCloseTo(600);
    expect(monthOf(rows, '2026-10').expectedUsd).toBeCloseTo(400);
    expect(ungatedUsd).toBeCloseTo(640);
  });

  it('clamps past deadlines into the first window month', () => {
    const { rows } = projectCashFlow([
      deal({ status: 'accepted', deal_value: 500, deadline: '2026-07-01' }),
    ], [], months);
    expect(monthOf(rows, '2026-09').expectedUsd).toBe(500);
  });

  it('skips declined deals entirely', () => {
    const { rows } = projectCashFlow([
      deal({ status: 'declined', deal_value: 9000, deadline: '2026-09-01' }),
    ], [], months);
    expect(rows.every((r) => r.expectedUsd === 0)).toBe(true);
  });
});