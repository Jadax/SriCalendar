import { describe, expect, it, afterEach, beforeEach } from 'vitest';
import { convertMoney, formatMoney, fromUsd, getBaseCurrency, setBaseCurrency, toUsd } from './money';

/** Minimal in-memory localStorage so the money store works in the node test env. */
const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      clear: () => store.clear(),
    },
  });
});

describe('money utils', () => {

  it('converts any currency into USD and back', () => {
    expect(toUsd(100, 'USD')).toBe(100);
    expect(toUsd(100, 'EUR')).toBeCloseTo(109, 5);
    expect(toUsd(100, 'INR')).toBeCloseTo(1.2, 5);
    expect(fromUsd(109, 'EUR')).toBeCloseTo(100, 5);
  });

  it('converts between two non-USD currencies', () => {
    expect(convertMoney(100, 'GBP', 'USD')).toBeCloseTo(127, 5);
    expect(convertMoney(127, 'USD', 'GBP')).toBeCloseTo(100, 5);
  });

  it('falls back gracefully for unknown currencies', () => {
    expect(toUsd(50, 'XXX')).toBe(50);
    expect(formatMoney(50, 'XXX')).toContain('50');
  });

  it('formats with the currency symbol via Intl', () => {
    expect(formatMoney(1200, 'USD', 0)).toContain('$');
    expect(formatMoney(100, 'INR')).toContain('₹');
  });

  it('persists the base currency preference', () => {
    expect(getBaseCurrency()).toBe('USD');
    setBaseCurrency('INR');
    expect(getBaseCurrency()).toBe('INR');
    setBaseCurrency('USD');
  });
});
