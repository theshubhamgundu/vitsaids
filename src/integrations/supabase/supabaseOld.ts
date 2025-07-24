// src/integrations/supabase/supabaseOld.ts
import { createClient } from '@supabase/supabase-js';
import type { Database as OldDatabase } from './oldDbTypes';

// Use NEXT_PUBLIC_ for the old database.
// Added a fallback to process.env in case import.meta.env isn't resolving them.
const OLD_SUPABASE_URL =
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL; // Added process.env fallback

const OLD_SUPABASE_KEY =
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Added process.env fallback

if (!OLD_SUPABASE_URL || !OLD_SUPABASE_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY for supabaseOld.');
}

export const supabaseOld = createClient<OldDatabase>(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);
