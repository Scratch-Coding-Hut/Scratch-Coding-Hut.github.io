const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const wikisFilePath = path.join(__dirname, 'wikis.json');
const bannedUsersFilePath = path.join(__dirname, 'bannedUsers.json');

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
app.use(express.static('public'));

// Middleware to check if user is banned
const isUserBanned = (userId) => {
  return bannedUsers.includes(userId);
};

// Serve HTML page for a specific wiki title
app.get('/wiki/:title', (req, res) => {
  const { title } = req.params;
  const wiki = wikis.find(w => w.title.toLowerCase() === title.toLowerCase());

  if (!wiki) {
    return res.status(404).send('Wiki not found');
  }

  // HTML generation inside template literal
  res.send(`
  <!DOCTYPE html>
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
      .wiki-content p { font-size: 1.5rem; color: #333; line-height: 1.6; }
      .comment-section { margin-top: 40px; }
      .comment { background: #fff; padding: 10px; margin: 10px 0; border-radius: 5px; }
      .comment-author { font-weight: bold; }
      .comment-content { font-size: 1rem; margin-top: 5px; }
      .comment-reply { font-size: 0.9rem; color: #888; margin-left: 20px; }
      .comment-form { margin-top: 20px; text-align: left; }
      .comment-input { width: 100%; padding: 10px; margin-top: 10px; font-size: 1rem; border: 1px solid #ccc; border-radius: 5px; }
    </style>
  </head>
  <body>
    <div class="navbar">
      <a href="scratch-coding-hut.github.io/">Home</a>
      <a href="scratch-coding-hut.github.io/Wiki/sitemaplinks.html">Create Wiki</a>
      <a href="scratch-coding-hut.github.io/Wiki/sitemaplinks.html">Wiki List</a>
    </div>
    <div class="wiki-content">
      <h2>${wiki.title}</h2>
      <p>${wiki.content}</p>
      <p[${wiki.owner}</p>
    </div>

    <div class="comment-section">
      <h3>Comments</h3>
      `${wiki.comments.slice(-7).map((comment) => `
  <div class="comment" id="comment-${comment.id}">
    <div class="comment-author">
      ${comment.author} <small>(${new Date(comment.createdAt).toLocaleString()})</small>
    </div>
    <div class="comment-content">${escapeHtml(comment.content)}</div>
    ${comment.replies.length > 0 ? comment.replies.map(reply => `
      <div class="comment-reply">
        <strong>${reply.author}</strong>: ${escapeHtml(reply.content)} 
        <small>(${new Date(reply.createdAt).toLocaleString()})</small>
      </div>
    `).join('') : ''}
  </div>
`).join('')}`


    <div class="comment-form">
      <h3>Add a Comment</h3>
      <textarea class="comment-input" id="comment-content" placeholder="Write your comment..." rows="4"></textarea>
      <button onclick="submitComment()">Submit</button>
    </div>

    <script>
      function escapeHtml(str) {
        return str.replace(/[&<>"'`]/g, function(match) {
          const escape = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
            "`": '&#x60;'
          };
          return escape[match];
        });
      }

      function submitComment() {
        const content = document.getElementById('comment-content').value;
        fetch('https://api.ipify.org?format=json')
         .then(response => response.json())
         .then(data => {
          const ip = data.ip;
          const urlParams = new URLSearchParams(window.location.search);
          const user = atob(urlParams.get('user')) || ip;

          if (!content.trim()) {
            alert('Comment content cannot be empty');
            return;
          }

          fetch('/api/wikis/${wiki.id}/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: btoa(user), content: content })
          })
          .then(response => response.json())
          .then(comment => {
            // Append new comment to the comment section
            const commentSection = document.querySelector('.comment-section');
            commentSection.innerHTML += `
              <div class="comment" id="comment-${comment.id}">
                <div class="comment-author">${comment.author}</div>
                <div class="comment-content">${comment.content}</div>
              </div>
            `;
          })
          .catch(error => console.error('Error adding comment:', error));
        });
      }
    </script>
  </body>
  </html>
  `);
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

// API: Edit a user's comment
app.put('/api/wikis/:id/comments/:commentId', (req, res) => {
  const { id, commentId } = req.params;
  const { user, content } = req.body;

  const wiki = wikis.find(w => w.id === parseInt(id));
  if (!wiki) {
    return res.status(404).json({ error: 'Wiki not found' });
  }

  const comment = wiki.comments.find(c => c.id === parseInt(commentId));

  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  const username = atob(user); // Decode the username

  if (comment.author !== username) {
    return res.status(403).json({ error: 'You can only edit your own comments' });
  }

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  comment.content = content;
  comment.editedAt = new Date().toISOString();

  saveWikis(wikis);
  res.json(comment);
});

// API: Delete a comment (Admin only)
app.delete('/api/wikis/:id/comments/:commentId', (req, res) => {
  const { id, commentId } = req.params;

  const wiki = wikis.find(w => w.id === parseInt(id));
  if (!wiki) {
    return res.status(404).json({ error: 'Wiki not found' });
  }

  const commentIndex = wiki.comments.findIndex(c => c.id === parseInt(commentId));

  if (commentIndex === -1) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  wiki.comments.splice(commentIndex, 1);

  saveWikis(wikis);
  res.status(204).end();
});

// Admin: Ban a user
app.post('/api/admin/ban', (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  if (!bannedUsers.includes(userId)) {
    bannedUsers.push(userId);
    saveBannedUsers(bannedUsers);
    res.status(201).json({ message: 'User banned successfully' });
  } else {
    res.status(400).json({ error: 'User is already banned' });
  }
});

// Admin: Unban a user
app.post('/api/admin/unban', (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  bannedUsers = bannedUsers.filter(id => id !== userId);
  saveBannedUsers(bannedUsers);
  res.status(201).json({ message: 'User unbanned successfully' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
