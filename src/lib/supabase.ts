import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)'
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

const SUPABASE_URL = url;

export function publicStorageUrl(storagePath: string): string {
  if (!storagePath) return '';
  if (storagePath.startsWith('http')) {
    if (storagePath.includes('/storage/v1/object/media/')) {
      return storagePath.replace('/storage/v1/object/media/', '/storage/v1/object/public/media/');
    }
    return storagePath;
  }
  return `${SUPABASE_URL}/storage/v1/object/public/media/${storagePath}`;
}
