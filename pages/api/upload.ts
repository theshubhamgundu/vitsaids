// pages/api/upload.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { uploadImageAndAppendData } from '@/server/githubUploader';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // for image uploads
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, title, description, base64Image, filename, extraFields } = req.body;

  if (!type || !title || !description || !base64Image || !filename) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const data = await uploadImageAndAppendData({
      type,
      filename,
      base64Image,
      metadata: {
        title,
        description,
        ...(extraFields || {}), // like company, year, faculty details, etc.
      },
    });

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed', details: error.message });
  }
}
