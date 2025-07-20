// src/lib/github-utils.ts (add this to your existing file)

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
export async function uploadToGitHubRepo(file: File, path: string, commitMessage: string) {
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
    } catch (error: any) {
      // If file doesn't exist, sha remains undefined. This is fine.
      if (error.status !== 404) { // Log error only if it's not a 'Not Found' error
        console.error(`Error checking for existing file ${path}:`, error);
      }
      sha = undefined;
    }

    const res = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: commitMessage, // Use the provided commit message
      content: contentEncoded,
      branch,
      ...(sha && { sha }),
    });

    return {
      success: true,
      message: "File uploaded successfully",
      downloadUrl: res.data.content?.download_url || `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`, // Fallback to raw.githubusercontent.com URL
    };
  } catch (err: any) {
    console.error(`Upload error for ${path}:`, err);
    return {
      success: false,
      message: err.message || "Upload failed",
      downloadUrl: null,
    };
  }
}

/**
 * Updates a JSON metadata file like `src/data/gallery.json` with a new array
 * This function is now general for replacing the whole JSON content.
 * It will be used by persistGitHubData.
 */
export async function updateGithubContentFile<T = any>(
  dataArray: T[],
  jsonPath: string,
  commitMessage: string
) {
  try {
    const res = await octokit.repos.getContent({
      owner,
      repo,
      path: jsonPath,
      ref: branch,
    });

    const existingSha = (res.data as any).sha;
    const updatedContent = Buffer.from(JSON.stringify(dataArray, null, 2)).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: jsonPath,
      message: commitMessage,
      content: updatedContent,
      sha: existingSha,
      branch,
    });

    return { success: true, message: "Content updated successfully" };
  } catch (err: any) {
    console.error(`Update content error for ${jsonPath}:`, err);
    return { success: false, message: err.message || "Content update failed" };
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
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Failed to fetch ${jsonPath}:`, err);
    return null;
  }
}

/**
 * Deletes a file from a GitHub repo.
 */
export async function deleteFileFromGithub(filePath: string, commitMessage: string) {
  try {
    const existing = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: branch,
    });
    const sha = (existing.data as any).sha;

    await octokit.repos.deleteFile({
      owner,
      repo,
      path: filePath,
      message: commitMessage,
      sha,
      branch,
    });
    return { success: true, message: `File ${filePath} deleted.` };
  } catch (err: any) {
    console.error(`Deletion error for ${filePath}:`, err);
    // If file not found (404), treat as success because it's already gone
    if (err.status === 404) {
      return { success: true, message: `File ${filePath} not found, assumed deleted.` };
    }
    return { success: false, message: err.message || "File deletion failed" };
  }
}
