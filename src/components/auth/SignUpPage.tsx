import { useState, type FormEvent, type ReactElement } from 'react';
import { Link, useNavigate } from '../../lib/router';
import { Mail, LockKeyhole } from 'lucide-react';
import { neon } from '../../lib/neonClient';
import { AuthFrame } from './LoginPage';
import { Button } from '../ui/Button';

/** Registers a new account and starts Neon Auth's email-code verification flow. */
export function SignUpPage(): ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  /** Validates account details and requests a verification code from Neon Auth. */
  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError('');
    if (password !== confirm) { setError('Those passwords do not match yet.'); return; }
    if (password.length < 8) { setError('Please use at least 8 characters.'); return; }
    const result = await neon.auth.signUp({ email, password });
    if (result.error && result.error.message !== 'Failed to retrieve user session') { setError(result.error.message); return; }
    navigate('/verify-email', { state: { email } });
  };

  return <AuthFrame title="Start creating beautifully" subtitle="A forever home for every plan, post and idea."><form className="auth-form" onSubmit={(event) => void submit(event)}><label>Email<div className="input-wrap"><Mail size={18}/><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></div></label><label>Password<div className="input-wrap"><LockKeyhole size={18}/><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="new-password" /></div></label><label>Confirm password<div className="input-wrap"><LockKeyhole size={18}/><input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required autoComplete="new-password" /></div></label>{error && <p className="form-error">{error}</p>}<Button type="submit">Create my calendar ✨</Button></form><p className="auth-switch">Already have one? <Link to="/login">Sign in</Link></p></AuthFrame>;
}
