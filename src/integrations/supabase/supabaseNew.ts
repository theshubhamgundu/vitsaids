// src/integrations/supabase/supabaseNew.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types'; // Assuming 'types' refers to the new DB's types

// CORRECTED: Use NEXT_PUBLIC_ environment variables for the new database
const NEW_SUPABASE_URL =
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || // Prefer NEXT_PUBLIC_ for client-side
  process.env.NEXT_PUBLIC_SUPABASE_URL;       // Fallback for Node.js environment/build process

const NEW_SUPABASE_ANON_KEY =
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || // Prefer NEXT_PUBLIC_ for client-side
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;       // Fallback for Node.js environment/build process

if (!NEW_SUPABASE_URL || !NEW_SUPABASE_ANON_KEY) {
    // Updated error message to reflect the expected variable names
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY for supabaseNew.');
}

export const supabaseNew = createClient<Database>(NEW_SUPABASE_URL, NEW_SUPABASE_ANON_KEY, {
    auth: {
        // These auth settings might be redundant if this DB is purely for public content.
        // If auth is strictly handled by supabaseOld, these can be removed from here.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});
