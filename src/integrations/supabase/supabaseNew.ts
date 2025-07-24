// src/integrations/supabase/supabaseNew.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types'; // Assuming 'types' is correct and exists

const SUPABASE_URL =
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://guseqyxrqxocgykrirsz.supabase.co'; // Fallback URL for development, ensure your .env variables are set for production

const SUPABASE_ANON_KEY =
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'YOUR_ACTUAL_SUPABASE_ANON_KEY_HERE'; // Make sure to replace this placeholder with your actual key for the NEW DB

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables for supabaseNew');
}

// FIX: Export the client as 'supabaseNew'
export const supabaseNew = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // These auth settings might not be necessary if this client is purely for public content (non-auth tables)
    // and if auth is handled exclusively by supabaseOld.
    // However, keeping them won't hurt if both databases somehow interact with auth.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
