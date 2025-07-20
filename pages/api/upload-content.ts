// pages/api/upload-content.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { Readable } from 'stream';
import formidable from 'formidable';
import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';
import { Buffer } from 'buffer'; // ✅ FIXED: Explicit Buffer import

export const config = {
  api: {
    bodyParser: false,
  },
};

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const REPO_OWNER = 'theshubhamgundu';
const REPO_NAME = 'vitsaids';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Form parse error' });

    const section = fields.section?.[0];
    const title = fields.title?.[0];
    const description = fields.description?.[0];
    const file = files.image?.[0];

    if (!section || !title || !file) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const filePath = file.filepath;
    const imageBuffer = fs.readFileSync(filePath);
    const fileExt = path.extname(file.originalFilename || '');
    const fileName = `${Date.now()}-${title.replace(/\s+/g, '-').toLowerCase()}${fileExt}`;
    const githubImagePath = `public/${section}/${fileName}`;
    const imageBase64 = imageBuffer.toString('base64');

    try {
      // Upload image
      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: githubImagePath,
        message: `Add ${section} image: ${fileName}`,
        content: imageBase64,
      });

      // Update metadata JSON
      const jsonPath = `src/data/${section}.json`;
      const { data: fileData } = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: jsonPath,
      });

      const existingContent = Buffer.from((fileData as any).content, 'base64').toString();
      const json = JSON.parse(existingContent);

      json.push({
        title,
        description,
        image: `/${section}/${fileName}`, // ✅ fixed public URL path
        createdAt: new Date().toISOString(),
      });

      const updatedContent = Buffer.from(JSON.stringify(json, null, 2)).toString('base64');

      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: jsonPath,
        message: `Update ${section}.json with ${fileName}`,
        content: updatedContent,
        sha: (fileData as any).sha,
      });

      res.status(200).json({ success: true, fileName });
    } catch (e) {
      console.error('[UPLOAD ERROR]', e);
      res.status(500).json({ error: 'GitHub upload failed' });
    }
  });
}
