// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  // Create a mock client to prevent crashes
  export const supabase = {
    from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
    storage: { from: () => ({ upload: () => Promise.resolve({ error: null }) }) },
    auth: { 
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: null }),
      signUp: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null })
    }
  } as any;
} else {
  export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
}