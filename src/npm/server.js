const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const wikisFilePath = path.join(__dirname, 'wikis.json');
const bannedUsersFilePath = path.join(__dirname, 'bannedUsers.json');

// Admins list
const admins = ['kRxZy_kRxZy', 'MyScratchedAccount', 'mcgdj'];

// Load the wikis and banned users from the files
const loadWikis = () => {
  if (fs.existsSync(wikisFilePath)) {
    const data = fs.readFileSync(wikisFilePath, 'utf-8');
    return JSON.parse(data);
  } else {
    return [];
  }
};

const loadBannedUsers = () => {
  if (fs.existsSync(bannedUsersFilePath)) {
    const data = fs.readFileSync(bannedUsersFilePath, 'utf-8');
    return JSON.parse(data);
  } else {
    return [];
  }
};

// Save the wikis and banned users to their respective files
const saveWikis = (wikis) => {
  fs.writeFileSync(wikisFilePath, JSON.stringify(wikis, null, 2), 'utf-8');
};

const saveBannedUsers = (bannedUsers) => {
  fs.writeFileSync(bannedUsersFilePath, JSON.stringify(bannedUsers, null, 2), 'utf-8');
};

// In-memory storage for wikis (loaded from file)
let wikis = loadWikis();
let bannedUsers = loadBannedUsers();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public')); // Serve static assets like images, CSS, etc.
app.set('view engine', 'ejs'); // Set EJS as the template engine
app.set('views', path.join(__dirname, 'views')); // Set the directory for EJS templates

// Middleware to check if user is banned
const isUserBanned = (userId) => {
  return bannedUsers.includes(userId);
};

// Middleware to check if user is admin or owner
const isOwnerOrAdmin = (user, wikiOwner) => {
  return admins.includes(user) || user === wikiOwner;
};

// Serve HTML page for a specific wiki title
app.get('/wiki/:title', (req, res) => {
  const { title } = req.params;
  const username = req.query.user ? atob(req.query.user) : null;  // Get the user from the query

  const wiki = wikis.find(w => w.title.toLowerCase() === title.toLowerCase());

  if (!wiki) {
    return res.status(404).send('Wiki not found');
  }

  // Check if user is owner or admin
  const isOwnerOrAdminFlag = isOwnerOrAdmin(username, wiki.owner);

  // Render the EJS template with the wiki data and access flag
  res.render('wiki', {
    title: wiki.title,
    content: wiki.content,
    owner: wiki.owner,
    comments: wiki.comments.slice(-7),
    wikiId: wiki.id,
    isOwnerOrAdmin: isOwnerOrAdminFlag,
    currentUser: username,
    isAdmin: isOwnerOrAdminFlag
  });
});

// API: Get all wikis (without comments)
app.get('/api/wikis', (req, res) => {
  res.json(wikis.map(wiki => ({
    id: wiki.id,
    title: wiki.title,
    content: wiki.content,
    owner: wiki.owner
  })));
});

// API: Get wiki details (without comments)
app.get('/api/wikis/:id', (req, res) => {
  const { id } = req.params;
  const wiki = wikis.find(w => w.id === parseInt(id));

  if (!wiki) {
    return res.status(404).json({ error: 'Wiki not found' });
  }

  res.json({
    id: wiki.id,
    title: wiki.title,
    content: wiki.content,
    owner: wiki.owner
  });
});

// API: Edit wiki content (for owner or admin only)
app.put('/api/wikis/:id', (req, res) => {
  const { id } = req.params;
  const { user, content } = req.body;

  const wiki = wikis.find(w => w.id === parseInt(id));

  if (!wiki) {
    return res.status(404).json({ error: 'Wiki not found' });
  }

  if (!isOwnerOrAdmin(user, wiki.owner)) {
    return res.status(403).json({ error: 'You are not authorized to edit this wiki' });
  }

  wiki.content = content;
  saveWikis(wikis);

  res.json(wiki);
});

// API: Add a comment to a specific wiki
app.post('/api/wikis/:id/comments', (req, res) => {
  const { id } = req.params;
  const { user, content, replyTo } = req.body;

  if (isUserBanned(user)) {
    return res.status(403).json({ error: 'User is banned' });
  }

  const wiki = wikis.find(w => w.id === parseInt(id));
  if (!wiki) {
    return res.status(404).json({ error: 'Wiki not found' });
  }

  const username = atob(user); // Decode the username

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  const newComment = {
    id: Date.now(), // Use timestamp for unique ID
    author: username,
    content: content,
    createdAt: new Date().toISOString(),
    editedAt: null,
    deleted: false,
    replies: [],
  };

  if (replyTo) {
    const parentComment = wiki.comments.find(comment => comment.id === replyTo);
    if (parentComment) {
      parentComment.replies.push(newComment);
    } else {
      return res.status(404).json({ error: 'Reply target not found' });
    }
  } else {
    wiki.comments.push(newComment);
  }

  saveWikis(wikis);
  res.status(201).json(newComment);
});

// API: Edit comment (for owner or admin only)
app.put('/api/wikis/:wikiId/comments/:commentId', (req, res) => {
  const { wikiId, commentId } = req.params;
  const { user, content } = req.body;

  const wiki = wikis.find(w => w.id === parseInt(wikiId));
  if (!wiki) {
    return res.status(404).json({ error: 'Wiki not found' });
  }

  const comment = wiki.comments.find(c => c.id === parseInt(commentId));
  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  if (comment.author !== atob(user) && !admins.includes(user)) {
    return res.status(403).json({ error: 'You are not authorized to edit this comment' });
  }

  comment.content = content;
  comment.editedAt = new Date().toISOString();
  saveWikis(wikis);

  res.json(comment);
});

// API: Delete comment (for admin only)
app.delete('/api/wikis/:wikiId/comments/:commentId', (req, res) => {
  const { wikiId, commentId } = req.params;
  const { user } = req.body;

  const wiki = wikis.find(w => w.id === parseInt(wikiId));
  if (!wiki) {
    return res.status(404).json({ error: 'Wiki not found' });
  }

  const commentIndex = wiki.comments.findIndex(c => c.id === parseInt(commentId));
  if (commentIndex === -1) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  if (!admins.includes(user)) {
    return res.status(403).json({ error: 'You are not authorized to delete this comment' });
  }

  wiki.comments.splice(commentIndex, 1);
  saveWikis(wikis);

  res.status(204).send();
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
