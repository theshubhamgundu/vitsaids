// utils/supabase-upload.ts
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

type ContentType = 'gallery' | 'events' | 'faculty' | 'placements' | 'achievements';

export async function uploadContent({
  file,
  title,
  description,
  type,
}: {
  file: File;
  title: string;
  description: string;
  type: ContentType;
}) {
  const id = uuidv4();
  const filePath = `uploads/${id}-${file.name}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage.from(type).upload(filePath, file);
  if (uploadError) throw new Error('Upload failed: ' + uploadError.message);

  // Get public URL
  const { data: urlData } = supabase.storage.from(type).getPublicUrl(filePath);
  const public_url = urlData?.publicUrl;
  if (!public_url) throw new Error('Failed to get public URL');

  // Insert metadata into correct table
  const { error: dbError } = await supabase.from(`${type}_metadata`).insert([
    {
      id,
      title,
      description,
      image_url: public_url,
      uploaded_at: new Date().toISOString(),
    },
  ]);

  if (dbError) throw new Error('Database error: ' + dbError.message);

  return { id, public_url };
}
