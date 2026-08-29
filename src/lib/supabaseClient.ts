import { createClient } from '@supabase/supabase-js';

function sanitizeSupabaseUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  let url = rawUrl.trim().replace(/^["']|["']$/g, '');
  if (!url) return undefined;

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  // Remove trailing subpaths accidentally copied from dashboard (like /rest/v1, /auth/v1, /storage/v1, etc.)
  url = url.replace(/\/(rest|auth|storage|graphql)(\/v[0-9]+)?(\/.*)?$/i, '');

  // Strip trailing slashes
  url = url.replace(/\/+$/, '');

  return url;
}

function sanitizeSupabaseKey(rawKey?: string): string | undefined {
  if (!rawKey) return undefined;
  const key = rawKey.trim().replace(/^["']|["']$/g, '');
  return key || undefined;
}

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseUrl = sanitizeSupabaseUrl(rawSupabaseUrl);
export const supabaseAnonKey = sanitizeSupabaseKey(rawSupabaseAnonKey);

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
  !supabaseUrl.includes('your-supabase-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Helper to get authorization token header for server API requests if Supabase session exists
 */
export async function getAuthHeader(): Promise<Record<string, string>> {
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        return { Authorization: `Bearer ${data.session.access_token}` };
      }
    } catch (err) {
      console.warn('Could not retrieve Supabase session header:', err);
    }
  }
  return {};
}
