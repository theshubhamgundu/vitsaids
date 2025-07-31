
-- Update user_profiles table to include student information
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS htno TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Create timetable table
CREATE TABLE IF NOT EXISTS public.timetable (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  day TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create faculty_members table
CREATE TABLE IF NOT EXISTS public.faculty_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  photo_url TEXT,
  bio TEXT,
  expertise TEXT,
  publications TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create placement_records table
CREATE TABLE IF NOT EXISTS public.placement_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  company TEXT NOT NULL,
  ctc DECIMAL(10,2),
  year INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Internship', 'Full-Time')),
  branch TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create department_events table
CREATE TABLE IF NOT EXISTS public.department_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME,
  venue TEXT,
  poster_url TEXT,
  speaker TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for timetable (read access for authenticated users, admin can modify)
CREATE POLICY "Anyone can view timetable" ON public.timetable FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage timetable" ON public.timetable FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for faculty_members (read access for all, admin can modify)
CREATE POLICY "Anyone can view faculty" ON public.faculty_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage faculty" ON public.faculty_members FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for placement_records (read access for all, admin can modify)
CREATE POLICY "Anyone can view placements" ON public.placement_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage placements" ON public.placement_records FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for department_events (read access for all, admin can modify)
CREATE POLICY "Anyone can view events" ON public.department_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage events" ON public.department_events FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.timetable;
ALTER PUBLICATION supabase_realtime ADD TABLE public.faculty_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.placement_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.department_events;
