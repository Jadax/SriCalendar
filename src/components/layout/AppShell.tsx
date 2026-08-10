import { useEffect, useState, type ReactElement } from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { neon } from '../../lib/neonClient';
import { useAuthStore } from '../../store/authStore';
import { useCalendarStore } from '../../store/calendarStore';
import { useUiStore } from '../../store/uiStore';
import { useLocation } from '../../lib/router';
import { useSync } from '../../hooks/useSync';
import { useUgcSync } from '../../hooks/useUgcSync';
import { toDateKey } from '../../utils/dateUtils';
import { db } from '../../lib/dexieClient';
import { createEmptyDailyData } from '../../lib/syncEngine';
import { Header } from './Header';
import { TabBar, tabFromPath } from './TabBar';
import { MonthNavigator } from '../calendar/MonthNavigator';
import { CalendarGrid } from '../calendar/CalendarGrid';
import { WeekView } from '../calendar/WeekView';
import { DailyPanel } from '../daily/DailyPanel';
import { StudioPage } from '../ugc/studio/StudioPage';
import { BusinessPage } from '../ugc/business/BusinessPage';
import { KnowledgePage } from '../ugc/knowledge/KnowledgePage';
import { Confetti } from '../shared/Confetti';
import { FirstNameModal } from '../shared/FirstNameModal';

/** Hosts the responsive calendar workspace, profile welcome, and daily visit streak. */
export function AppShell({ preview = false }: { preview?: boolean }): ReactElement {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? (preview ? '11111111-1111-4111-8111-111111111111' : undefined);
  const { selectedDateKey, viewMode } = useCalendarStore();
  const { pathname } = useLocation();
  const appTab = tabFromPath(pathname);
  const { darkMode, setStreak } = useUiStore();
  const [firstName, setFirstName] = useState<string | null>(preview ? 'Creator' : null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(preview);
  useSync(preview ? undefined : userId);
  useUgcSync(preview ? undefined : userId);

  useEffect(() => {
    if (preview) { setStreak(6); setFirstName('Creator'); setProfileLoaded(true); return; }
    if (!user) return;
    setFirstName(null); setAvatarUrl(null); setProfileLoaded(false);
    const today = toDateKey(new Date());
    void neon.from('profiles').select('username,avatar_url,streak_count,last_visit').eq('id', user.id).maybeSingle().then(async ({ data }) => {
      const previous = data?.last_visit as string | null | undefined;
      const oldCount = Number(data?.streak_count ?? 0);
      const gap = previous ? differenceInCalendarDays(new Date(), parseISO(previous)) : -1;
      const streak = gap === 0 ? Math.max(oldCount, 1) : gap === 1 ? oldCount + 1 : 1;
      setFirstName(data?.username?.trim() || null);
      setAvatarUrl(data?.avatar_url ?? null);
      setProfileLoaded(true);
      setStreak(streak);
      if (gap !== 0) await neon.from('profiles').upsert({ id: user.id, streak_count: streak, last_visit: today }, { onConflict: 'id' });
    });
  }, [preview, setStreak, user]);

  useEffect(() => {
    if (!preview || !userId) return;
    const today = toDateKey(new Date());
    const sample = { ...createEmptyDailyData(userId, today), tasks: [{ id: 'sample-1', text: 'Film the morning skincare reel', completed: true, order: 0 }, { id: 'sample-2', text: 'Edit the café mini vlog', completed: false, order: 1 }, { id: 'sample-3', text: 'Reply to brand comments', completed: false, order: 2 }], notes: 'Golden-hour shots around 4:30 ✨\nRemember the peach backdrop and the tiny flower clips.', stickers: ['🌸', '📸', '✨'], platform_posts: [{ id: 'post-1', platform: 'instagram' as const, title: 'Soft-life Sunday carousel', status: 'scheduled' as const, notes: 'Use the warm preset' }], updated_at: new Date().toISOString() };
    void db.daily_data.put(sample);
  }, [preview, userId]);

  /** Persists the preferred name used in the calendar greeting. */
  const saveFirstName = async (name: string): Promise<void> => {
    if (!user) return;
    const { error } = await neon.from('profiles').upsert({ id: user.id, username: name }, { onConflict: 'id' });
    if (error) throw new Error(error.message);
    setFirstName(name);
  };

  /** Persists a compressed photo in the user's private Neon profile for every device. */
  const saveAvatar = async (photo: string): Promise<void> => {
    if (!user) return;
    const { error } = await neon.from('profiles').upsert({ id: user.id, avatar_url: photo }, { onConflict: 'id' });
    if (error) throw new Error(error.message);
    setAvatarUrl(photo);
  };

  if (!userId) return <div className="full-loader">Loading…</div>;
  return <div className={darkMode ? 'app dark' : 'app'}><Confetti/><Header firstName={firstName ?? undefined} avatarUrl={avatarUrl} onAvatarChange={saveAvatar}/><TabBar/>{(appTab === 'studio' || appTab === 'business' || appTab === 'knowledge') ? <main className="ugc-workspace">{appTab === 'studio' && <StudioPage userId={userId}/>}{appTab === 'business' && <BusinessPage userId={userId}/>}{appTab === 'knowledge' && <KnowledgePage userId={userId}/>}</main> : <main className="workspace"><section className="calendar-card"><MonthNavigator/>{viewMode === 'month' ? <CalendarGrid userId={userId}/> : <WeekView/>}</section><DailyPanel userId={userId} dateKey={selectedDateKey}/></main>}{!preview && profileLoaded && !firstName && <FirstNameModal onSave={saveFirstName}/>}</div>;
}
