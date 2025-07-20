import { Octokit } from "@octokit/rest";

const owner = "theshubhamgundu";
const repo = "vitsaids";
const branch = "main";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // set this in Vercel env vars
});

/**
 * Uploads a file (e.g., image) to a GitHub repo path like `public/gallery/image.jpg`
 */
export async function uploadToGitHubRepo(file: File, path: string) {
  try {
    const buffer = await file.arrayBuffer();
    const contentEncoded = Buffer.from(buffer).toString("base64");

    let sha: string | undefined = undefined;

    try {
      const existing = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });
      sha = (existing.data as any).sha;
    } catch {
      sha = undefined; // file doesn't exist
    }

    const res = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Upload ${path}`,
      content: contentEncoded,
      branch,
      ...(sha && { sha }),
    });

    return {
      success: true,
      message: "File uploaded successfully",
      downloadUrl: res.data.content?.download_url ?? null,
    };
  } catch (err: any) {
    console.error("Upload error:", err);
    return {
      success: false,
      message: err.message || "Upload failed",
    };
  }
}

/**
 * Updates a JSON metadata file like `src/data/gallery.json` with a new entry
 */
export async function updateJsonMetadataFile<T = any>(
  newEntry: T,
  jsonPath: string
) {
  try {
    const res = await octokit.repos.getContent({
      owner,
      repo,
      path: jsonPath,
      ref: branch,
    });

    const existingSha = (res.data as any).sha;
    const existingData = Buffer.from((res.data as any).content, "base64").toString();
    const parsed = JSON.parse(existingData);

    const updated = [...parsed, newEntry];
    const updatedContent = Buffer.from(JSON.stringify(updated, null, 2)).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: jsonPath,
      message: `Update ${jsonPath}`,
      content: updatedContent,
      sha: existingSha,
      branch,
    });

    return { success: true, message: "Metadata updated" };
  } catch (err: any) {
    console.error("Update error:", err);
    return { success: false, message: err.message || "Update failed" };
  }
}

/**
 * Fetches and parses JSON from GitHub like `src/data/gallery.json`
 */
export async function fetchAndParseJsonFile<T = any[]>(jsonPath: string): Promise<T | null> {
  try {
    const res = await octokit.repos.getContent({
      owner,
      repo,
      path: jsonPath,
      ref: branch,
    });

    const content = Buffer.from((res.data as any).content, "base64").toString();
    return JSON.parse(content);
  } catch (err) {
    console.error(`Failed to fetch ${jsonPath}:`, err);
    return null;
  }
}
