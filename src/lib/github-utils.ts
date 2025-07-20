import { Octokit } from "octokit";

const octokit = new Octokit({
  auth: process.env.NEXT_PUBLIC_GITHUB_TOKEN, // Store securely in Vercel/Environment vars
});

// Base configuration
const OWNER = "theshubhamgundu";
const REPO = "vitsaids";
const BRANCH = "main";

/**
 * Uploads a file to the GitHub repo at the specified path.
 * @param file - File object (image/pdf)
 * @param uploadPath - Path inside repo, e.g., "public/gallery/image1.jpg"
 */
export async function uploadToGitHubRepo(file: File, uploadPath: string) {
  try {
    const reader = new FileReader();
    const fileContent = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Get existing SHA if file exists
    let sha: string | undefined = undefined;
    try {
      const res = await octokit.rest.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: uploadPath,
        ref: BRANCH,
      });
      sha = (res.data as any).sha;
    } catch (_) {
      sha = undefined; // File doesn't exist yet
    }

    // Upload or update file
    const response = await octokit.rest.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: uploadPath,
      message: `Upload ${uploadPath}`,
      content: fileContent,
      branch: BRANCH,
      ...(sha && { sha }),
    });

    return {
      success: true,
      message: "File uploaded successfully",
      url: response.data.content?.download_url || null,
    };
  } catch (error) {
    console.error("GitHub upload error:", error);
    return {
      success: false,
      message: "Failed to upload file to GitHub",
    };
  }
}

/**
 * Fetches and parses a JSON/TS file from the repo and returns the parsed content.
 * @param filePath - Full GitHub path, e.g., "src/data/gallery.json"
 */
export async function fetchAndParseTsFile(filePath: string): Promise<any[]> {
  try {
    const res = await octokit.rest.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: filePath,
      ref: BRANCH,
    });

    if (!res || !res.data || !("content" in res.data)) {
      console.error("Invalid response from GitHub:", res);
      return [];
    }

    const content = Buffer.from((res.data as any).content, "base64").toString("utf-8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to fetch GitHub file:", error);
    return [];
  }
}
