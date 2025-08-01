import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";

const supabaseUrl = "https://guseqyxrqxocgykrirsz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1c2VxeXhycXhvY2d5a3JpcnN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMzEwMzcsImV4cCI6MjA2NzcwNzAzN30.I8QsbX3Z-KTYNJKrDH6Qt0kofdv7QhnfZs8WHTydfKQ";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);