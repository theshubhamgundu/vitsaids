// src/integrations/supabase/supabaseNew.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types'; // Assuming 'types' refers to the new DB's types

const NEW_SUPABASE_URL =
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const NEW_SUPABASE_ANON_KEY =
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!NEW_SUPABASE_URL || !NEW_SUPABASE_ANON_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY for supabaseNew.');
}

export const supabaseNew = createClient<Database>(NEW_SUPABASE_URL, NEW_SUPABASE_ANON_KEY, {
    auth: {
        // IMPORTANT: Disable session persistence for this client.
        // The session is managed externally by supabaseOld (via AuthContext).
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});

/**
 * Explicitly sets the session access token for the supabaseNew client.
 * This is used to pass the authenticated session from supabaseOld's context.
 * @param accessToken The access token from the active session of supabaseOld.
 */
export const setSupabaseNewSession = async (accessToken: string | null) => {
    if (accessToken) {
        // This tells the supabaseNew client to use this token for all subsequent requests
        await supabaseNew.auth.setSession({ access_token: accessToken, refresh_token: '' });
        console.log("[supabaseNew.ts] Session set for supabaseNew client.");
    } else {
        // If no token is provided, clear the session for this client
        // Using an internal method for direct header manipulation to avoid GoTrueClient side effects
        (supabaseNew.auth as any).setAuth(null);
        console.log("[supabaseNew.ts] Session cleared for supabaseNew client.");
    }
};
