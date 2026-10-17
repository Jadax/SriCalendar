import { useEffect, useRef, useState } from 'react';

export interface UseCopyResult { copied: string | null; copy: (text: string, key?: string) => Promise<boolean>; reset: () => void }

/** Clipboard helper — writes text, exposes the copied key and resets it after a beat. */
export function useCopy(resetMs = 1800): UseCopyResult {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);
  const copy = async (text: string, key = 'copied'): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(null), resetMs);
      return true;
    } catch {
      return false;
    }
  };
  const reset = (): void => {
    if (timer.current !== null) { window.clearTimeout(timer.current); timer.current = null; }
    setCopied(null);
  };
  return { copied, copy, reset };
}
