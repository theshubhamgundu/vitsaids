// utils/githubUploader.ts
import { Octokit } from 'octokit';
import { Buffer } from 'buffer';

interface UploadParams {
  folder: 'faculty' | 'events' | 'gallery' | 'placements';
  imageFile: File;
  metadata: Record<string, any>; // object containing name, email, etc.
  githubToken: string;
  repo: string;
  owner: string;
  branch?: string;
}

const getMetadataFileName = (folder: string) => {
  return `${folder}.ts`; // eg. faculty.ts
};

const getExportName = (folder: string) => {
  return folder === 'gallery' ? 'galleryItems' : folder;
};

export async function uploadToGitHub({
  folder,
  imageFile,
  metadata,
  githubToken,
  repo,
  owner,
  branch = 'main',
}: UploadParams): Promise<{ success: boolean; message: string }> {
  const octokit = new Octokit({ auth: githubToken });
  const imageFileName = imageFile.name;

  try {
    const fileBuffer = await imageFile.arrayBuffer();
    const base64Content = Buffer.from(fileBuffer).toString('base64');

    const imagePath = `public/${folder}/${imageFileName}`;

    // Step 1: Upload image file
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: imagePath,
      message: `Add ${imageFileName} to ${folder}`,
      content: base64Content,
      branch,
    });

    // Step 2: Update metadata TypeScript file
    const metadataPath = `public/${folder}/${getMetadataFileName(folder)}`;
    let fileSha = '';
    let existingContent = '';

    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: metadataPath,
        ref: branch,
      });

      if ('content' in data && data.content) {
        existingContent = Buffer.from(data.content, 'base64').toString();
        fileSha = data.sha;
      }
    } catch (error: any) {
      // File may not exist, we will create it
      existingContent = `export const ${getExportName(folder)} = []`;
    }

    const exportName = getExportName(folder);

    // Remove trailing bracket and export
    const updatedList = JSON.stringify(metadata, null, 2);

    const newContent = existingContent.replace(
      new RegExp(`export const ${exportName} = \[([\s\S]*)\]`),
      `export const ${exportName} = [
$1,
${updatedList}
]`
    );

    const encodedNewContent = Buffer.from(newContent).toString('base64');

    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: metadataPath,
      message: `Update ${metadataPath} with new entry`,
      content: encodedNewContent,
      sha: fileSha || undefined,
      branch,
    });

    return { success: true, message: 'Upload successful' };
  } catch (error: any) {
    console.error('Upload failed:', error.message);
    return { success: false, message: error.message };
  }
}
