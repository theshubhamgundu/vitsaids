// server/githubUploader.ts

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { Octokit } from "octokit";
import dotenv from "dotenv";

dotenv.config(); // Load .env file
const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// Create Octokit with your GitHub token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Upload endpoint
app.post("/upload-to-github", async (req, res) => {
  try {
    const { owner, repo, filePath, content, message } = req.body;

    const response = await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner,
      repo,
      path: filePath,
      message,
      content,
    });

    res.json({ success: true, response });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ GitHub uploader running on http://localhost:${PORT}`);
});
