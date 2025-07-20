import { Octokit } from "octokit";

const owner = "theshubhamgundu";
const repo = "vitsaids";
const branch = "main";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export async function uploadToGitHubRepo(file: File, path: string) {
  try {
    const contentBuffer = await file.arrayBuffer();
    const base64Content = Buffer.from(contentBuffer).toString("base64");

    const { data: existingFile } = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner,
        repo,
        path,
      }
    ).catch(() => ({ data: null })); // ignore if not found

    const res = await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner,
      repo,
      path,
      message: `Upload ${path}`,
      content: base64Content,
      branch,
      sha: existingFile?.sha,
    });

    return {
      success: true,
      message: "File uploaded successfully",
      downloadUrl: res.data.content.download_url,
    };
  } catch (error: any) {
    console.error("GitHub Upload Error:", error);
    return {
      success: false,
      message: error.message || "Upload failed",
    };
  }
}

export async function updateJsonMetadataFile<T = any[]>(
  newEntry: T,
  jsonPath: string
) {
  try {
    const { data } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner,
      repo,
      path: jsonPath,
    });

    const content = Buffer.from(data.content, "base64").toString();
    const existing = JSON.parse(content) as T[];

    const updated = [...existing, newEntry];
    const updatedContent = Buffer.from(JSON.stringify(updated, null, 2)).toString("base64");

    await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner,
      repo,
      path: jsonPath,
      message: `Update ${jsonPath}`,
      content: updatedContent,
      sha: data.sha,
      branch,
    });

    return {
      success: true,
      message: `Updated ${jsonPath} successfully`,
    };
  } catch (error: any) {
    console.error(`Failed to update ${jsonPath}:`, error);
    return {
      success: false,
      message: error.message || "Update failed",
    };
  }
}

export async function fetchAndParseJsonFile<T = any>(jsonPath: string): Promise<T | null> {
  try {
    const { data } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner,
      repo,
      path: jsonPath,
    });

    const decoded = Buffer.from(data.content, "base64").toString();
    return JSON.parse(decoded) as T;
  } catch (error) {
    console.error(`Failed to fetch or parse ${jsonPath}:`, error);
    return null;
  }
}
