require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

const GITHUB_OWNER = 'Scratch-Coding-Hut';
const GITHUB_REPO = 'Scratch-Coding-Hut.github.io';
const FILE_PATH = 'forum.json'; // The file storing topics, posts, and user profiles
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

app.use(express.json());

// Mock users (admin and regular users)
const users = {
  admin: { username: 'admin', password: 'admin123', role: 'admin' },
  user1: { username: 'user1', password: 'password1', role: 'user' },
};

// Simulate user login by storing a session in memory (could be replaced with JWT in production)
let currentSession = null;

// Function to get forum data from GitHub
async function getForumData() {
  try {
    const response = await axios.get(GITHUB_API_URL, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });
    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error fetching forum data:', error);
    return { topics: [] };
  }
}

// Function to update forum data on GitHub
async function updateForumData(newForumData) {
  try {
    const response = await axios.get(GITHUB_API_URL, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });
    const sha = response.data.sha;
    const updatedContent = Buffer.from(JSON.stringify(newForumData, null, 2)).toString('base64');

    await axios.put(
      GITHUB_API_URL,
      {
        message: 'Update forum data',
        content: updatedContent,
        sha: sha,
      },
      {
        headers: { Authorization: `token ${GITHUB_TOKEN}` },
      }
    );
  } catch (error) {
    console.error('Error updating forum data:', error);
  }
}

// Function to check if the user is logged in
function isAuthenticated(req) {
  return req.headers['authorization'] === `Bearer ${currentSession}`;
}

// Function to check if the user is an admin
function isAdmin(req) {
  return isAuthenticated(req) && currentSession === 'admin';
}

// API endpoint to get topics with pagination (Load More)
app.get('/forum', async (req, res) => {
  const forumData = await getForumData();
  const { page = 1, limit = 5 } = req.query;
  const paginatedTopics = forumData.topics.slice((page - 1) * limit, page * limit);
  res.json({ topics: paginatedTopics, total: forumData.topics.length });
});

// API endpoint to get a single topic (with dynamic topic name)
app.get('/forum/:topicName', async (req, res) => {
  const forumData = await getForumData();
  const topic = forumData.topics.find((t) => t.title === req.params.topicName);
  if (topic) {
    res.json(topic);
  } else {
    res.status(404).json({ error: 'Topic not found' });
  }
});

// API endpoint to create a new topic
app.post('/forum', async (req, res) => {
  if (!isAdmin(req))
    return res.status(403).json({ error: 'You must be an admin to create topics' });

  const forumData = await getForumData();
  const newTopic = {
    id: new Date().getTime().toString(),
    title: req.body.title,
    posts: [],
    createdAt: new Date(),
  };
  forumData.topics.push(newTopic);
  await updateForumData(forumData);
  res.json(newTopic);
});

// API endpoint to delete a topic (admin only)
app.delete('/forum/:topicName', async (req, res) => {
  if (!isAdmin(req))
    return res.status(403).json({ error: 'You must be an admin to delete topics' });

  const forumData = await getForumData();
  const index = forumData.topics.findIndex((t) => t.title === req.params.topicName);
  if (index > -1) {
    forumData.topics.splice(index, 1);
    await updateForumData(forumData);
    res.json({ message: 'Topic deleted successfully' });
  } else {
    res.status(404).json({ error: 'Topic not found' });
  }
});

// API endpoint to add a comment or reply to a topic
app.post('/forum/:topicName/reply', async (req, res) => {
  const forumData = await getForumData();
  const topic = forumData.topics.find((t) => t.title === req.params.topicName);

  if (topic) {
    const newReply = {
      content: req.body.content,
      createdAt: new Date(),
    };
    topic.posts.push(newReply);
    await updateForumData(forumData);
    res.json(newReply);
  } else {
    res.status(404).json({ error: 'Topic not found' });
  }
});

// API endpoint to delete a comment (admin or author of the comment)
app.delete('/forum/:topicName/reply/:replyIndex', async (req, res) => {
  if (!isAuthenticated(req))
    return res.status(401).json({ error: 'You must be logged in to delete comments' });

  const forumData = await getForumData();
  const topic = forumData.topics.find((t) => t.title === req.params.topicName);

  if (topic) {
    const replyIndex = parseInt(req.params.replyIndex, 10);
    if (topic.posts[replyIndex]) {
      topic.posts.splice(replyIndex, 1);
      await updateForumData(forumData);
      res.json({ message: 'Comment deleted successfully' });
    } else {
      res.status(404).json({ error: 'Comment not found' });
    }
  } else {
    res.status(404).json({ error: 'Topic not found' });
  }
});

// API endpoint for user login (mock system)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  if (user && user.password === password) {
    currentSession = username;
    res.json({ message: 'Login successful', user });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// API endpoint for user signup (mock system)
app.post('/signup', (req, res) => {
  const { username, password, role } = req.body;
  if (users[username]) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  users[username] = { username, password, role: role || 'user' };
  res.json({ message: 'Signup successful', user: users[username] });
});

// API endpoint for user profile
app.get('/profile', (req, res) => {
  if (!isAuthenticated(req))
    return res.status(401).json({ error: 'You must be logged in to view your profile' });

  const userProfile = { username: currentSession, profileInfo: "User's custom profile data" };
  res.json(userProfile);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
