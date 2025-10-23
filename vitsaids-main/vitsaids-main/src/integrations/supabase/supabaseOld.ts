// src/integrations/supabase/supabaseOld.ts
import { createClient } from '@supabase/supabase-js';
import type { Database as OldDatabase } from './oldDbTypes';

// CORRECTED: Use VITE_ environment variables for the old database
const OLD_SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || // Prefer VITE_ prefix for Vite apps
  process.env.VITE_SUPABASE_URL;       // Fallback for Node.js environment/build process

const OLD_SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || // Prefer VITE_ prefix for Vite apps
  process.env.VITE_SUPABASE_ANON_KEY;       // Fallback for Node.js environment/build process

if (!OLD_SUPABASE_URL || !OLD_SUPABASE_KEY) {
    // Updated error message to reflect the expected variable names
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY for supabaseOld.');
}

// Singleton pattern to prevent multiple GoTrueClient instances
let supabaseOldInstance: ReturnType<typeof createClient<OldDatabase>> | null = null;

export const supabaseOld = (() => {
    if (!supabaseOldInstance) {
        console.log('[supabaseOld] Creating new Supabase client instance');
        supabaseOldInstance = createClient<OldDatabase>(OLD_SUPABASE_URL, OLD_SUPABASE_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
            },
        });
    } else {
        console.log('[supabaseOld] Reusing existing Supabase client instance');
    }
    return supabaseOldInstance;
})();
