/** Creator payment currencies with flags, display names and approximate FX. */

export interface CurrencyInfo { code: string; name: string; flag: string }

/** Currencies creators actually get paid in — pick the one your client's contract names. */
export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'BRL', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', flag: '🇲🇽' },
  { code: 'KRW', name: 'South Korean Won', flag: '🇰🇷' },
  { code: 'PHP', name: 'Philippine Peso', flag: '🇵🇭' },
  { code: 'IDR', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  { code: 'THB', name: 'Thai Baht', flag: '🇹🇭' },
  { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
];

export const DEFAULT_CURRENCY = 'USD';

/** Approximate mid-market rate per 1 USD (best-effort, editable — used for dashboards only). */
export const FX_TO_USD: Record<string, number> = {
  USD: 1, EUR: 1.09, GBP: 1.27, INR: 0.012, AUD: 0.66, CAD: 0.73, SGD: 0.74, AED: 0.27,
  JPY: 0.0067, CNY: 0.14, BRL: 0.18, MXN: 0.055, KRW: 0.00072, PHP: 0.017, IDR: 0.000062,
  THB: 0.028, ZAR: 0.055, NGN: 0.00065, CHF: 1.13,
};

export function currencyFlag(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.flag ?? '💵';
}

export function fxRate(code: string): number {
  return FX_TO_USD[code] ?? 1;
}

/** Converts any supported currency into US dollars (dashboard base math). */
export function toUsd(amount: number, currency = DEFAULT_CURRENCY): number {
  return (amount || 0) * fxRate(currency);
}

/** Converts a USD amount into the given currency. */
export function fromUsd(amountUsd: number, currency = DEFAULT_CURRENCY): number {
  const rate = fxRate(currency);
  return rate ? (amountUsd || 0) / rate : amountUsd || 0;
}

/** Converts between any two supported currencies. */
export function convertMoney(amount: number, fromCurrency: string, toCurrency: string): number {
  return fromUsd(toUsd(amount, fromCurrency), toCurrency);
}

export function formatMoney(amount: number, currency = DEFAULT_CURRENCY, fractionDigits?: number): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: fractionDigits ?? (amount >= 1000 ? 0 : 2), minimumFractionDigits: 0 }).format(amount || 0);
  } catch {
    return `${currencyFlag(currency)}${(amount || 0).toFixed(0)}`;
  }
}

/** Format compactly for cards — e.g. $1.2K. */
export function formatMoneyCompact(amount: number, currency = DEFAULT_CURRENCY): string {
  if (Math.abs(amount) >= 1_000_000) return formatMoney(amount / 1_000_000, currency) + 'M';
  if (Math.abs(amount) >= 1_000) return formatMoney(amount / 1_000, currency) + 'K';
  return formatMoney(amount, currency);
}

const BASE_KEY = 'sc_base_currency';

/** The user's preferred reporting currency (persisted locally, defaults to USD). */
export function getBaseCurrency(): string {
  try { return localStorage.getItem(BASE_KEY) ?? DEFAULT_CURRENCY; } catch { return DEFAULT_CURRENCY; }
}

export function setBaseCurrency(code: string): void {
  try { localStorage.setItem(BASE_KEY, code); } catch { /* ignore */ }
}

/** Income streams so the money view can tell brand deals from products. */
export const INCOME_STREAMS = [
  { id: 'brand-deal', label: 'Brand deal', emoji: '🤝' },
  { id: 'ugc-marketplace', label: 'UGC marketplace', emoji: '🛍️' },
  { id: 'affiliate', label: 'Affiliate', emoji: '🔗' },
  { id: 'digital-product', label: 'Digital product', emoji: '📦' },
  { id: 'retainer', label: 'Retainer / management', emoji: '🤖' },
  { id: 'platform', label: 'Platform payouts', emoji: '📱' },
  { id: 'coaching', label: 'Coaching / consulting', emoji: '🎓' },
  { id: 'licensing', label: 'Licensing / usage rights', emoji: '📄' },
  { id: 'events', label: 'Events / speaking', emoji: '🎤' },
  { id: 'other', label: 'Other', emoji: '✨' },
] as const;

export function streamMeta(stream: string | null): { id: string; label: string; emoji: string } {
  const found = INCOME_STREAMS.find((s) => s.id === stream);
  return found ?? { id: stream ?? 'other', label: stream ?? 'Unassigned', emoji: '✨' };
}
