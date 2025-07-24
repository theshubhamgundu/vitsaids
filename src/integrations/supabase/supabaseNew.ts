// src/integrations/supabase/supabaseNew.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types'; // Assuming 'types' refers to the new DB's types

// Use VITE_ for the new database (assuming this is for content management)
const NEW_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const NEW_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!NEW_SUPABASE_URL || !NEW_SUPABASE_ANON_KEY) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY for supabaseNew.');
}

// FIX: Export the client as 'supabaseNew'
export const supabaseNew = createClient<Database>(NEW_SUPABASE_URL, NEW_SUPABASE_ANON_KEY, {
    auth: {
        // These auth settings might be redundant if this DB is purely for public content.
        // If auth is strictly handled by supabaseOld, these can be removed from here.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});
