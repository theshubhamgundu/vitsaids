// src/pages/api/upload-content.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseNew } from '@/integrations/supabase/supabaseNew';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { fileBase64, title, description, type, access_token } = req.body;

  if (!fileBase64 || !title || !type || !access_token) {
    return res.status(400).json({ message: 'Missing required fields (fileBase64, title, type, access_token)'});
  }
  // Enforce session setting before any Supabase DB/storage action
  const { setSupabaseNewSession } = await import('@/integrations/supabase/supabaseNew');
  await setSupabaseNewSession(access_token);

  try {
    const fileBuffer = Buffer.from(fileBase64.split(',')[1], 'base64');
    const fileExt = fileBase64.substring(fileBase64.indexOf('/') + 1, fileBase64.indexOf(';'));
    const fileName = `${uuidv4()}.${fileExt}`;
    const bucket = type; // gallery | events | faculty | placements | achievements

    const { data, error } = await supabaseNew.storage
      .from(bucket)
      .upload(`${fileName}`, fileBuffer, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabaseNew.storage.from(bucket).getPublicUrl(fileName);
    const publicUrl = publicUrlData.publicUrl;

    let table: string;
    let metadata: Record<string, any>;
    switch (type) {
      case 'gallery':
        table = 'gallery';
        metadata = {
          id: uuidv4(),
          title,
          description,
          image_url: publicUrl,
          created_at: new Date().toISOString(),
        };
        break;
      case 'events':
        table = 'events';
        metadata = {
          id: uuidv4(),
          title,
          description,
          image_url: publicUrl,
          created_at: new Date().toISOString(),
          date: null,
          time: null,
          venue: null,
        };
        break;
      case 'faculty':
        table = 'faculty';
        metadata = {
          id: uuidv4(),
          name: title,
          designation: description,
          position: null,
          image_url: publicUrl,
          created_at: new Date().toISOString(),
        };
        break;
      case 'placements':
        table = 'placements';
        metadata = {
          id: uuidv4(),
          student_name: title,
          company: description,
          ctc: null,
          image_url: publicUrl,
          created_at: new Date().toISOString(),
        };
        break;
      default:
        return res.status(400).json({ message: 'Invalid content type' });
    }

    const { error: insertError } = await supabaseNew.from(table).insert([metadata as any]);
    if (insertError) throw insertError;
    return res.status(200).json({ message: 'Uploaded successfully', data: metadata });
  } catch (err: any) {
    return res.status(500).json({ message: 'Upload failed', error: err.message });
  }
}
