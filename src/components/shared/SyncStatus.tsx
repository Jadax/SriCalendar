import type { ReactElement } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

/** Displays a compact, accessible cloud synchronization state. */
export function SyncStatus(): ReactElement {
  const state = useUiStore((value) => value.syncState);
  const content = state === 'synced' ? ['Synced', <Cloud key="icon" size={14} />] : state === 'syncing' ? ['Syncing…', <RefreshCw key="icon" size={14} className="spin" />] : ['Offline mode', <CloudOff key="icon" size={14} />];
  return <div className={`sync-status ${state}`} role="status">{content[1]}<span>{content[0]}</span></div>;
}
