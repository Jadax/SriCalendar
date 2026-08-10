import { useEffect, type ReactElement } from 'react';
import { useNavigate } from '../../lib/router';
import { neon } from '../../lib/neonClient';

/** Completes email/OAuth callbacks and returns the user to the application. */
export function AuthCallback(): ReactElement {
  const navigate = useNavigate();
  useEffect(() => { void neon.auth.getSession().then(({ data }) => navigate(data.session ? '/app/today' : '/login', { replace: true })); }, [navigate]);
  return <div className="full-loader"><span>✨</span><p>Finishing your sign-in…</p></div>;
}
