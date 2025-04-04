const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// In-memory storage for wikis
let wikis = [
  { id: 1, title: 'Node.js', content: 'Node.js is a JavaScript runtime built on Chrome\'s V8 JavaScript engine.', owner: 'krxzy_krxzy' },
  { id: 2, title: 'JavaScript', content: 'JavaScript is a programming language commonly used for web development.', owner: 'myscratchedaccount' },
];

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// Authorized users for editing and deleting wikis
const authorizedUsers = ['kRxZy_kRxZy', 'MyScratchedAccount', 'mcgdj'];

const isAuthorized = (username, wikiOwner) => {
  return username === wikiOwner || authorizedUsers.includes(username);
};

// API: Create a new wiki
app.post('/api/wikis', (req, res) => {
  const { title, content, owner } = req.body;
  if (!title || !content || !owner) {
    return res.status(400).json({ error: 'Title, content, and owner are required' });
  }
  const newWiki = { id: wikis.length + 1, title, content, owner };
  wikis.push(newWiki);
  res.status(201).json(newWiki);
});

// API: Get all wikis
app.get('/api/wikis', (req, res) => {
  res.json(wikis);
});

// API: Get a specific wiki by ID
app.get('/api/wikis/:id', (req, res) => {
  const { id } = req.params;
  const wiki = wikis.find(wiki => wiki.id === parseInt(id));
  if (!wiki) {
    return res.status(404).json({ error: 'Wiki not found' });
  }
  res.json(wiki);
});

// API: Delete a wiki by ID
app.delete('/api/wikis/:id', (req, res) => {
  const { id } = req.params;
  const { user } = req.query;
  if (!user) return res.status(400).json({ error: 'User parameter is required' });

  let username;
  try {
    username = atob(user);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid username encoding' });
  }

  const wikiIndex = wikis.findIndex(wiki => wiki.id === parseInt(id));
  if (wikiIndex === -1) {
    return res.status(404).json({ error: 'Wiki not found' });
  }

  const wiki = wikis[wikiIndex];

  if (!isAuthorized(username, wiki.owner)) {
    return res.status(403).json({ error: 'Unauthorized to delete this wiki' });
  }

  wikis.splice(wikiIndex, 1);
  res.json({ message: 'Wiki deleted successfully' });
});

// Serve HTML page for a specific wiki title
app.get('/wiki/:title', (req, res) => {
  const { title } = req.params;
  const { user } = req.query;
  const wiki = wikis.find(w => w.title.toLowerCase() === title.toLowerCase());

  if (!wiki) {
    return res.status(404).send('Wiki not found');
  }

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${wiki.title} - Wiki</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; background: #fff4f4; color: #333; text-align: center; }
    .navbar { display: flex; justify-content: center; align-items: center; background: #ff4d4d; padding: 15px 20px; border-radius: 10px; gap: 15px; }
    .navbar a { color: white; text-decoration: none; font-size: 1.2rem; padding: 10px 15px; border-radius: 5px; transition: background 0.3s; }
    .navbar a:hover { background: #ff1a1a; }
    .wiki-content { max-width: 1000px; margin: 40px auto; background: #ffe6e6; padding: 40px; border-radius: 10px; text-align: left; }
    .wiki-content h2 { color: #e60000; font-size: 2.5rem; margin-bottom: 20px; text-align: center; }
    .wiki-content p { font-size: 1.5rem; color: #333; line-height: 1.6; text-align: center; }
    .button-container { margin-top: 20px; display: flex; gap: 10px; justify-content: center; }
    .edit-button, .report-button, .delete-button { display: inline-block; padding: 10px 20px; font-size: 1.2rem; border: none; border-radius: 5px; cursor: pointer; transition: background 0.3s; text-decoration: none; color: white; }
    .edit-button { background: #ffcc00; }
    .edit-button:hover { background: #ffaa00; }
    .report-button { background: #ff4d4d; }
    .report-button:hover { background: #ff1a1a; }
    .delete-button { background: #d11a2a; display: none; }
    .delete-button:hover { background: #a3001b; }
  </style>
</head>
<body>
  <div class="navbar">
    <a href="https://scratch-coding-hut.github.io/index.html">Home</a>
    <a href="https://scratch-coding-hut.github.io/Wiki/sitemaplinks.html">Create Wiki & List Of Wikis</a>
  </div>
  <div class="wiki-content">
    <h2>${wiki.title}</h2>
    <p>${wiki.content}</p>
    <small id="wiki-owner">${wiki.owner}</small>
    <div class="button-container">
      <a href="https://scratch-coding-hut.github.io/Wiki/edit?edit=${encodeURIComponent(wiki.title)}" class="edit-button">Edit Wiki</a>
      <a href="https://scratch-coding-hut.github.io/Wiki/report.html?wiki=${encodeURIComponent(wiki.title)}" class="report-button">Report</a>
      <button class="delete-button" onclick="deleteWiki(${wiki.id})">Delete Wiki</button>
    </div>

    <h3>Talk Page</h3>

<script src="https://utteranc.es/client.js"
        repo="Scratch-Coding-Hut/Scratch-Coding-Hut.github.io"
        issue-term="url"
        label="Website Comments"
        theme="github-light"
        crossorigin="anonymous"
        async>
</script>
  </div>

  <script>
    function getUsernameFromURL() {
      const urlParams = new URLSearchParams(window.location.search);
      const encodedUser = urlParams.get("user");
      return encodedUser ? atob(encodedUser) : null;
    }

    function deleteWiki(wikiId) {
      const username = getUsernameFromURL();
      if (!username) {
        alert("No user detected. Please log in.");
        return;
      }

      if (!confirm("Are you sure you want to delete this wiki?")) return;

      fetch(\`/api/wikis/\${wikiId}?user=\${btoa(username)}\`, {
        method: "DELETE"
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          alert("Error: " + data.error);
        } else {
          alert("Wiki deleted successfully.");
          window.location.href = "https://scratch-coding-hut.github.io/index.html";
        }
      })
      .catch(error => console.error("Error deleting wiki:", error));
    }

    window.onload = function() {
      const username = getUsernameFromURL();
      const wikiOwner = document.getElementById("wiki-owner").textContent;
      const authorizedUsers = ["kRxZy_kRxZy", "MyScratchedAccount", "mcgdj"];

      if (username && (username === wikiOwner || authorizedUsers.includes(username))) {
        document.querySelector(".delete-button").style.display = "inline-block";
      }
    };
  </script>
</body>
</html>`);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
