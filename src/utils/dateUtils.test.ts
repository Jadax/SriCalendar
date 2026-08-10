import { describe, expect, it } from 'vitest';
import { fromDateKey, getGreeting, prettyDate, toDateKey } from './dateUtils';

/** Locks down the timezone-safe historical date-key contract. */
describe('historical date utilities', () => {
  it('round-trips a local calendar date without UTC drift', () => {
    const date = new Date(2024, 0, 15, 23, 45);
    expect(toDateKey(date)).toBe('2024-01-15');
    expect(toDateKey(fromDateKey('2024-01-15'))).toBe('2024-01-15');
  });

  it('formats the selected historical date clearly', () => {
    expect(prettyDate('2024-01-15')).toBe('🌸 Monday, 15 January 2024');
  });

  it('uses a time-aware creator greeting', () => {
    expect(getGreeting(new Date(2026, 0, 1, 9))).toContain('morning');
    expect(getGreeting(new Date(2026, 0, 1, 20))).toContain('evening');
  });
});
