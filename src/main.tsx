import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { RouterProvider } from './lib/router';
import './index.css';
import './ugc.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: true, retry: 2 } } });

/** Mounts SriCalendar with routing and server-state providers. */
function bootstrap(): void {
  const root = document.getElementById('root');
  if (!root) throw new Error('Root element is missing.');
  createRoot(root).render(<StrictMode><QueryClientProvider client={queryClient}><RouterProvider><App/></RouterProvider></QueryClientProvider></StrictMode>);
}

bootstrap();

/** Registers the zero-cost app-shell cache in production-capable browsers. */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register('/sw.js'); });
}
