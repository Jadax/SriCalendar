import { createContext, useCallback, useContext, useEffect, useMemo, useState, type AnchorHTMLAttributes, type ReactElement, type ReactNode } from 'react';

interface LocationState { pathname: string; state: unknown }
interface RouterValue extends LocationState { navigate: (to: string, options?: { replace?: boolean; state?: unknown }) => void }
const RouterContext = createContext<RouterValue | null>(null);

/** Supplies lightweight, history-API client routing without a server-routing dependency. */
export function RouterProvider({ children }: { children: ReactNode }): ReactElement {
  const read = (): LocationState => ({ pathname: window.location.pathname, state: window.history.state as unknown });
  const [location, setLocation] = useState<LocationState>(read);
  useEffect(() => { const update = (): void => setLocation(read()); window.addEventListener('popstate', update); return () => window.removeEventListener('popstate', update); }, []);
  const navigate = useCallback((to: string, options?: { replace?: boolean; state?: unknown }): void => { window.history[options?.replace ? 'replaceState' : 'pushState'](options?.state ?? null, '', to); setLocation(read()); }, []);
  const value = useMemo(() => ({ ...location, navigate }), [location, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

/** Returns the current client pathname and history state. */
export function useLocation(): LocationState { const router = useContext(RouterContext); if (!router) throw new Error('RouterProvider is missing.'); return { pathname: router.pathname, state: router.state }; }
/** Returns the stable client navigation function. */
export function useNavigate(): RouterValue['navigate'] { const router = useContext(RouterContext); if (!router) throw new Error('RouterProvider is missing.'); return router.navigate; }

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> { to: string }
/** Navigates inside the SPA while retaining native link behavior for modifiers. */
export function Link({ to, onClick, ...props }: LinkProps): ReactElement {
  const navigate = useNavigate();
  return <a href={to} {...props} onClick={(event) => { onClick?.(event); if (!event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); navigate(to); } }} />;
}

/** Redirects after render to avoid mutating browser history during reconciliation. */
export function Navigate({ to, replace = false, state }: { to: string; replace?: boolean; state?: unknown }): null {
  const navigate = useNavigate(); useEffect(() => navigate(to, { replace, state }), [navigate, replace, state, to]); return null;
}
