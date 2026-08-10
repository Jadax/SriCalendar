import { useEffect } from 'react';
import { flushPending } from '../lib/syncEngine';
import { useUiStore } from '../store/uiStore';

/** Flushes queued offline writes whenever the browser reconnects. */
export function useSync(userId: string | undefined): void {
  const setSyncState = useUiStore((state) => state.setSyncState);
  useEffect(() => {
    const synchronize = (): void => {
      if (!userId) return;
      void flushPending(userId).catch(() => setSyncState('offline'));
    };
    const markOffline = (): void => setSyncState('offline');
    window.addEventListener('online', synchronize);
    window.addEventListener('offline', markOffline);
    synchronize();
    return () => { window.removeEventListener('online', synchronize); window.removeEventListener('offline', markOffline); };
  }, [userId, setSyncState]);
}
