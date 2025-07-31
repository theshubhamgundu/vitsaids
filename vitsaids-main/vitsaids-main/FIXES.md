# 🔧 Department Management System - Fixes Applied

## Issues Identified and Fixed

### 1. Multiple GoTrueClient Instances ❌ → ✅ Fixed

**Problem**: The app was creating multiple Supabase authentication clients, causing conflicts and warnings.

**Solution**: 
- Consolidated all Supabase client imports to use `supabaseOld` consistently
- Updated `client.ts` to re-export `supabaseOld` instead of creating a new client
- Fixed imports in all components to use the same client instance

**Files Modified**:
- `src/integrations/supabase/client.ts` - Now re-exports supabaseOld
- `src/components/UploadCertificationModal.tsx` - Updated import
- `src/components/ResultsSection.tsx` - Updated import  
- `src/components/CertificationsSection.tsx` - Updated import

### 2. Row-Level Security (RLS) Policy Violations ❌ → ✅ Fixed

**Problem**: Database tables had RLS enabled but lacked proper policies for admin operations, causing 401 errors.

**Solution**: Created comprehensive RLS policies that allow:
- Admin users to perform all CRUD operations on content tables
- Public read access to all content
- Proper authentication checks for admin operations

**Migration Created**: `supabase/migrations/20250714130000-fix-rls-policies.sql`

**Policies Added**:
- `events` table: Full admin access + public read
- `faculty` table: Full admin access + public read
- `placements` table: Full admin access + public read
- `achievements` table: Full admin access + public read
- `gallery` table: Full admin access + public read

### 3. Authentication Issues ❌ → ✅ Fixed

**Problem**: Admin user couldn't perform operations due to missing user profile and RLS policies.

**Solution**: 
- Ensured admin profile creation in migration
- Fixed RLS policies to properly check admin role
- Consolidated authentication client usage

## How to Apply the Database Fixes

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20250714130000-fix-rls-policies.sql`
4. Execute the SQL script

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push
```

### Option 3: Manual SQL Execution

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Enable RLS on all content tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- Create admin policies for events
CREATE POLICY "Admins can manage events" ON public.events
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create admin policies for faculty
CREATE POLICY "Admins can manage faculty" ON public.faculty
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create admin policies for placements
CREATE POLICY "Admins can manage placements" ON public.placements
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create admin policies for achievements
CREATE POLICY "Admins can manage achievements" ON public.achievements
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create admin policies for gallery
CREATE POLICY "Admins can manage gallery" ON public.gallery
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- Allow public read access
CREATE POLICY "Public can view events" ON public.events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can view faculty" ON public.faculty FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can view placements" ON public.placements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can view achievements" ON public.achievements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can view gallery" ON public.gallery FOR SELECT TO anon, authenticated USING (true);

-- Ensure admin profile exists
INSERT INTO public.user_profiles (id, role, status, student_name, email)
SELECT u.id, 'admin', 'approved', 'Admin User', u.email
FROM auth.users u
WHERE u.email = 'admin@vignanits.ac.in'
AND NOT EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  status = 'approved',
  email = EXCLUDED.email;
```

## Environment Variables Required

Make sure you have these environment variables set in your `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_URL=your_new_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_supabase_anon_key
```

## Testing the Fixes

After applying the database fixes:

1. **Login as Admin**: Use `admin@vignanits.ac.in` with your admin password
2. **Test Content Management**: Try adding events, faculty, placements, achievements, and gallery items
3. **Check Console**: No more GoTrueClient warnings or 401 errors
4. **Verify Public Access**: Content should be visible to all users

## Expected Results

✅ No more "Multiple GoTrueClient instances" warnings  
✅ No more 401 Unauthorized errors  
✅ Admin can successfully add/edit/delete content  
✅ Public users can view all content  
✅ Authentication flows work smoothly  

## Troubleshooting

If you still see issues:

1. **Clear browser cache and local storage**
2. **Check that the migration ran successfully**
3. **Verify admin profile exists in `user_profiles` table**
4. **Ensure environment variables are correct**
5. **Check Supabase logs for any remaining errors**

## Files Modified Summary

- ✅ `src/integrations/supabase/client.ts` - Fixed multiple client instances
- ✅ `src/components/UploadCertificationModal.tsx` - Updated import
- ✅ `src/components/ResultsSection.tsx` - Updated import
- ✅ `src/components/CertificationsSection.tsx` - Updated import
- ✅ `supabase/migrations/20250714130000-fix-rls-policies.sql` - New RLS policies
- ✅ `FIXES.md` - This documentation file 