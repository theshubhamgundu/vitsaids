// src/integrations/supabase/supabaseOld.ts
import { createClient } from '@supabase/supabase-js';
import type { Database as OldDatabase } from './oldDbTypes';

const OLD_SUPABASE_URL = import.meta.env.VITE_OLD_SUPABASE_URL!;
const OLD_SUPABASE_KEY = import.meta.env.VITE_OLD_SUPABASE_ANON_KEY!;

export const supabaseOld = createClient<OldDatabase>(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);
