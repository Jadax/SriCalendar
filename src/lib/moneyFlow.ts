import { MONEY_STAGES } from '../data/creatorIntelligence';
import { toUsd } from '../utils/money';
import type { BrandDeal, Invoice } from '../types/ugc';

export interface FunnelStage {
  id: string;
  label: string;
  emoji: string;
  count: number;
  valueUsd: number;
}

export interface FunnelStats {
  /** booked + delivered ÷ (booked + delivered + declined); null when nothing is decided yet. */
  winRate: number | null;
  /** average deal value of booked + delivered deals, in USD. */
  avgClosedUsd: number | null;
  /** probability-weighted value of every non-declined deal, in USD. */
  expectedUsd: number;
  /** raw value of every non-declined deal, in USD. */
  activeUsd: number;
  /** total of invoiced-but-unpaid invoices, in USD. */
  outstandingUsd: number;
}

export interface MonthProjection {
  month: string;
  paidUsd: number;
  invoicedUsd: number;
  expectedUsd: number;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Probability a deal turns into money: booked and delivered are certain, declined is zero, everything else uses the estimated probability. */
export function dealPct(d: BrandDeal): number {
  if (d.status === 'accepted' || d.status === 'delivered') return 1;
  if (d.status === 'declined') return 0;
  return Math.max(0, Math.min(100, d.estimated_probability ?? 0)) / 100;
}

/** One row per money-pipeline stage: how many deals sit there and how much they are worth in USD. */
export function funnelStages(deals: BrandDeal[]): FunnelStage[] {
  const counts: Record<string, number> = {};
  const values: Record<string, number> = {};
  for (const d of deals) {
    const v = toUsd(d.deal_value ?? 0, d.currency);
    counts[d.status] = (counts[d.status] ?? 0) + 1;
    if (d.status !== 'declined') values[d.status] = (values[d.status] ?? 0) + v;
  }
  return MONEY_STAGES.map((s) => ({
    id: s.id,
    label: s.label,
    emoji: s.emoji,
    count: counts[s.id] ?? 0,
    valueUsd: round2(values[s.id] ?? 0),
  }));
}

export function funnelStats(deals: BrandDeal[], invoices: Invoice[]): FunnelStats {
  let closed = 0, closedUsd = 0, declined = 0, expectedUsd = 0, activeUsd = 0, outstandingUsd = 0;
  for (const d of deals) {
    const v = toUsd(d.deal_value ?? 0, d.currency);
    if (d.status === 'accepted' || d.status === 'delivered') { closed += 1; closedUsd += v; expectedUsd += v; }
    else if (d.status === 'declined') { declined += 1; }
    else { expectedUsd += v * dealPct(d); activeUsd += v; }
  }
  for (const inv of invoices) {
    if (inv.status === 'sent' || inv.status === 'overdue') outstandingUsd += toUsd(inv.total, inv.currency);
  }
  const decided = closed + declined;
  return {
    winRate: decided > 0 ? closed / decided : null,
    avgClosedUsd: closed > 0 ? closedUsd / closed : null,
    expectedUsd: round2(expectedUsd),
    activeUsd: round2(activeUsd),
    outstandingUsd: round2(outstandingUsd),
  };
}

/** Month keys (YYYY-MM) for the projection window starting in the given date's month. */
export function monthKeys(start: Date, count: number): string[] {
  const keys: string[] = [];
  const d = new Date(start.getFullYear(), start.getMonth(), 1);
  for (let i = 0; i < count; i++) {
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() + 1);
  }
  return keys;
}

export interface CashFlowProjection {
  rows: MonthProjection[];
  /** expected money from open deals with no deadline yet — lands when you set one. */
  ungatedUsd: number;
}

/** Projects money per month: paid (by issue date), invoiced-but-unpaid (by due date), expected from open deals (by deadline, probability-weighted). */
export function projectCashFlow(deals: BrandDeal[], invoices: Invoice[], months: string[]): CashFlowProjection {
  const idx = new Map(months.map((m, i) => [m, i] as const));
  const rows: MonthProjection[] = months.map((month) => ({ month, paidUsd: 0, invoicedUsd: 0, expectedUsd: 0 }));

  for (const inv of invoices) {
    const v = toUsd(inv.total, inv.currency);
    if (inv.status === 'paid') {
      const i = idx.get(inv.issue_date.slice(0, 7));
      if (i !== undefined) rows[i]!.paidUsd += v;
    } else if (inv.status === 'sent' || inv.status === 'overdue') {
      const i = idx.get(inv.due_date.slice(0, 7));
      if (i !== undefined) rows[i]!.invoicedUsd += v;
    }
  }

  let ungatedUsd = 0;
  for (const d of deals) {
    if (d.status === 'declined') continue;
    const v = toUsd(d.deal_value ?? 0, d.currency) * dealPct(d);
    const key = d.deadline ? d.deadline.slice(0, 7) : null;
    if (!key) { ungatedUsd += v; continue; }
    const found = idx.get(key);
    const bucket = found ?? (key < (months[0] ?? '') ? 0 : months.length - 1);
    rows[bucket]!.expectedUsd += v;
  }

  return { rows: rows.map((r) => ({ month: r.month, paidUsd: round2(r.paidUsd), invoicedUsd: round2(r.invoicedUsd), expectedUsd: round2(r.expectedUsd) })), ungatedUsd: round2(ungatedUsd) };
}