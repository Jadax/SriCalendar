import { create } from 'zustand';
import type { AppSession, AppUser } from '../types';

interface AuthState { user: AppUser | null; session: AppSession | null; loading: boolean; setAuth: (session: AppSession | null) => void; setLoading: (loading: boolean) => void }
/** Auth session state populated by the Neon Auth listener. */
export const useAuthStore = create<AuthState>((set) => ({ user: null, session: null, loading: true, setAuth: (session) => set({ session, user: session?.user ?? null, loading: false }), setLoading: (loading) => set({ loading }) }));
