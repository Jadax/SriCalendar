import type { ReactElement } from 'react';
import { useLocation, useNavigate } from '../../lib/router';

export type AppTab = 'home' | 'calendar' | 'studio' | 'business' | 'knowledge';

const TABS: Array<{ id: AppTab; label: string; emoji: string; route: string }> = [
  { id: 'home', label: 'Home', emoji: '🏠', route: '/app/home' },
  { id: 'calendar', label: 'Calendar', emoji: '📅', route: '/app/today' },
  { id: 'studio', label: 'Studio', emoji: '🎬', route: '/app/studio' },
  { id: 'business', label: 'Business', emoji: '💼', route: '/app/business' },
  { id: 'knowledge', label: 'Knowledge', emoji: '🧠', route: '/app/knowledge' },
];

/** Resolves the active pillar from the current application route. */
export function tabFromPath(pathname: string): AppTab {
  if (pathname.startsWith('/app/home') || pathname.startsWith('/preview/home')) return 'home';
  if (pathname.startsWith('/app/studio') || pathname.startsWith('/preview/studio')) return 'studio';
  if (pathname.startsWith('/app/business') || pathname.startsWith('/preview/business')) return 'business';
  if (pathname.startsWith('/app/knowledge') || pathname.startsWith('/preview/knowledge')) return 'knowledge';
  if (pathname === '/app' || pathname === '/preview' || pathname === '/app/' || pathname === '/preview/') return 'home';
  return 'calendar';
}

/** Persistent command-center navigation bar. */
export function TabBar(): ReactElement {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = tabFromPath(pathname);
  const base = pathname.startsWith('/preview') ? '/preview' : '/app';
  return <nav className="tab-bar" aria-label="Main navigation">{TABS.map((tab) => <button key={tab.id} className={`tab-btn ${active === tab.id ? 'active' : ''}`} onClick={() => navigate(`${base}${tab.route.slice('/app'.length)}`)} aria-current={active === tab.id ? 'page' : undefined}><span className="tab-emoji">{tab.emoji}</span><span>{tab.label}</span></button>)}</nav>;
}