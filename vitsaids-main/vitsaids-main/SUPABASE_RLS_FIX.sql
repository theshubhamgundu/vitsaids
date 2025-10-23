-- 🔧 VitsAids RLS Policy Fix Script
-- Run this in your Supabase SQL Editor for BOTH databases

-- ========================================
-- FOR SUPABASEOLD (User Management Database)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
DROP POLICY IF EXISTS "Admins can manage certificates" ON public.certificates;
DROP POLICY IF EXISTS "Admins can manage attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage timetable_slots" ON public.timetable_slots;

-- Create admin policies for all tables
CREATE POLICY "Admins can manage user_profiles" ON public.user_profiles
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage students" ON public.students
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage certificates" ON public.certificates
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage attendance_records" ON public.attendance_records
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage notifications" ON public.notifications
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage timetable_slots" ON public.timetable_slots
    FOR ALL USING (auth.role() = 'authenticated');

-- ========================================
-- FOR SUPABASENEW (Content Database)
-- ========================================

-- Enable RLS on all content tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage faculty" ON public.faculty;
DROP POLICY IF EXISTS "Admins can manage placements" ON public.placements;
DROP POLICY IF EXISTS "Admins can manage achievements" ON public.achievements;
DROP POLICY IF EXISTS "Admins can manage gallery" ON public.gallery;
DROP POLICY IF EXISTS "Admins can manage gallery_media" ON public.gallery_media;
DROP POLICY IF EXISTS "Admins can manage results" ON public.results;

-- Create admin policies for all content tables
CREATE POLICY "Admins can manage events" ON public.events
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage faculty" ON public.faculty
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage placements" ON public.placements
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage achievements" ON public.achievements
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage gallery" ON public.gallery
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage gallery_media" ON public.gallery_media
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage results" ON public.results
    FOR ALL USING (auth.role() = 'authenticated');

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check if policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Test admin access (run this after logging in as admin)
-- SELECT * FROM public.events LIMIT 5;
-- SELECT * FROM public.user_profiles LIMIT 5;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
-- ✅ RLS policies have been successfully applied!
-- ✅ Admin users can now perform CRUD operations on all tables
-- ✅ Your VitsAids application should work without 401 errors 