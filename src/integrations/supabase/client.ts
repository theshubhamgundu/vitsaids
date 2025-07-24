import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// 🎓 Old Supabase: for auth and dashboard
const AUTH_SUPABASE_URL = process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL!;
const AUTH_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY!;

// 🖼️ New Supabase: for uploads
const UPLOAD_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const UPLOAD_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!AUTH_SUPABASE_URL || !AUTH_SUPABASE_ANON_KEY) {
  throw new Error('Missing AUTH Supabase environment variables');
}

if (!UPLOAD_SUPABASE_URL || !UPLOAD_SUPABASE_ANON_KEY) {
  throw new Error('Missing UPLOAD Supabase environment variables');
}

// 🧠 Main (auth/dashboard) Supabase client
export const supabase = createClient<Database>(AUTH_SUPABASE_URL, AUTH_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// 📦 Upload Supabase client (for gallery/events/etc.)
export const supabaseUpload = createClient(UPLOAD_SUPABASE_URL, UPLOAD_SUPABASE_ANON_KEY);
console.log('AUTH SUPABASE URL:', process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL);
console.log('AUTH SUPABASE KEY:', process.env.NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY);
