// server/githubUploader.ts

import { Octokit } from "@octokit/rest";
import { createOrUpdateTextFile } from "@octokit/plugin-create-or-update-text-file";
import { Buffer } from "buffer";
import sharp from "sharp";

const MyOctokit = Octokit.plugin(createOrUpdateTextFile);

const octokit = new MyOctokit({
  auth: process.env.GITHUB_TOKEN,
});

const REPO_OWNER = "theshubhamgundu";
const REPO_NAME = "vitsaids";
const BRANCH = "main";

const folderMap = {
  gallery: {
    imagePath: "public/gallery/",
    dataPath: "src/data/gallery.ts",
  },
  events: {
    imagePath: "public/events/",
    dataPath: "src/data/events.ts",
  },
  faculty: {
    imagePath: "public/faculty/",
    dataPath: "src/data/faculty.ts",
  },
  placements: {
    imagePath: "public/placements/",
    dataPath: "src/data/placements.ts",
  },
} as const;

type UploadType = keyof typeof folderMap;

type Metadata = Record<string, any>;

export async function uploadImageAndAppendData(
  type: UploadType,
  file: File,
  metadata: Metadata
): Promise<{ success: boolean; message: string }> {
  try {
    const folderInfo = folderMap[type];
    const timestamp = Date.now();
    const filename = `${type}_${timestamp}.webp`;
    const imagePath = `${folderInfo.imagePath}${filename}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const optimizedBuffer = await sharp(buffer)
      .resize(1200)
      .webp({ quality: 80 })
      .toBuffer();

    const base64Image = optimizedBuffer.toString("base64");

    // Upload the image
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: imagePath,
      message: `upload: ${filename}`,
      content: base64Image,
      branch: BRANCH,
    });

    // Update metadata file
    await octokit.createOrUpdateTextFile({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: folderInfo.dataPath,
      branch: BRANCH,
      message: `append: ${type} - ${filename}`,
      async update(existingContent: string | undefined): Promise<string> {
        let items: any[] = [];

        if (existingContent?.includes("export const")) {
          const jsonRaw = existingContent.split("=")[1]?.trim();
          const clean = jsonRaw.replace(/;$/, "");
          items = JSON.parse(clean);
        }

        items.push({ ...metadata, image: `/${type}/${filename}` });

        return `export const ${type} = ${JSON.stringify(items, null, 2)};`;
      },
    });

    return { success: true, message: "Upload successful" };
  } catch (error: any) {
    console.error("Upload Error:", error);
    return { success: false, message: error.message || "Unknown error" };
  }
}
