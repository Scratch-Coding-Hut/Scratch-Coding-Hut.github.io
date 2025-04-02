const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

let wikis = [
  { id: 1, title: 'Node.js', content: 'Node.js is a JavaScript runtime built on Chrome\'s V8 JavaScript engine.', owner: 'krxzy_krxzy' },
  { id: 2, title: 'JavaScript', content: 'JavaScript is a programming language commonly used for web development.', owner: 'myscratchedaccount' },
];

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

const authorizedUsers = ['kRxZy_kRxZy', 'MyScratchedAccount', 'mcgdj'];

const isAuthorized = (username, wikiOwner) => {
  return username === wikiOwner || authorizedUsers.includes(username);
};

app.post('/api/wikis', (req, res) => {
  const { title, content, owner } = req.body;
  const newWiki = { id: wikis.length + 1, title, content, owner };
  wikis.push(newWiki);
  res.status(201).send(`Wiki Created! <a href="/wiki/${encodeURIComponent(title)}">View Wiki</a>`);
});

app.get('/wiki/:title', (req, res) => {
  const { title } = req.params;
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
    .edit-button, .report-button { display: inline-block; padding: 10px 20px; font-size: 1.2rem; border: none; border-radius: 5px; cursor: pointer; transition: background 0.3s; text-decoration: none; color: white; }
    .edit-button { background: #ffcc00; }
    .edit-button:hover { background: #ffaa00; }
    .report-button { background: #ff4d4d; }
    .report-button:hover { background: #ff1a1a; }
  </style>
</head>
<body>
  <div class="navbar">
    <a href="/index.html">Home</a>
    <a href="/Wiki/sitemaplinks.html">Create Wiki</a>
  </div>
  <div class="wiki-content">
    <h2>${wiki.title}</h2>
    <p>${wiki.content}</p>
    <small>Author: ${wiki.owner}</small>
    <div class="button-container">
      <a href="/Wiki/edit?edit=${encodeURIComponent(wiki.title)}" class="edit-button">Edit Wiki</a>
      <a href="/Wiki/report.html" class="report-button">Report</a>
    </div>
  </div>
</body>
</html>`);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
