import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File as FormidableFile } from "formidable";
import fs from "fs";
import { Octokit } from "octokit";
import sharp from "sharp";

export const config = {
  api: {
    bodyParser: false,
  },
};

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const REPO_OWNER = "theshubhamgundu";
const REPO_NAME = "vitsaids";
const BRANCH = "main";
const octokit = new Octokit({ auth: GITHUB_TOKEN });

const getFileSHA = async (path: string) => {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path,
      ref: BRANCH,
    });
    if (!("sha" in data)) return null;
    return data.sha;
  } catch (error) {
    if ((error as any).status !== 404) {
      console.error("SHA fetch error for", path, error);
    }
    return null;
  }
};

const uploadToGitHub = async ({
  path,
  content,
  message,
}: {
  path: string;
  content: string;
  message: string;
}) => {
  const sha = await getFileSHA(path);
  await octokit.rest.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path,
    message,
    content,
    sha: sha ?? undefined,
    branch: BRANCH,
  });
};

const uploadImageAndAppendData = async (
  githubPath: string,
  jsonPath: string,
  file: FormidableFile,
  metadata: any
): Promise<{ success: boolean; message: string }> => {
  try {
    const buffer = await fs.promises.readFile(file.filepath);
    const optimized = await sharp(buffer).resize({ width: 1200 }).webp({ quality: 80 }).toBuffer();

    const fileName = `${Date.now()}.webp`;
    const imagePath = `${githubPath}/${fileName}`;

    await uploadToGitHub({
      path: imagePath,
      content: optimized.toString("base64"),
      message: `Add image: ${fileName}`,
    });

    let existingData: any[] = [];
    let sha: string | undefined = undefined;

    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: jsonPath,
        ref: BRANCH,
      });
      if ("content" in data) {
        const decoded = Buffer.from(data.content, "base64").toString("utf-8");
        existingData = JSON.parse(decoded);
        sha = data.sha;
      }
    } catch (err: any) {
      if (err.status !== 404) throw err;
    }

    const publicUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${imagePath}`;
    const newEntry = { ...metadata, image: publicUrl };
    const updatedData = [newEntry, ...existingData];

    await uploadToGitHub({
      path: jsonPath,
      content: Buffer.from(JSON.stringify(updatedData, null, 2)).toString("base64"),
      message: `Update metadata: ${fileName}`,
    });

    return { success: true, message: `Upload successful` };
  } catch (error) {
    console.error(`Upload failed:`, error);
    return { success: false, message: "Upload failed" };
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method Not Allowed" });

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ success: false, message: "Form parsing failed" });
    }

    const githubPath = fields.githubPath?.[0] || fields.githubPath;
    const jsonPath = fields.jsonPath?.[0] || fields.jsonPath;
    const metadataRaw = fields.metadata?.[0] || fields.metadata;
    const file = files.imageFile || files.image || files.file;

    if (!githubPath || !jsonPath || !metadataRaw || !file) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    let metadata;
    try {
      metadata = typeof metadataRaw === "string" ? JSON.parse(metadataRaw) : metadataRaw;
    } catch {
      return res.status(400).json({ success: false, message: "Invalid metadata JSON" });
    }

    const fileData = Array.isArray(file) ? file[0] : file;

    const result = await uploadImageAndAppendData(githubPath, jsonPath, fileData, metadata);
    return res.status(result.success ? 200 : 500).json(result);
  });
}
