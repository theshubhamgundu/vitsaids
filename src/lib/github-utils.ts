// src/lib/github-utils.ts

import { Octokit } from "@octokit/rest";

// Polyfill for Buffer in browser
import { Buffer } from "buffer"; // IMPORTANT: install via `npm i buffer` if not yet

const owner = "theshubhamgundu";
const repo = "vitsaids";
const branch = "main";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

/**
 * Uploads a file (e.g., image) to GitHub
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
      if (error.status !== 404) console.error(`Error checking ${path}:`, error);
    }

    const res = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: commitMessage,
      content: contentEncoded,
      branch,
      ...(sha && { sha }),
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
 * Replaces content in a GitHub .json file
 */
export async function updateGithubContentFile<T = any>(
  dataArray: T[],
  jsonPath: string,
  commitMessage: string
) {
  try {
    const existing = await octokit.repos.getContent({
      owner,
      repo,
      path: jsonPath,
      ref: branch,
    });

    const existingSha = (existing.data as any).sha;
    const encoded = Buffer.from(JSON.stringify(dataArray, null, 2)).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: jsonPath,
      message: commitMessage,
      content: encoded,
      sha: existingSha,
      branch,
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
