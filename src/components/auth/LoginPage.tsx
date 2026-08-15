import { useState, type FormEvent, type ReactElement } from 'react';
import { Link, Navigate, useLocation, useNavigate } from '../../lib/router';
import { motion } from 'framer-motion';
import { Mail, LockKeyhole } from 'lucide-react';
import { neon } from '../../lib/neonClient';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';

/** Presents email/password and Google OAuth sign-in. */
export function LoginPage(): ReactElement {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const user = useAuthStore((state) => state.user); const setAuth = useAuthStore((state) => state.setAuth); const navigate = useNavigate(); const location = useLocation();
  if (user) return <Navigate to="/app/home" replace />;
  const submit = async (event: FormEvent): Promise<void> => { event.preventDefault(); setBusy(true); setError(''); const result = await neon.auth.signInWithPassword({ email, password }); setBusy(false); if (result.error) setError(result.error.message); else { setAuth(result.data.session); navigate((location.state as { from?: string } | null)?.from ?? '/app/home'); } };
  const google = async (): Promise<void> => { setError(''); const { error: authError } = await neon.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } }); if (authError) setError(authError.message); };
  return <AuthFrame title="Welcome back, superstar!" subtitle="Your ideas have been waiting for you ✨">
    <form onSubmit={submit} className="auth-form"><label>Email<div className="input-wrap"><Mail size={18}/><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="creator@example.com" /></div></label><label>Password<div className="input-wrap"><LockKeyhole size={18}/><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="••••••••" data-bwignore="true" /></div></label>{error && <p className="form-error">{error}</p>}<Button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Open my calendar 💖'}</Button></form>
    <div className="auth-divider"><span>or</span></div><Button variant="google" onClick={() => void google()}><span>G</span> Continue with Google</Button><p className="auth-switch">New here? <Link to="/signup">Create your account</Link></p>
  </AuthFrame>;
}

interface AuthFrameProps { title: string; subtitle: string; children: React.ReactNode }
/** Provides the shared decorative card around authentication forms. */
export function AuthFrame({ title, subtitle, children }: AuthFrameProps): ReactElement {
  return <main className="auth-page"><div className="auth-decoration one">🌸</div><div className="auth-decoration two">✨</div><motion.section className="auth-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><div className="brand-mark">SC</div><h1>{title}</h1><p className="auth-subtitle">{subtitle}</p>{children}</motion.section></main>;
}
