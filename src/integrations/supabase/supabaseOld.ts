// src/integrations/supabase/supabaseOld.ts
import { createClient } from '@supabase/supabase-js';
import type { Database as OldDatabase } from './oldDbTypes';

// Use NEXT_PUBLIC_ for the old database (assuming this is your primary application DB)
const OLD_SUPABASE_URL = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const OLD_SUPABASE_KEY = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!OLD_SUPABASE_URL || !OLD_SUPABASE_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY for supabaseOld.');
}

export const supabaseOld = createClient<OldDatabase>(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);
