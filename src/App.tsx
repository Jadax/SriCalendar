import type { ReactElement } from 'react';
import { Navigate, useLocation } from './lib/router';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/auth/LoginPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { AuthCallback } from './components/auth/AuthCallback';
import { VerifyEmailPage } from './components/auth/VerifyEmailPage';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';

/** Defines public authentication and protected application routes. */
export default function App(): ReactElement {
  useAuth();
  const { pathname } = useLocation();
  if (pathname === '/login') return <LoginPage/>;
  if (pathname === '/signup') return <SignUpPage/>;
  if (pathname === '/verify-email') return <VerifyEmailPage/>;
  if (pathname === '/auth/callback') return <AuthCallback/>;
  if (pathname.startsWith('/preview')) return <AppShell preview/>;
  if (pathname.startsWith('/app/')) return <ProtectedRoute><AppShell/></ProtectedRoute>;
  return <Navigate to="/app/home" replace/>;
}
