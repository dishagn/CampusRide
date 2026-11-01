import { createClient } from '@supabase/supabase-js';

// Read environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are valid and not default placeholder strings
const isUrlValid = supabaseUrl && supabaseUrl.startsWith('http') && !supabaseUrl.includes('your-project-id');
const isKeyValid = supabaseAnonKey && supabaseAnonKey.length > 20 && !supabaseAnonKey.includes('your-anon-publishable-key');

export const isSupabaseConfigured = Boolean(isUrlValid && isKeyValid);

let client = null;

if (isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    console.info('[CampusRide] Supabase client initialized with cloud backend.');
  } catch (error) {
    console.error('[CampusRide] Failed to initialize Supabase client:', error);
    client = null;
  }
} else {
  console.warn(
    '[CampusRide] Supabase credentials not detected in .env. Running in interactive PREVIEW & DEMO mode with in-memory persistence and simulation.'
  );
}

export const supabase = client;

/**
 * Returns configuration diagnostics for UI display
 */
export function getBackendStatus() {
  return {
    isConfigured: isSupabaseConfigured,
    url: isUrlValid ? supabaseUrl : null,
    hasKey: Boolean(isKeyValid),
    mode: isSupabaseConfigured ? 'LIVE_CLOUD' : 'DEMO_MODE',
  };
}

