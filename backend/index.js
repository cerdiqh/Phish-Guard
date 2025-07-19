const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const Campaign = require('./models/Campaign');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://phish-guard-1.onrender.com', // Your actual frontend Render URL
    'https://phish-guard-seven.vercel.app', // Vercel frontend
  ],
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/phishguard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
});

app.get('/', (req, res) => {
  res.send('PhishGuard API is running!');
});

// Get all campaigns (any logged-in user)
app.get('/api/campaigns', auth(), async (req, res) => {
  const campaigns = await Campaign.find();
  res.json(campaigns);
});

// Email config (use environment variables in production)
const EMAIL_USER = process.env.EMAIL_USER || 'your_email@example.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'your_email_password';
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

const transporter = nodemailer.createTransport({
  service: 'gmail', // Change to your provider if needed
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

async function sendPhishingEmail({ to, subject, html }) {
  return transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
  });
}

// Helper to generate a unique tracking ID
function generateTrackingId(campaignId, email) {
  return crypto.createHash('sha256').update(`${campaignId}:${email}`).digest('hex');
}

// Endpoint to track email opens (tracking pixel)
app.get('/track/open/:campaignId/:trackingId', async (req, res) => {
  const { campaignId, trackingId } = req.params;
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) return res.status(404).end();
  const emailStatus = campaign.emailStatus || [];
  const entry = emailStatus.find(e => generateTrackingId(campaignId, e.email) === trackingId);
  if (entry) {
    entry.openCount = (entry.openCount || 0) + 1;
    entry.lastOpenedAt = new Date();
    await campaign.save();
    io.emit('emailOpened', { campaignId, email: entry.email, openCount: entry.openCount });
  }
  // 1x1 transparent gif
  const img = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
  res.set('Content-Type', 'image/gif');
  res.send(img);
});

// Endpoint to track clicks
app.get('/track/click/:campaignId/:trackingId', async (req, res) => {
  const { campaignId, trackingId } = req.params;
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) return res.status(404).send('Not found');
  const emailStatus = campaign.emailStatus || [];
  const entry = emailStatus.find(e => generateTrackingId(campaignId, e.email) === trackingId);
  if (entry) {
    entry.clickCount = (entry.clickCount || 0) + 1;
    entry.lastClickedAt = new Date();
    await campaign.save();
    io.emit('emailClicked', { campaignId, email: entry.email, clickCount: entry.clickCount });
  }
  // Redirect to a safe landing page (simulate phishing)
  res.redirect('https://yourcompany.com/phishing-landing');
});

// Create a campaign (admin only)
app.post('/api/campaigns', auth('admin'), async (req, res) => {
  const campaign = new Campaign(req.body);
  // Send emails to all targets
  const targets = campaign.targets || [];
  const template = campaign.template || { subject: 'Phishing Simulation', body: 'This is a phishing simulation.' };
  campaign.emailStatus = [];
  for (const target of targets) {
    try {
      const trackingId = generateTrackingId(campaign._id, target.email);
      const openPixel = `<img src=\"http://localhost:5000/track/open/${campaign._id}/${trackingId}\" width=\"1\" height=\"1\" style=\"display:none\" />`;
      const clickUrl = `http://localhost:5000/track/click/${campaign._id}/${trackingId}`;
      const html = template.body.replace('[PHISHING_LINK]', `<a href=\"${clickUrl}\">Click here</a>`) + openPixel;
      await sendPhishingEmail({
        to: target.email,
        subject: template.subject,
        html,
      });
      campaign.emailStatus.push({ email: target.email, status: 'sent', openCount: 0, clickCount: 0 });
      io.emit('emailStatus', { campaignId: campaign._id, email: target.email, status: 'sent' });
    } catch (err) {
      campaign.emailStatus.push({ email: target.email, status: 'failed', error: err.message });
      io.emit('emailStatus', { campaignId: campaign._id, email: target.email, status: 'failed', error: err.message });
    }
  }
  await campaign.save();
  io.emit('campaignCreated', campaign);
  res.status(201).json(campaign);
});

