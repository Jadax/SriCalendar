import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';
import { Download, ShieldCheck, Upload, X } from 'lucide-react';
import { db } from '../../lib/dexieClient';
import { scheduleSync } from '../../lib/syncEngine';
import type { DailyData } from '../../types';

interface DataVaultProps { userId: string; onClose: () => void }
interface BackupFile { app: 'SriCalendar'; schema_version: 1; exported_at: string; records: DailyData[] }

/** Checks the minimum shape required for a safe SriCalendar restore record. */
function isDailyRecord(value: unknown): value is DailyData {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === 'string' && typeof record.user_id === 'string' && typeof record.date_key === 'string' && Array.isArray(record.tasks) && typeof record.notes === 'string' && Array.isArray(record.stickers) && Array.isArray(record.platform_posts) && typeof record.updated_at === 'string';
}

/** Exports and restores user-owned calendar history without requiring a paid backup service. */
export function DataVault({ userId, onClose }: DataVaultProps): ReactElement {
  const [message, setMessage] = useState(''); const input = useRef<HTMLInputElement>(null);
  const exportData = async (): Promise<void> => {
    const records = await db.daily_data.where('user_id').equals(userId).toArray();
    const backup: BackupFile = { app: 'SriCalendar', schema_version: 1, exported_at: new Date().toISOString(), records };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `SriCalendar-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url); setMessage(`${records.length} days safely exported.`);
  };
  const importData = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      if (file.size > 10_000_000) throw new Error('That backup is larger than the 10 MB safety limit.');
      const parsed = JSON.parse(await file.text()) as unknown;
      if (!parsed || typeof parsed !== 'object' || (parsed as { app?: unknown }).app !== 'SriCalendar' || !Array.isArray((parsed as { records?: unknown }).records)) throw new Error('Not a SriCalendar backup.');
      const records = (parsed as { records: unknown[] }).records.filter(isDailyRecord);
      for (const source of records) { const record: DailyData = { ...source, id: source.user_id === userId ? source.id : crypto.randomUUID(), user_id: userId, sync_pending: 1 }; await db.daily_data.put(record); scheduleSync(record); }
      setMessage(`${records.length} days restored and queued for cloud sync.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'This backup could not be restored.'); }
    event.target.value = '';
  };
  return <div className="vault-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="vault-modal" role="dialog" aria-modal="true" aria-labelledby="vault-title"><button className="vault-close" onClick={onClose} aria-label="Close data vault"><X size={18}/></button><div className="vault-icon"><ShieldCheck size={25}/></div><p className="eyebrow">Forever yours</p><h2 id="vault-title">Your data vault</h2><p className="vault-copy">Download a private copy of every saved day. Keep it somewhere safe and restore it whenever you need—no subscription required.</p><div className="vault-actions"><button className="primary-button" onClick={() => void exportData()}><Download size={17}/> Download backup</button><button className="restore-button" onClick={() => input.current?.click()}><Upload size={17}/> Restore backup</button><input ref={input} type="file" accept="application/json,.json" onChange={(event) => void importData(event)} hidden /></div>{message && <p className="vault-message" role="status">{message}</p>}<small>Backups contain your calendar content. Store them privately.</small></section></div>;
}
