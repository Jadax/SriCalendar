import { useState, type FormEvent, type ReactElement } from 'react';
import { BadgeCheck, Mail, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from '../../lib/router';
import { neon } from '../../lib/neonClient';
import { AuthFrame } from './LoginPage';
import { Button } from '../ui/Button';

/** Verifies the one-time code sent by Neon Auth's shared email provider. */
export function VerifyEmailPage(): ReactElement {
  const location = useLocation();
  const savedEmail = (location.state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(savedEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  /** Sends the entered one-time code to Neon and marks the email as verified. */
  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError('');
    const result = await neon.auth.verifyOtp({ email, token: code, type: 'signup' });
    if (result.error) { setError(result.error.message ?? 'That code did not work. Please try again.'); return; }
    setVerified(true);
  };

  if (verified) return <AuthFrame title="You are officially in!" subtitle="Your SriCalendar is ready for its first beautiful plan."><div className="verify-success"><BadgeCheck size={36}/><p>Your email is verified.</p><Link to="/login"><Button>Sign in to SriCalendar</Button></Link></div></AuthFrame>;

  return <AuthFrame title="One tiny sparkle left" subtitle="Enter the code we sent to your inbox to secure your calendar."><form className="auth-form" onSubmit={(event) => void submit(event)}><label>Email<div className="input-wrap"><Mail size={18}/><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></div></label><label>Verification code<div className="input-wrap"><ShieldCheck size={18}/><input type="text" value={code} onChange={(event) => setCode(event.target.value.replace(/\s/g, ''))} required inputMode="numeric" autoComplete="one-time-code" maxLength={8} placeholder="Enter your code" data-bwignore="true" /></div></label>{error && <p className="form-error">{error}</p>}<Button type="submit">Verify my email</Button></form><p className="auth-switch">Already verified? <Link to="/login">Sign in</Link></p></AuthFrame>;
}
