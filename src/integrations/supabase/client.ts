import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://guseqyxrqxocgykrirsz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1c2VxeXhycXhvY2d5a3JpcnN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMzEwMzcsImV4cCI6MjA2NzcwNzAzN30.I8QsbX3Z-KTYNJKrDH6Qt0kofdv7QhnfZs8WHTydfKQ'; // Truncated

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // ✅ Add this line
  },
});
