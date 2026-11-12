const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const Campaign = require('./models/Campaign');
const User = require('./models/User');
const Template = require('./models/Template');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const http = require('http');
const { Server } = require('socket.io');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_set_JWT_SECRET_env';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  FRONTEND_URL,
  ...(process.env.EXTRA_ORIGINS ? process.env.EXTRA_ORIGINS.split(',') : []),
].filter(Boolean);

const app = express();

app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json({ limit: '2mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/phishguard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
  seedTemplates();
}).catch(err => console.error('MongoDB error:', err));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] }
});
io.on('connection', socket => console.log('Client connected:', socket.id));

// ─── Email ────────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

async function sendMail({ to, subject, html }) {
  if (!process.env.EMAIL_USER) return;
  return transporter.sendMail({ from: process.env.EMAIL_FROM || process.env.EMAIL_USER, to, subject, html });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function trackingId(campaignId, email) {
  return crypto.createHash('sha256').update(`${campaignId}:${email}`).digest('hex');
}

const TRANSPARENT_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');

// ─── Seed default templates ───────────────────────────────────────────────────
async function seedTemplates() {
  const count = await Template.countDocuments();
  if (count > 0) return;
  await Template.insertMany([
    {
      name: 'Urgent Password Reset',
      subject: 'URGENT: Your account will be suspended',
      sender: 'security@company-portal.com',
      content: `Dear Employee,\n\nWe've detected suspicious activity on your account. Your password must be reset immediately.\n\nClick here to secure your account: [PHISHING_LINK]\n\nThis link will expire in 2 hours.\n\nSecurity Team`,
      type: 'credential_harvest',
      difficulty: 'easy',
      indicators: ['Urgency tactics', 'Suspicious sender domain', 'Generic greeting'],
    },
    {
      name: 'CEO Invoice Request',
      subject: 'Re: Urgent Payment Processing',
      sender: 'ceo@company.com',
      content: `Hi,\n\nI'm in a meeting and need you to process this invoice immediately. The vendor is waiting.\n\nPlease review: [PHISHING_LINK]\n\nThanks,\nJohn Smith\nCEO`,
      type: 'spear_phishing',
      difficulty: 'hard',
      indicators: ['Authority impersonation', 'Pressure tactics', 'Minimal details'],
    },
    {
      name: 'Critical Software Update',
      subject: 'Critical Security Update - Action Required',
      sender: 'updates@microsoft-security.com',
      content: `Microsoft Security Alert\n\nA critical vulnerability has been discovered. Download the emergency patch:\n\n[PHISHING_LINK]\n\nThis must be installed within 24 hours.\n\nMicrosoft Security Team`,
      type: 'malware',
      difficulty: 'medium',
      indicators: ['Fake urgency', 'Impersonation', 'Suspicious download link'],
    },
  ]);
  console.log('Default templates seeded');
}

// ─── Tracking ─────────────────────────────────────────────────────────────────
app.get('/track/open/:campaignId/:tid', async (req, res) => {
  res.set('Content-Type', 'image/gif');
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    if (campaign) {
      const entry = (campaign.emailStatus || []).find(e => trackingId(req.params.campaignId, e.email) === req.params.tid);
      if (entry) {
        entry.openCount = (entry.openCount || 0) + 1;
        entry.lastOpenedAt = new Date();
        await campaign.save();
        io.emit('emailOpened', { campaignId: req.params.campaignId, email: entry.email, openCount: entry.openCount });
      }
    }
  } catch {}
  res.send(TRANSPARENT_GIF);
});

app.get('/track/click/:campaignId/:tid', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    if (campaign) {
      const entry = (campaign.emailStatus || []).find(e => trackingId(req.params.campaignId, e.email) === req.params.tid);
      if (entry) {
        entry.clickCount = (entry.clickCount || 0) + 1;
        entry.lastClickedAt = new Date();
        await campaign.save();
        io.emit('emailClicked', { campaignId: req.params.campaignId, email: entry.email, clickCount: entry.clickCount });
      }
    }
  } catch {}
  res.redirect(`${API_BASE_URL}/phished/${req.params.campaignId}/${req.params.tid}`);
});

