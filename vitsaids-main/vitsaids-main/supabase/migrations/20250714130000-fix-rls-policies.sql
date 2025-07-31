-- Fix RLS policies for admin access to all content tables
-- This migration ensures admin users can perform CRUD operations on all tables

-- Enable RLS on all content tables if not already enabled
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage faculty" ON public.faculty;
DROP POLICY IF EXISTS "Admins can manage placements" ON public.placements;
DROP POLICY IF EXISTS "Admins can manage achievements" ON public.achievements;
DROP POLICY IF EXISTS "Admins can manage gallery" ON public.gallery;

-- Create comprehensive admin policies for events table
CREATE POLICY "Admins can manage events" ON public.events
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'admin'
        )
    );

-- Create comprehensive admin policies for faculty table
CREATE POLICY "Admins can manage faculty" ON public.faculty
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'admin'
        )
    );

-- Create comprehensive admin policies for placements table
CREATE POLICY "Admins can manage placements" ON public.placements
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'admin'
        )
    );

-- Create comprehensive admin policies for achievements table
CREATE POLICY "Admins can manage achievements" ON public.achievements
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'admin'
        )
    );

-- Create comprehensive admin policies for gallery table
CREATE POLICY "Admins can manage gallery" ON public.gallery
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'admin'
        )
    );

-- Allow public read access to all content tables
CREATE POLICY "Public can view events" ON public.events
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Public can view faculty" ON public.faculty
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Public can view placements" ON public.placements
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Public can view achievements" ON public.achievements
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Public can view gallery" ON public.gallery
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Ensure admin profile exists for admin user
INSERT INTO public.user_profiles (id, role, status, student_name, email)
SELECT 
  u.id,
  'admin',
  'approved',
  'Admin User',
  u.email
FROM auth.users u
WHERE u.email = 'admin@vignanits.ac.in'
AND NOT EXISTS (
  SELECT 1 FROM public.user_profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  status = 'approved',
  email = EXCLUDED.email; 