// Register
app.post('/api/register', async (req, res) => {
  console.log('Register request:', req.body); // Log registration attempts
  const { username, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = new User({ username, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(400).json({ error: 'Registration failed', details: err });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user._id, role: user.role }, 'your_jwt_secret', { expiresIn: '1d' });
  res.json({ token, user: { username: user.username, email: user.email, role: user.role } });
});

// Template endpoints (example, adjust as needed)
const templates = [];

// Get all templates (any logged-in user)
app.get('/api/templates', auth(), (req, res) => {
  res.json(templates);
});

// Create template (admin/manager only)
app.post('/api/templates', auth(), (req, res, next) => {
  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden: insufficient role' });
  }
  next();
}, (req, res) => {
  const template = { ...req.body, id: (templates.length + 1).toString() };
  templates.push(template);
  res.status(201).json(template);
});

// Edit template (admin/manager only)
app.put('/api/templates/:id', auth(), (req, res, next) => {
  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden: insufficient role' });
  }
  next();
}, (req, res) => {
  const idx = templates.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  templates[idx] = { ...templates[idx], ...req.body };
  res.json(templates[idx]);
});

// Delete template (admin/manager only)
app.delete('/api/templates/:id', auth(), (req, res, next) => {
  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden: insufficient role' });
  }
  next();
}, (req, res) => {
  const idx = templates.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  templates.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

// Reports endpoints (example, adjust as needed)
const reports = [
  { id: '1', userId: '1', data: 'Report for user 1' },
  { id: '2', userId: '2', data: 'Report for user 2' },
];

// Get all reports (admin/manager only), employees get only their own
app.get('/api/reports', auth(), (req, res) => {
  if (['admin', 'manager'].includes(req.user.role)) {
    return res.json(reports);
  }
  // Employee: only see their own reports
  const userReports = reports.filter(r => r.userId === req.user.userId);
  res.json(userReports);
});

// AI-powered phishing analyzer endpoint (mocked for demo, enhanced for links)
app.post('/api/analyze-phishing', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email text is required.' });

  const lower = email.toLowerCase();
  let analysis = '';

  // Check for suspicious links
  const suspiciousLinkPatterns = [
    /http:\/\/login-?\w*\.(com|net|org)/,
    /http:\/\/\w+-?secure\.(com|net|org)/,
    /reset-password/,
    /verify-your-account/,
    /suspicious-link/,
    /bank|paypal|account|secure|update|confirm/,
  ];
  const safeLinkPatterns = [
    /https:\/\/www\.microsoft\.com/,
    /https:\/\/www\.google\.com/,
    /https:\/\/github\.com/,
    /https:\/\/darey\.io/,
  ];
  const containsSuspiciousLink = suspiciousLinkPatterns.some((re) => re.test(lower));
  const containsSafeLink = safeLinkPatterns.some((re) => re.test(lower));

  // Detect if input is a link (URL)
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const isLink = urlRegex.test(email.trim());

  if (isLink) {
    if (containsSuspiciousLink) {
      analysis = `This link is likely a phishing attempt.\n\nReasons:\n- The link matches patterns commonly used in phishing attacks.\n- Be cautious with links that ask for credentials, especially if they look unusual or urgent.`;
    } else if (containsSafeLink) {
      analysis = `This link appears to be safe and from a trusted source.\n\nHowever, always verify the sender and context before clicking any link.`;
    } else {
      analysis = `This link does not contain obvious signs of phishing, but always verify the sender and be cautious with unexpected requests or links.`;
    }
  } else {
    if (lower.includes('password') || lower.includes('urgent') || lower.includes('click here') || lower.includes('verify your account')) {
      analysis = `This email is likely a phishing attempt.\n\nReasons:\n- It contains urgent language or requests for sensitive information.\n- Phrases like 'password', 'urgent', or 'verify your account' are common in phishing.\n- Be cautious with links or attachments.`;
    } else if (lower.includes('invoice') || lower.includes('payment')) {
      analysis = `This email may be a phishing attempt, especially if you weren't expecting an invoice or payment request.\n\nCheck the sender's address and avoid clicking links if unsure.`;
    } else {
      analysis = `This email does not contain obvious signs of phishing, but always verify the sender and be cautious with unexpected requests or links.`;
    }
  }

  // Add a random tip for realism
  const tips = [
    'Always check the sender’s email address carefully.',
    'Hover over links to see where they really go.',
    'Never share your password via email.',
    'Report suspicious emails to your IT/security team.'
  ];
  analysis += `\n\nTip: ${tips[Math.floor(Math.random() * tips.length)]}`;

  res.json({ analysis });
});

// Start server with Socket.IO
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 