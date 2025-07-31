
-- First, let's check if we need to update the user_profiles table structure
-- The table currently has 'ht_no' but the code expects 'htno'
-- The table currently has 'year' as text but the code expects it as integer

-- Add the missing columns with correct names if they don't exist
DO $$ 
BEGIN
    -- Add htno column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'htno') THEN
        ALTER TABLE public.user_profiles ADD COLUMN htno text;
    END IF;
    
    -- Migrate data from ht_no to htno if ht_no exists and htno is empty
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'ht_no') THEN
        UPDATE public.user_profiles SET htno = ht_no WHERE htno IS NULL AND ht_no IS NOT NULL;
    END IF;
    
    -- Add year as integer if it doesn't exist as integer
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'year' AND data_type = 'integer') THEN
        -- If year exists as text, we need to convert it
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'year' AND data_type = 'text') THEN
            -- Create a temporary column
            ALTER TABLE public.user_profiles ADD COLUMN year_int integer;
            -- Convert text to integer where possible
            UPDATE public.user_profiles SET year_int = CASE WHEN year ~ '^[0-9]+$' THEN year::integer ELSE NULL END;
            -- Drop the old column and rename the new one
            ALTER TABLE public.user_profiles DROP COLUMN year;
            ALTER TABLE public.user_profiles RENAME COLUMN year_int TO year;
        ELSE
            -- Add year as integer if it doesn't exist at all
            ALTER TABLE public.user_profiles ADD COLUMN year integer;
        END IF;
    END IF;
END $$;

-- Ensure we have proper policies for admin access
CREATE POLICY IF NOT EXISTS "Admins can read all profiles" 
  ON public.user_profiles 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can update all profiles" 
  ON public.user_profiles 
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Insert admin profile if admin user exists but has no profile
INSERT INTO public.user_profiles (id, role, status, student_name)
SELECT 
  u.id,
  'admin',
  'approved',
  COALESCE(u.raw_user_meta_data->>'name', u.email)
FROM auth.users u
WHERE u.email = 'admin@vignanits.ac.in'
AND NOT EXISTS (
  SELECT 1 FROM public.user_profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Insert student profile if student user exists but has no profile  
INSERT INTO public.user_profiles (id, role, status, student_name)
SELECT 
  u.id,
  'student', 
  'approved',
  COALESCE(u.raw_user_meta_data->>'name', u.email)
FROM auth.users u
WHERE u.email = 'student@vignanits.ac.in'
AND NOT EXISTS (
  SELECT 1 FROM public.user_profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;
