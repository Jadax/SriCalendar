import { useEffect } from 'react';
import { flushPendingUgc } from '../lib/ugcSync';
import { useUiStore } from '../store/uiStore';

/** Flushes queued UGC offline writes whenever the browser reconnects. */
export function useUgcSync(userId: string | undefined): void {
  const setSyncState = useUiStore((state) => state.setSyncState);
  useEffect(() => {
    const synchronize = (): void => {
      if (!userId) return;
      void flushPendingUgc(userId).catch(() => setSyncState('offline'));
    };
    window.addEventListener('online', synchronize);
    synchronize();
    return () => window.removeEventListener('online', synchronize);
  }, [userId, setSyncState]);
}