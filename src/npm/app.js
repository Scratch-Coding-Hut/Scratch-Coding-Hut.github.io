const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware to enable CORS
app.use(cors());

// Middleware to parse JSON
app.use(bodyParser.json());

// Websites folder where repos will be cloned
const WEBSITES_DIR = path.join(__dirname, 'websites');

// Create the websites folder if it doesn't exist
if (!fs.existsSync(WEBSITES_DIR)) {
  fs.mkdirSync(WEBSITES_DIR);
}

// Serve webhosting.html on the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'webhosting.html'));
});

// Serve static files from the websites folder
app.use('/websites', express.static(WEBSITES_DIR));

// POST endpoint to receive GitHub URL
app.post('/clone-repo', (req, res) => {
  const { repoUrl } = req.body;

  // Validate the GitHub URL
  if (!repoUrl || !repoUrl.startsWith('https://github.com/')) {
    return res.status(400).json({ error: 'Invalid GitHub URL.' });
  }

  // Extract repo name from URL
  const repoName = repoUrl.split('/').pop().replace('.git', '');

  // Path to clone the repo
  const repoPath = path.join(WEBSITES_DIR, repoName);

  // Check if folder already exists
  if (fs.existsSync(repoPath)) {
    return res.status(400).json({
      error: 'Repo folder already exists.',
    });
  }

  // Git command to clone the repo
  const cloneCommand = `git clone ${repoUrl} ${repoPath}`;

  // Execute git clone command
  exec(cloneCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error cloning repo: ${stderr}`);
      return res.status(500).json({ error: 'Error cloning the repository.' });
    }

    console.log(`Repository cloned successfully to ${repoPath}`);

    // Check if there is an index.html in the repo
    const indexHtmlPath = path.join(repoPath, 'index.html');

    // Set the redirect URL based on whether index.html exists
    let redirectUrl = `/websites/${repoName}/index.html`;

    // If there's no index.html, we can redirect to a general directory or handle accordingly
    if (!fs.existsSync(indexHtmlPath)) {
      redirectUrl = `/websites/${repoName}`; // Default fallback
    }

    // Return success response with URL to access the cloned repo
    const repoUrlPath = `https://sch-ai1z.onrender.com/websites/${repoName}`;
    res.status(200).json({
      message: 'Repository cloned successfully!',
      folderPath: repoPath,
      repoUrl: repoUrlPath,
      redirectUrl: redirectUrl, // Return the redirect URL with the correct file path
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
