import { format, parseISO } from 'date-fns';

/** Converts a Date to the stable local YYYY-MM-DD history key. */
export function toDateKey(date: Date): string { return format(date, 'yyyy-MM-dd'); }
/** Parses a date key without UTC timezone drift. */
export function fromDateKey(dateKey: string): Date { return parseISO(dateKey); }
/** Formats a date key for the daily panel heading. */
export function prettyDate(dateKey: string): string { return `🌸 ${format(fromDateKey(dateKey), 'EEEE, d MMMM yyyy')}`; }
/** Returns a time-aware creator greeting. */
export function getGreeting(date = new Date(), firstName = 'Creator'): string {
  const hour = date.getHours();
  return `Good ${hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'}, ${firstName}! 🌸`;
}
/** Returns the decoration used for the current meteorological season. */
export function getSeasonalDecoration(date = new Date()): string {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return '🌸';
  if (month >= 5 && month <= 7) return '☀️';
  if (month >= 8 && month <= 10) return '🍂';
  return '❄️';
}
