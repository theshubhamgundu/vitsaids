// pages/api/upload-content/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false, // Required for formidable
  },
};

const SECTION_PATHS: Record<string, string> = {
  gallery: 'public/gallery',
  events: 'public/events',
  faculty: 'public/faculty',
  placements: 'public/placements',
};

const JSON_PATHS: Record<string, string> = {
  gallery: 'src/data/gallery.json',
  events: 'src/data/events.json',
  faculty: 'src/data/faculty.json',
  placements: 'src/data/placements.json',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const form = new formidable.IncomingForm();
  form.uploadDir = '/tmp';
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Form parsing error' });

    const section = fields.section?.[0];
    const title = fields.title?.[0];
    const description = fields.description?.[0];
    const file = files.image?.[0];

    if (!section || !title || !description || !file) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    if (!SECTION_PATHS[section]) {
      return res.status(400).json({ error: 'Invalid section' });
    }

    const publicDir = path.join(process.cwd(), SECTION_PATHS[section]);
    const jsonPath = path.join(process.cwd(), JSON_PATHS[section]);

    // Ensure folder exists
    fs.mkdirSync(publicDir, { recursive: true });

    // Move file to public/section/
    const fileName = `${Date.now()}_${file.originalFilename}`;
    const newFilePath = path.join(publicDir, fileName);
    fs.copyFileSync(file.filepath, newFilePath);

    // Build metadata entry
    const newItem = {
      title,
      description,
      imageUrl: `/${section}/${fileName}`,
      uploadedAt: new Date().toISOString(),
    };

    // Update JSON file
    const data = fs.existsSync(jsonPath) ? JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) : [];
    data.unshift(newItem); // Add to top
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

    return res.status(200).json({ success: true, data: newItem });
  });
}
