// ... existing imports and config ...
const owner = "theshubhamgundu";
const repo = "vitsaids";
const branch = "main";

const octokit = new Octokit({
  auth: import.meta.env.VITE_GITHUB_TOKEN,
});

// Add this helper function to log all critical info
function logGithubVars(context: string, vars: Record<string, any>) {
  console.log(`[GITHUB DEBUG: ${context}]`, JSON.stringify(vars, null, 2));
}

export async function uploadToGitHubRepo(
  file: File,
  path: string,
  commitMessage: string
) {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentEncoded = buffer.toString("base64");
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
      if (error.status !== 404) {
        logGithubVars('uploadToGitHubRepo: getContent error', { owner, repo, branch, path, error: error.message });
        throw error;
      }
    }

    logGithubVars('uploadToGitHubRepo: createOrUpdateFileContents', {
      owner, repo, branch, path, sha, commitMessage,
      contentSample: contentEncoded.slice(0, 10)
    });

    const res = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: commitMessage,
      content: contentEncoded,
      branch,
      ...(sha ? { sha } : {}),
    });

    return {
      success: true,
      message: "File uploaded successfully",
      downloadUrl:
        res.data.content?.download_url ||
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
    };
  } catch (err: any) {
    logGithubVars('uploadToGitHubRepo: final catch', { path, error: err.message });
    return {
      success: false,
      message: err.message || "Upload failed",
      downloadUrl: null,
    };
  }
}

export async function updateGithubContentFile<T = any>(
  dataArray: T[],
  jsonPath: string,
  commitMessage: string
) {
  try {
    let existingSha: string | undefined = undefined;

    try {
      const existing = await octokit.repos.getContent({
        owner,
        repo,
        path: jsonPath,
        ref: branch,
      });
      existingSha = (existing.data as any).sha;
    } catch (error: any) {
      if (error.status !== 404) {
        logGithubVars('updateGithubContentFile: getContent error', { owner, repo, branch, jsonPath, error: error.message });
        throw error;
      }
    }

    const encoded = Buffer.from(
      JSON.stringify(dataArray, null, 2)
    ).toString("base64");

    logGithubVars('updateGithubContentFile: createOrUpdateFileContents', {
      owner, repo, branch, jsonPath, existingSha, commitMessage,
      contentSample: encoded.slice(0, 10)
    });

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: jsonPath,
      message: commitMessage,
      content: encoded,
      branch,
      ...(existingSha ? { sha: existingSha } : {}),
    });

    return { success: true, message: "Content updated successfully" };
  } catch (err: any) {
    logGithubVars('updateGithubContentFile: final catch', { jsonPath, error: err.message });
    return { success: false, message: err.message || "Content update failed" };
  }
}
