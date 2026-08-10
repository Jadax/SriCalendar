import { create } from 'zustand';
import type { SyncState } from '../types';

interface UiState { darkMode: boolean; syncState: SyncState; confetti: boolean; streak: number; toggleTheme: () => void; setSyncState: (state: SyncState) => void; setStreak: (count: number) => void; celebrate: () => void; stopCelebrating: () => void }
/** Global presentation, synchronization, and celebration state. */
export const useUiStore = create<UiState>((set) => ({ darkMode: false, syncState: 'synced', confetti: false, streak: 0, toggleTheme: () => set((state) => ({ darkMode: !state.darkMode })), setSyncState: (syncState) => set({ syncState }), setStreak: (streak) => set({ streak }), celebrate: () => set({ confetti: true }), stopCelebrating: () => set({ confetti: false }) }));
