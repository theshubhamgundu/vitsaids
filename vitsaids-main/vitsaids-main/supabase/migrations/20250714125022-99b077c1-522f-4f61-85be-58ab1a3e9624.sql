-- Create the certifications storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certifications', 'certifications', true);

-- Create storage policies for certifications
CREATE POLICY "Anyone can view certifications" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'certifications');

CREATE POLICY "Users can upload their own certifications" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'certifications' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can update their own certifications" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'certifications' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can delete their own certifications" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'certifications' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);