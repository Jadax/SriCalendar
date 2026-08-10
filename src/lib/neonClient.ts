import { createClient, SupabaseAuthAdapter } from '@neondatabase/neon-js';
import type { Database } from '../types/database';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL || 'https://placeholder.neonauth.invalid/neondb/auth';
const dataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL || 'https://placeholder.apirest.invalid/neondb/rest/v1';

/** Shared Neon client combining Better Auth compatibility with the PostgREST Data API. */
export const neon = createClient<Database>({
  auth: { adapter: SupabaseAuthAdapter(), url: authUrl },
  dataApi: { url: dataApiUrl },
});

/** True when both public Neon browser endpoints have been configured. */
export const isNeonConfigured = Boolean(import.meta.env.VITE_NEON_AUTH_URL && import.meta.env.VITE_NEON_DATA_API_URL);
