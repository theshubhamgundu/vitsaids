// server/githubUploader.ts

import axios from 'axios';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const REPO_OWNER = 'theshubhamgundu'; // Change to your GitHub username/org
const REPO_NAME = 'vitsaids'; // Just the repo name
const BRANCH = 'main'; // Or 'master' or whichever branch you're using

const BASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`;

export async function uploadFileToGitHub({
  path,         // e.g., 'public/gallery/image123.png'
  content,      // base64-encoded file content
  message,      // commit message
}: {
  path: string;
  content: string;
  message: string;
}) {
  try {
    const response = await axios.put(
      `${BASE_URL}/${path}`,
      {
        message,
        content,
        branch: BRANCH,
      },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('GitHub Upload Error:', error?.response?.data || error.message);
    throw new Error('Failed to upload file to GitHub');
  }
}
