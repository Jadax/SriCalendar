import { useEffect } from 'react';
import { neon } from '../lib/neonClient';
import { useAuthStore } from '../store/authStore';

/** Subscribes the application to Neon Auth session changes. */
export function useAuth(): ReturnType<typeof useAuthStore> {
  const state = useAuthStore();
  useEffect(() => {
    void neon.auth.getSession().then(({ data }) => state.setAuth(data.session));
    const { data } = neon.auth.onAuthStateChange((_event, session) => state.setAuth(session));
    return () => data.subscription.unsubscribe();
  }, [state.setAuth]);
  return state;
}
