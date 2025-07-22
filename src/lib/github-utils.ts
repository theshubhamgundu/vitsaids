// src/lib/github-utils.ts

import { Octokit } from "@octokit/rest";

// Polyfill for Buffer in browser
import { Buffer } from "buffer"; // IMPORTANT: install via `npm i buffer` if not yet

const owner = "theshubhamgundu";
const repo = "vitsaids";
const branch = "main";

const octokit = new Octokit({
  // FIX: Access Vite environment variables using import.meta.env
  // And ensure your environment variable is named VITE_GITHUB_TOKEN in Vercel
  auth: import.meta.env.VITE_GITHUB_TOKEN,
});

/**
 * Uploads a file (e.g., image) to GitHub
 * This function correctly handles creating a file if it doesn't exist
 * or updating it if it does.
 */
export async function uploadToGitHubRepo(file: File, path: string, commitMessage: string) {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentEncoded = buffer.toString("base64");

    let sha: string | undefined;

    try {
      const existing = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });
      sha = (existing.data as any).sha;
    } catch (error: any) {
      if (error.status !== 404) {
        // Only throw if it's not a 404, meaning a genuine error fetching
        console.error(`Error checking existing ${path} for upload:`, error);
        throw error;
      }
      // If 404, sha remains undefined, which is correct for creating a new file
    }

    const res = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: commitMessage,
      content: contentEncoded,
      branch,
      ...(sha && { sha }), // Only include SHA if the file existed
    });

    return {
      success: true,
      message: "File uploaded successfully",
      downloadUrl:
        res.data.content?.download_url ||
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
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
 * Replaces content in a GitHub .json file.
 * This function is now refactored to correctly "upsert" (create or update)
 * the JSON file, handling cases where the file does not yet exist.
 */
export async function updateGithubContentFile<T = any>(
  dataArray: T[],
  jsonPath: string,
  commitMessage: string
) {
  try {
    let existingSha: string | undefined;

    try {
      // Attempt to get the existing file content and its SHA
      const existing = await octokit.repos.getContent({
        owner,
        repo,
        path: jsonPath,
        ref: branch,
      });
      existingSha = (existing.data as any).sha;
    } catch (error: any) {
      // If the file is not found (status 404), that's expected for a new file.
      // We set existingSha to undefined, so createOrUpdateFileContents creates it.
      if (error.status !== 404) {
        console.error(`Error checking existing ${jsonPath} (non-404 error):`, error);
        throw error; // Re-throw any other unexpected errors
      }
      // If 404, existingSha correctly remains undefined.
    }

    const encoded = Buffer.from(JSON.stringify(dataArray, null, 2)).toString("base64");

    // This will create the file if existingSha is undefined (due to 404 from getContent),
    // or update it if existingSha is provided.
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: jsonPath,
      message: commitMessage,
      content: encoded,
      branch, // Always include branch
      ...(existingSha && { sha: existingSha }), // Only include SHA if the file existed
    });

    return { success: true, message: "Content updated successfully" };
  } catch (err: any) {
    console.error(`Update error for ${jsonPath}:`, err);
    return { success: false, message: err.message || "Content update failed" };
  }
}

/**
 * Fetches and parses JSON from GitHub
 */
export async function fetchAndParseJsonFile<T = any[]>(jsonPath: string): Promise<T | null> {
  try {
    const res = await octokit.repos.getContent({
      owner,
      repo,
      path: jsonPath,
      ref: branch,
    });

    const raw = (res.data as any).content;
    const json = Buffer.from(raw, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch (err: any) {
    console.error(`Failed to fetch ${jsonPath}:`, err);
    return null;
  }
}

/**
 * Deletes file from GitHub
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
    if (err.status === 404) {
      return { success: true, message: `${filePath} not found. Already deleted.` };
    }
    return { success: false, message: err.message || "File deletion failed" };
  }
}
