import Dexie, { type Table } from 'dexie';
import type { DailyData } from '../types';

/** Typed IndexedDB database used as the instant, offline-first data source. */
class SriCalendarDatabase extends Dexie {
  daily_data!: Table<DailyData, [string, string]>;
  /** Creates and versions the local SriCalendar database. */
  constructor() {
    super('SriCalendarDB');
    this.version(1).stores({ daily_data: '[user_id+date_key], user_id, date_key, updated_at, sync_pending' });
  }
}

/** Singleton local database instance. */
export const db = new SriCalendarDatabase();
