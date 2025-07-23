import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File as FormidableFile } from "formidable";
import fs from "fs";
import { Octokit } from "octokit";

// Disable default body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

// GitHub setup
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const REPO_OWNER = "theshubhamgundu";
const REPO_NAME = "vitsaids";
const BRANCH = "main";
const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Dynamic path resolver
const getPaths = (type: string) => {
  switch (type) {
    case "gallery":
      return { folder: "public/gallery/", dataPath: "src/data/gallery.json" };
    case "events":
      return { folder: "public/events/", dataPath: "src/data/events.json" };
    case "faculty":
      return { folder: "public/faculty/", dataPath: "src/data/faculty.json" };
    case "placements":
      return { folder: "public/placements/", dataPath: "src/data/placements.json" };
    case "achievements":
      return { folder: "public/achievements/", dataPath: "src/data/achievements.json" };
    default:
      throw new Error("Invalid content type");
  }
};

// Helper to fetch SHA for updates
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
    console.error("SHA fetch error for", path, error);
    return null;
  }
};

// Upload file or JSON to GitHub
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

// Main upload logic
const uploadImageAndAppendData = async (
  type: string,
  file: FormidableFile,
  metadata: any
): Promise<{ success: boolean; message: string }> => {
  try {
    const { folder, dataPath } = getPaths(type);

    const buffer = await fs.promises.readFile(file.filepath);
    const ext = file.originalFilename?.split(".").pop() || "jpg";
    const fileName = `${Date.now()}.${ext}`;
    const imagePath = `${folder}${fileName}`;

    // Upload image to GitHub
    await uploadToGitHub({
      path: imagePath,
      content: buffer.toString("base64"),
      message: `Add ${type} image: ${fileName}`,
    });

    // Fetch and update metadata JSON
    const existingRes = await octokit.rest.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: dataPath,
      ref: BRANCH,
    });

    const jsonSha = "sha" in existingRes.data ? existingRes.data.sha : undefined;
    const jsonContent = "content" in existingRes.data ? existingRes.data.content : undefined;

    const existingData = jsonContent
      ? JSON.parse(Buffer.from(jsonContent, "base64").toString("utf-8"))
      : [];

    const publicUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${imagePath}`;
    const newEntry = { ...metadata, image: publicUrl };
    const updatedData = [newEntry, ...existingData];

    await uploadToGitHub({
      path: dataPath,
      content: Buffer.from(JSON.stringify(updatedData, null, 2)).toString("base64"),
      message: `Update ${type} metadata`,
    });

    return { success: true, message: `${type} uploaded successfully` };
  } catch (error) {
    console.error(`Upload failed for ${type}:`, error);
    return { success: false, message: "Upload failed" };
  }
};

// API Handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("Received method:", req.method);

  // Optional CORS (useful if called from external client)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Preflight
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ success: false, message: "Form parsing failed" });
    }

    const type = fields.type?.[0] || fields.type;
    const metadataRaw = fields.metadata?.[0] || fields.metadata;
    const file = files.image || files.file;

    if (!type || !metadataRaw || !file) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    let metadata;
    try {
      metadata = typeof metadataRaw === "string" ? JSON.parse(metadataRaw) : metadataRaw;
    } catch {
      return res.status(400).json({ success: false, message: "Invalid metadata JSON" });
    }

    const fileData = Array.isArray(file) ? file[0] : file;

    const result = await uploadImageAndAppendData(type as string, fileData, metadata);
    return res.status(result.success ? 200 : 500).json(result);
  });
}
