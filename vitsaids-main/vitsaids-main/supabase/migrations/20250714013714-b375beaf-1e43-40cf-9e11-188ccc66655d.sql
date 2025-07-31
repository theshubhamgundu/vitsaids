-- Allow anyone to read from verified_students table for verification purposes
CREATE POLICY "Anyone can read verified students for verification" 
ON public.verified_students 
FOR SELECT 
USING (true);