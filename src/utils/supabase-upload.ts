// utils/supabase-upload.ts
import { supabaseNew, setSupabaseNewSession } from '@/integrations/supabase/supabaseNew';
import { v4 as uuidv4 } from 'uuid';

type ContentType = 'gallery' | 'events' | 'faculty' | 'placements';

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

  // Ensure session is set for supabaseNew before insert
  // You must pass the current session/access_token from your AuthContext/provider
  // Example usage:
  // await setSupabaseNewSession(session.access_token);
  if (typeof window !== 'undefined' && window.session && window.session.access_token) {
    await setSupabaseNewSession(window.session.access_token);
  }

  // Upload to Supabase Storage
  const { error: uploadError } = await supabaseNew.storage.from(type).upload(filePath, file);
  if (uploadError) throw new Error('Upload failed: ' + uploadError.message);

  // Get public URL
  const { data: urlData } = supabaseNew.storage.from(type).getPublicUrl(filePath);
  const public_url = urlData?.publicUrl;
  if (!public_url) throw new Error('Failed to get public URL');

  let insertData;
  if (type === 'gallery') {
    insertData = {
      id,
      title,
      description,
      image_url: public_url,
      created_at: new Date().toISOString(),
    };
  } else if (type === 'events') {
    insertData = {
      id,
      title,
      description,
      image_url: public_url,
      created_at: new Date().toISOString(),
      date: null,
      time: null,
      venue: null,
    };
  } else if (type === 'faculty') {
    insertData = {
      id,
      name: title,
      designation: description,
      position: null,
      image_url: public_url,
      created_at: new Date().toISOString(),
    };
  } else if (type === 'placements') {
    insertData = {
      id,
      student_name: title,
      company: description,
      ctc: null,
      image_url: public_url,
      created_at: new Date().toISOString(),
    };
  } else {
    throw new Error('Invalid content type');
  }

  // Ensure session is set for supabaseNew before insert
  // If you have a session manager, call setSupabaseNewSession here
  // Example:
  // import { setSupabaseNewSession } from '@/integrations/supabase/supabaseNew';
  // await setSupabaseNewSession(session.access_token);

  const { error: dbError } = await supabaseNew.from(type).insert([insertData]);
  if (dbError) throw new Error('Database error: ' + dbError.message);
  return { id, public_url };
}
