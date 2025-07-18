import { Octokit } from "@octokit/rest";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const REPO = "vitsaids"; // replace with your repo
const OWNER = "theshubhamgundu"; // replace with your GitHub username
const BRANCH = "main";

// Octokit client
const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Helper to get export name
const getExportName = (folder: string) => {
  switch (folder) {
    case "gallery": return "gallery";
    case "events": return "events";
    case "faculty": return "faculty";
    case "placements": return "placements";
    default: return "data";
  }
};

// Uploads a single image and updates metadata file
export async function uploadToGitHub({
  folder,
  imageFile,
  metadata,
}: {
  folder: string;
  imageFile: File;
  metadata: Record<string, any>;
}) {
  try {
    // 1. Upload image
    const arrayBuffer = await imageFile.arrayBuffer();
    const content = Buffer.from(arrayBuffer).toString("base64");
    const imageFileName = `${Date.now()}-${imageFile.name}`;
    const imagePath = `public/${folder}/${imageFileName}`;

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: imagePath,
      message: `Upload ${imageFileName} to ${folder}`,
      content,
      branch: BRANCH,
    });

    console.log("✅ Image uploaded to GitHub:", imagePath);

    // 2. Update metadata file
    const metadataFilePath = `data/${folder}.ts`; // Or use `.json` if switching to JSON
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
    } catch (err: any) {
      // File doesn't exist
      existingContent = `export const ${exportName} = []`;
    }

    // Add image path to metadata
    metadata.image = `/${folder}/${imageFileName}`;

    // Inject into existing content safely
    const trimmedContent = existingContent.trim();
    const lastBracketIndex = trimmedContent.lastIndexOf("]");

    const newContent =
      trimmedContent.slice(0, lastBracketIndex) +
      `,\n  ${JSON.stringify(metadata, null, 2)}\n` +
      trimmedContent.slice(lastBracketIndex);

    // 3. Upload updated metadata file
    const updatedBase64Content = Buffer.from(newContent).toString("base64");

    // Get the SHA of the file if it exists
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
      // File doesn't exist — sha stays undefined
    }

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: metadataFilePath,
      message: `Update metadata for ${folder}`,
      content: updatedBase64Content,
      branch: BRANCH,
      sha,
    });

    console.log("✅ Metadata file updated:", metadataFilePath);
    return { success: true };
  } catch (error) {
    console.error("❌ GitHub upload failed:", error);
    return { success: false, error };
  }
}