app.get('/phished/:campaignId/:tid', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Security Awareness</title><style>*{box-sizing:border-box}body{font-family:sans-serif;background:#1e3a5f;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}div{background:#fff;border-radius:12px;padding:40px;max-width:480px;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,.4)}.icon{font-size:60px;margin-bottom:16px}h1{color:#d32f2f;font-size:24px;margin:0 0 12px}p{color:#444;line-height:1.6}strong{color:#1e3a5f}.badge{display:inline-block;background:#e8f5e9;color:#2e7d32;border-radius:20px;padding:4px 14px;font-size:13px;margin-top:20px;font-weight:600}</style></head><body><div><div class="icon">🎣</div><h1>You've Been Phished!</h1><p>This was a <strong>security awareness test</strong> from your organisation's IT team. You clicked a link in a simulated phishing email.</p><p style="margin-top:16px">Don't worry — no real data was collected. This test helps identify areas for improvement.</p><p style="margin-top:16px"><strong>What to do next:</strong><br>Be cautious of unexpected emails, check sender addresses, and report suspicious messages to IT.</p><div class="badge">✓ PhishGuard Simulation</div></div></body></html>`);
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'PhishGuard API running' }));

app.post('/api/register', authLimiter, async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    const hashed = await bcrypt.hash(password, 12);
    const user = new User({ username: username.trim(), email: email.toLowerCase().trim(), password: hashed, role: 'employee' });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Username or email already in use' });
    res.status(400).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { _id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Forgot / Reset password ──────────────────────────────────────────────────
app.post('/api/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.resetToken = token;
      user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      const link = `${FRONTEND_URL}/?reset=1&token=${token}`;
      await sendMail({
        to: user.email,
        subject: 'PhishGuard password reset',
        html: `<p>Hi ${user.username},</p><p>Click the link below to reset your password. It expires in 1 hour.</p><p><a href="${link}">${link}</a></p><p>If you did not request this, ignore this email.</p>`,
      }).catch(() => {});
    }
    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/reset-password', authLimiter, async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });
    user.password = await bcrypt.hash(password, 12);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    res.json({ message: 'Password reset successfully' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Profile ──────────────────────────────────────────────────────────────────
app.get('/api/profile', auth(), async (req, res) => {
  const user = await User.findById(req.user.userId).select('-password -resetToken -resetTokenExpiry');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.patch('/api/profile', auth(), async (req, res) => {
  const { username, email } = req.body;
  if (!username && !email) return res.status(400).json({ error: 'Nothing to update' });
  try {
    const update = {};
    if (username) update.username = username.trim();
    if (email) update.email = email.toLowerCase().trim();
    const user = await User.findByIdAndUpdate(req.user.userId, update, { new: true, runValidators: true }).select('-password -resetToken -resetTokenExpiry');
    res.json(user);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Username or email already in use' });
    res.status(400).json({ error: 'Update failed' });
  }
});

app.patch('/api/profile/password', auth(), async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
  try {
    const user = await User.findById(req.user.userId);
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ error: 'Current password is incorrect' });
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Password updated' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── User Management (admin) ──────────────────────────────────────────────────
app.get('/api/users', auth('admin'), async (req, res) => {
  const users = await User.find().select('-password -resetToken -resetTokenExpiry').sort({ createdAt: -1 });
  res.json(users);
});

app.patch('/api/users/:id/role', auth('admin'), async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'manager', 'employee'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.delete('/api/users/:id', auth('admin'), async (req, res) => {
  if (req.params.id === req.user.userId.toString()) return res.status(400).json({ error: 'Cannot delete your own account' });
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ message: 'User deleted' });
});

// ─── Templates ────────────────────────────────────────────────────────────────
app.get('/api/templates', auth(), async (req, res) => {
  const templates = await Template.find().sort({ createdAt: -1 });
  res.json(templates);
});

app.post('/api/templates', auth(), async (req, res) => {
  if (!['admin', 'manager'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const template = new Template({ ...req.body, createdBy: req.user.userId });
    await template.save();
    res.status(201).json(template);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to create template' });
  }
});

app.put('/api/templates/:id', auth(), async (req, res) => {
  if (!['admin', 'manager'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const template = await Template.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!template) return res.status(404).json({ error: 'Not found' });
  res.json(template);
});

app.delete('/api/templates/:id', auth(), async (req, res) => {
  if (!['admin', 'manager'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const template = await Template.findByIdAndDelete(req.params.id);
  if (!template) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

// ─── Campaigns ────────────────────────────────────────────────────────────────
app.get('/api/campaigns', auth(), async (req, res) => {
  const campaigns = await Campaign.find().sort({ createdAt: -1 });
  res.json(campaigns);
});

app.post('/api/campaigns', auth('admin'), async (req, res) => {
  const { name, description, templateId, targets = [], scheduledAt } = req.body;
  if (!name) return res.status(400).json({ error: 'Campaign name required' });
  if (!templateId) return res.status(400).json({ error: 'Template required' });

  const template = await Template.findById(templateId);
  if (!template) return res.status(404).json({ error: 'Template not found' });

  const campaign = new Campaign({
    name,
    description,
    status: scheduledAt ? 'draft' : 'active',
    createdAt: new Date(),
    targetCount: targets.length,
    clickCount: 0,
    reportCount: 0,
    template: { name: template.name, subject: template.subject, sender: template.sender, content: template.content, type: template.type, difficulty: template.difficulty, indicators: template.indicators },
    targets: targets.map(t => ({ email: t.email, name: t.name || '', department: t.department || '' })),
    scheduledAt: scheduledAt || null,
    emailStatus: [],
  });
  await campaign.save();

  if (!scheduledAt) {
    for (const target of targets) {
      try {
        const tid = trackingId(campaign._id, target.email);
        const openPixel = `<img src="${API_BASE_URL}/track/open/${campaign._id}/${tid}" width="1" height="1" style="display:none" />`;
        const clickUrl = `${API_BASE_URL}/track/click/${campaign._id}/${tid}`;
        const html = template.content.replace(/\[PHISHING_LINK\]/g, `<a href="${clickUrl}">Click here</a>`) + openPixel;
        await sendMail({ to: target.email, subject: template.subject, html });
        campaign.emailStatus.push({ email: target.email, status: 'sent', openCount: 0, clickCount: 0 });
        io.emit('emailStatus', { campaignId: campaign._id, email: target.email, status: 'sent' });
      } catch (err) {
        campaign.emailStatus.push({ email: target.email, status: 'failed', error: err.message });
        io.emit('emailStatus', { campaignId: campaign._id, email: target.email, status: 'failed', error: err.message });
      }
    }
    await campaign.save();
  }

  io.emit('campaignCreated', campaign);
  res.status(201).json(campaign);
});

app.patch('/api/campaigns/:id/status', auth('admin'), async (req, res) => {
  const { status } = req.body;
  if (!['active', 'paused', 'completed', 'draft'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const campaign = await Campaign.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!campaign) return res.status(404).json({ error: 'Not found' });
  io.emit('campaignUpdated', campaign);
  res.json(campaign);
});

// ─── Reports ──────────────────────────────────────────────────────────────────
app.get('/api/reports', auth(), async (req, res) => {
  if (['admin', 'manager'].includes(req.user.role)) {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    return res.json(campaigns);
  }
  res.json([]);
});

// ─── Phishing analyzer ───────────────────────────────────────────────────────
app.post('/api/analyze-phishing', auth(), (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email text is required.' });
  const lower = email.toLowerCase();
  const urlRe = /(https?:\/\/[^\s]+)/g;
  const isLink = urlRe.test(email.trim());

  const suspiciousPatterns = [/http:\/\//, /reset-password/, /verify-your-account/, /suspicious-link/, /paypal|bank|account-secure|update-confirm/];
  const safeHosts = ['https://www.microsoft.com', 'https://www.google.com', 'https://github.com'];
  const suspicious = suspiciousPatterns.some(r => r.test(lower));
  const safe = safeHosts.some(h => lower.includes(h));

  let analysis = '';
  if (isLink) {
    if (suspicious) analysis = 'This link is likely a phishing attempt.\n\n- Matches patterns commonly used in attacks.\n- Never enter credentials on a site reached via an unexpected link.';
    else if (safe) analysis = 'This link appears to be from a trusted source.\n\nAlways verify the sender and context before clicking.';
    else analysis = 'No obvious phishing indicators found, but always verify the sender before clicking any link.';
  } else {
    if (lower.includes('password') || lower.includes('urgent') || lower.includes('click here') || lower.includes('verify your account')) {
      analysis = 'This email is likely a phishing attempt.\n\n- Contains urgent language or requests for sensitive information.\n- Be cautious with any links or attachments.';
    } else if (lower.includes('invoice') || lower.includes('payment')) {
      analysis = 'This email may be a phishing attempt, especially if you were not expecting a payment request.\n\nCheck the sender and avoid clicking links if unsure.';
    } else {
      analysis = 'No obvious phishing indicators found. Always verify the sender and be cautious with unexpected requests.';
    }
  }

  const tips = [
    'Always check the sender\'s email address carefully.',
    'Hover over links to see where they really go before clicking.',
    'Never share your password via email.',
    'Report suspicious emails to your IT/security team.',
  ];
  analysis += `\n\nTip: ${tips[Math.floor(Math.random() * tips.length)]}`;
  res.json({ analysis });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
