import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';
import { Camera, HardDriveDownload, LogOut } from 'lucide-react';
import { neon } from '../../lib/neonClient';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { getGreeting, getSeasonalDecoration } from '../../utils/dateUtils';
import { compressAvatar } from '../../utils/imageUtils';
import { SyncStatus } from '../shared/SyncStatus';
import { ThemeToggle } from '../shared/ThemeToggle';
import { DataVault } from '../shared/DataVault';

interface HeaderProps { firstName?: string; avatarUrl?: string | null; onAvatarChange: (avatarUrl: string) => Promise<void> }

/** Top bar containing the personalized greeting, sync state, and portable profile photo upload. */
export function Header({ firstName, avatarUrl, onAvatarChange }: HeaderProps): ReactElement {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const streak = useUiStore((state) => state.streak);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [savingAvatar, setSavingAvatar] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fallbackAvatar = user?.user_metadata.avatar_url as string | undefined;
  const avatar = avatarUrl ?? fallbackAvatar;

  /** Clears the local session immediately, then invalidates the Neon Auth session. */
  const logout = async (): Promise<void> => { setAuth(null); await neon.auth.signOut(); };
  /** Compresses and saves a profile photo selected from a desktop or mobile device. */
  const chooseAvatar = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setSavingAvatar(true); setAvatarError('');
    try { await onAvatarChange(await compressAvatar(file)); } catch (error) { setAvatarError(error instanceof Error ? error.message : 'We could not save that photo.'); }
    setSavingAvatar(false);
  };

  return <><header className="topbar"><div className="greeting"><span className="season">{getSeasonalDecoration()}</span><div><h1>{getGreeting(undefined, firstName)}</h1><p>Make something wonderful today.</p></div></div><div className="top-actions"><div className="streak" title="Daily visit streak">🔥 <strong>{streak}</strong><span> {streak === 1 ? 'day' : 'days'}</span></div><SyncStatus/><ThemeToggle/>{user && <button className="icon-button" onClick={() => setVaultOpen(true)} aria-label="Open data vault"><HardDriveDownload size={18}/></button>}{user ? <><input ref={inputRef} className="avatar-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void chooseAvatar(event)} tabIndex={-1} aria-hidden="true"/><button className={`avatar-button ${savingAvatar ? 'saving' : ''}`} onClick={() => inputRef.current?.click()} disabled={savingAvatar} aria-label="Upload or change profile photo" title="Change profile photo">{avatar ? <img className="avatar" src={avatar} alt="Your profile" /> : <span className="avatar fallback">{user.email?.[0]?.toUpperCase() ?? 'S'}</span>}<span className="avatar-edit"><Camera size={13}/></span></button></> : <span className="avatar fallback" aria-hidden>S</span>}{user && <button className="icon-button logout" onClick={() => void logout()} aria-label="Sign out"><LogOut size={18}/></button>}</div></header>{avatarError && <p className="avatar-error" role="status">{avatarError}</p>}{vaultOpen && user && <DataVault userId={user.id} onClose={() => setVaultOpen(false)}/>}</>;
}
