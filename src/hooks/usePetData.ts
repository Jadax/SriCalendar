import { useCallback, useEffect, useState } from 'react';
import type { PetIdea, PetProfile } from '../lib/petBrain';
import { defaultPetProfile } from '../lib/petBrain';

export interface PetData {
  profile: PetProfile;
  ideas: PetIdea[];
  doneIds: string[];
  scheduledIds: string[];
}

const EMPTY: PetData = { profile: defaultPetProfile(), ideas: [], doneIds: [], scheduledIds: [] };

function loadKey(userId: string): string {
  return `sricalendar:pet:${userId}`;
}

function loadPetData(userId: string): PetData {
  try {
    const raw = localStorage.getItem(loadKey(userId));
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<PetData>;
    return { ...EMPTY, ...parsed, profile: { ...defaultPetProfile(), ...parsed.profile } };
  } catch {
    return EMPTY;
  }
}

export function usePetData(userId: string): { pet: PetData; save: (next: Partial<PetData>) => void } {
  const [pet, setPet] = useState<PetData>(() => loadPetData(userId));
  useEffect(() => { setPet(loadPetData(userId)); }, [userId]);
  const save = useCallback((next: Partial<PetData>) => {
    setPet((current) => {
      const merged = { ...current, ...next };
      try { localStorage.setItem(loadKey(userId), JSON.stringify(merged)); } catch { /* storage full stays local */ }
      return merged;
    });
  }, [userId]);
  return { pet, save };
}
