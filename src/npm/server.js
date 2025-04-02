const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import CORS

const app = express();
const port = process.env.PORT || 3000; // Port for Render to listen on

// In-memory storage for wikis
let wikis = [
  { id: 1, title: 'Node.js', content: 'Node.js is a JavaScript runtime built on Chrome\'s V8 JavaScript engine.', owner: 'krxzy_krxzy' },
  { id: 2, title: 'JavaScript', content: 'JavaScript is a programming language commonly used for web development.', owner: 'myscratchedaccount' },
];

app.use(bodyParser.json());
app.use(cors());  // Enable CORS for all requests

const authorizedUsers = ['kRxZy_kRxZy', 'MyScratchedAccount', 'mcgdj'];

// Middleware to check if user is authorized to edit or delete
const isAuthorized = (username, wikiOwner) => {
  return username === wikiOwner || authorizedUsers.includes(username);
};

// Serve static files (public assets)
app.use(express.static('public'));

// Create a new wiki
app.post('/api/wikis', (req, res) => {
  const { title, content, owner } = req.body;
  const newWiki = { id: wikis.length + 1, title, content, owner };
  wikis.push(newWiki);
  res.status(201).json(newWiki);
});

// Edit an existing wiki
app.put('/api/wikis/:id', (req, res) => {
  const { id } = req.params;
  const { title, content, owner } = req.body;

  const wiki = wikis.find(wiki => wiki.id === parseInt(id));
  if (wiki && isAuthorized(owner, wiki.owner)) {
    wiki.title = title;
    wiki.content = content;
    res.json(wiki);
  } else {
    res.status(403).send('Not authorized or wiki not found');
  }
});

// Delete a wiki
app.delete('/api/wikis/:id', (req, res) => {
  const { id } = req.params;
  const { owner } = req.body;

  const wikiIndex = wikis.findIndex(wiki => wiki.id === parseInt(id));
  if (wikiIndex !== -1 && isAuthorized(owner, wikis[wikiIndex].owner)) {
    wikis.splice(wikiIndex, 1);
    res.status(200).send('Wiki deleted');
  } else {
    res.status(403).send('Not authorized or wiki not found');
  }
});

// Get all wikis
app.get('/api/wikis', (req, res) => {
  res.json(wikis);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
