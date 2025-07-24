// src/integrations/supabase/client.ts

import { createClient } from '@supabase/supabase-js';

// ✅ Use only NEXT_PUBLIC_ variables — required for frontend access in Vercel
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing AUTH Supabase environment variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
