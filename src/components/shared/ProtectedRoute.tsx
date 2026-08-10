import type { ReactElement, ReactNode } from 'react';
import { Navigate, useLocation } from '../../lib/router';
import { useAuthStore } from '../../store/authStore';

/** Guards all app routes and preserves the intended destination during sign-in. */
export function ProtectedRoute({ children }: { children: ReactNode }): ReactElement {
  const { user, loading } = useAuthStore();
  const location = useLocation();
  if (loading) return <div className="full-loader"><span>🌸</span><p>Gathering your plans…</p></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
