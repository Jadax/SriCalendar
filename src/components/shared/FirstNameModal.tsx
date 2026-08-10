import { useState, type FormEvent, type ReactElement } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface FirstNameModalProps { onSave: (firstName: string) => Promise<void> }

/** Collects the user's preferred first name when they enter SriCalendar for the first time. */
export function FirstNameModal({ onSave }: FirstNameModalProps): ReactElement {
  const [firstName, setFirstName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  /** Validates and saves the name while preventing duplicate submissions. */
  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const cleanName = firstName.trim();
    if (!cleanName) { setError('Tell us what we should call you first.'); return; }
    setBusy(true); setError('');
    try { await onSave(cleanName); } catch { setError('We could not save that yet. Please try again.'); setBusy(false); }
  };

  return <div className="welcome-backdrop" role="dialog" aria-modal="true" aria-labelledby="first-name-title"><section className="welcome-modal"><div className="welcome-icon"><Sparkles size={26}/></div><p className="eyebrow">A little hello</p><h2 id="first-name-title">What should we call you?</h2><p>We will use it to make your daily welcome feel a little more like yours.</p><form onSubmit={(event) => void submit(event)}><label htmlFor="first-name">First name</label><input id="first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} autoFocus autoComplete="given-name" maxLength={40} placeholder="e.g. Sri" />{error && <p className="form-error">{error}</p>}<Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save my name ✨'}</Button></form></section></div>;
}
