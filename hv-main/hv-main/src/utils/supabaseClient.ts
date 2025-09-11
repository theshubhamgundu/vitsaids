// Centralized Supabase client to avoid multiple instances
import { createClient } from '@supabase/supabase-js';

// Resolve Supabase credentials from environment with fallback to provided credentials
const envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL) as string | undefined;
const envAnon = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string | undefined;

// Fallback to provided credentials if environment variables are not set
const SUPABASE_URL = envUrl || 'https://cjncvjttqufsoqayhagd.supabase.co';
const SUPABASE_ANON_KEY = envAnon || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqbmN2anR0cXVmc29xYXloYWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MTEyNzUsImV4cCI6MjA3MzA4NzI3NX0.EeOr76R3AHQoz86cy3BnQSBuTV0ZdZAjnA9povm8M3k';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase credentials');
}

// Create single Supabase client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Also export the raw values for use in API request helpers
export { SUPABASE_URL, SUPABASE_ANON_KEY };
