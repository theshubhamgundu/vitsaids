// src/pages/api/upload-content.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
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

  const { fileBase64, title, description, type } = req.body;

  if (!fileBase64 || !title || !type) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const fileBuffer = Buffer.from(fileBase64.split(',')[1], 'base64');
    const fileExt = fileBase64.substring(fileBase64.indexOf('/') + 1, fileBase64.indexOf(';'));
    const fileName = `${uuidv4()}.${fileExt}`;
    const bucket = type; // gallery | events | faculty | placements | achievements

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(`${fileName}`, fileBuffer, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    const publicUrl = publicUrlData.publicUrl;

    const metadata = {
      id: uuidv4(),
      title,
      description,
      image: publicUrl,
      created_at: new Date().toISOString(),
    };

    const table = `public_${type}`; // Example: public_gallery, public_events...

    const { error: insertError } = await supabase.from(table).insert([metadata]);

    if (insertError) throw insertError;

    return res.status(200).json({ message: 'Uploaded successfully', data: metadata });
  } catch (err: any) {
    return res.status(500).json({ message: 'Upload failed', error: err.message });
  }
}
