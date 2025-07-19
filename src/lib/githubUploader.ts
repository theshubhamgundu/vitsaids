import { Octokit } from "octokit";

// GitHub config
const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN!;
const OWNER = "theshubhamgundu";
const REPO = "vitsaids"; // This is the repo name only, NOT the full URL
const BRANCH = "main";

// Create Octokit client
const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Get named export for data array
const getExportName = (folder: string) => {
  switch (folder) {
    case "gallery": return "gallery";
    case "events": return "events";
    case "faculty": return "faculty";
    case "placements": return "placements";
    default: return "data";
  }
};

// ✅ MAIN FUNCTION: Upload image and append metadata
export async function uploadImageAndAppendData({
  folder,
  imageFile,
  metadata,
}: {
  folder: string;
  imageFile: File;
  metadata: Record<string, any>;
}) {
  try {
    // 1. Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const content = Buffer.from(arrayBuffer).toString("base64");
    const imageFileName = `${Date.now()}-${imageFile.name}`;
    const imagePath = `public/${folder}/${imageFileName}`;

    // 2. Upload image to GitHub
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: imagePath,
      message: `Upload ${imageFileName} to ${folder}`,
      content,
      branch: BRANCH,
    });

    console.log("✅ Image uploaded to GitHub:", imagePath);

    // 3. Update metadata file
    const metadataFilePath = `data/${folder}.ts`;
    const exportName = getExportName(folder);

    let existingContent: string;

    try {
      const { data: existingFile } = await octokit.rest.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: metadataFilePath,
        ref: BRANCH,
      });

      const decoded = Buffer.from(
        (existingFile as any).content,
        "base64"
      ).toString("utf-8");

      existingContent = decoded;
    } catch {
      existingContent = `export const ${exportName} = []`;
    }

    // 4. Inject image path into metadata
    metadata.image = `/${folder}/${imageFileName}`;

    const trimmed = existingContent.trim();
    const insertIndex = trimmed.lastIndexOf("]");

    const newContent =
      trimmed.slice(0, insertIndex) +
      `,\n  ${JSON.stringify(metadata, null, 2)}\n` +
      trimmed.slice(insertIndex);

    const updatedBase64 = Buffer.from(newContent).toString("base64");

    let sha: string | undefined = undefined;
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: metadataFilePath,
        ref: BRANCH,
      });

      sha = (data as any).sha;
    } catch {
      // File doesn't exist, that's okay
    }

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: metadataFilePath,
      message: `Update metadata for ${folder}`,
      content: updatedBase64,
      branch: BRANCH,
      sha,
    });

    console.log("✅ Metadata updated:", metadataFilePath);
    return { success: true };
  } catch (error) {
    console.error("❌ GitHub upload failed:", error);
    return { success: false, error };
  }
}
