const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const Campaign = require('./models/Campaign');
const User = require('./models/User');
const Template = require('./models/Template');
const TargetGroup = require('./models/TargetGroup');
const TrainingCompletion = require('./models/TrainingCompletion');
const AuditLog = require('./models/AuditLog');
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

// ─── Audit helper ─────────────────────────────────────────────────────────────
async function logAudit(req, action, details) {
  try {
    const userId = req.user?.userId;
    const userEmail = req.user?.email || (userId ? (await User.findById(userId).select('email').lean())?.email : null);
    await AuditLog.create({ userId, userEmail, action, details, ip: req.ip });
  } catch {}
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

app.get('/phished/:campaignId/:tid', async (req, res) => {
  let indicators = ['Urgency or pressure tactics', 'Suspicious sender domain', 'Generic greeting (Dear Employee)', 'Unexpected link or attachment', 'Request for credentials or personal info'];
  try {
    const campaign = await Campaign.findById(req.params.campaignId).lean();
    if (campaign && campaign.template && Array.isArray(campaign.template.indicators) && campaign.template.indicators.length > 0) {
      indicators = campaign.template.indicators;
    }
  } catch {}
  const indicatorItems = indicators.map(i => `<li>${i}</li>`).join('');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Security Awareness — PhishGuard</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
  .card{background:#fff;border-radius:16px;max-width:560px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,.5);overflow:hidden}
  .header{background:linear-gradient(135deg,#c62828,#b71c1c);padding:32px;text-align:center;color:#fff}
  .icon{font-size:56px;margin-bottom:12px}
  .header h1{font-size:28px;font-weight:700;letter-spacing:-0.5px}
  .header p{margin-top:8px;opacity:.9;font-size:15px}
  .body{padding:28px 32px}
  .badge{display:inline-flex;align-items:center;gap:6px;background:#fce4ec;color:#c62828;border-radius:20px;padding:6px 14px;font-size:13px;font-weight:600;margin-bottom:20px}
  .section{margin-bottom:24px}
  .section h2{font-size:15px;font-weight:700;color:#1a1a2e;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px}
  .indicators{background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:16px}
  .indicators ul{padding-left:20px;color:#5d4037;font-size:14px;line-height:1.9}
  .info{background:#e3f2fd;border:1px solid #90caf9;border-radius:10px;padding:16px;font-size:14px;color:#0d47a1;line-height:1.6}
  .cta{text-align:center;margin-top:28px}
  .cta a{display:inline-block;background:linear-gradient(135deg,#1565c0,#0d47a1);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px;transition:opacity .2s}
  .cta a:hover{opacity:.85}
  .footer{text-align:center;padding:16px 32px;border-top:1px solid #f0f0f0;font-size:12px;color:#9e9e9e}
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="icon">🎣</div>
    <h1>You've Been Phished!</h1>
    <p>This was a controlled security awareness simulation</p>
  </div>
  <div class="body">
    <div style="text-align:center"><span class="badge">⚠️ Security Awareness Test</span></div>
    <div class="section">
      <div class="info">
        <strong>Don't panic</strong> — no real data was collected and your account is safe. This test was conducted by your organisation's security team to help identify areas for improvement.
      </div>
    </div>
    <div class="section">
      <h2>Clues you may have missed</h2>
      <div class="indicators">
        <ul>${indicatorItems}</ul>
      </div>
    </div>
    <div class="section">
      <h2>What to do next time</h2>
      <div class="info">
        Before clicking any link: verify the sender's email address, hover over links to preview the URL, check for urgency or pressure tactics, and report suspicious emails to IT security.
      </div>
    </div>
    <div class="cta">
      <a href="${FRONTEND_URL}">Take Security Training →</a>
    </div>
  </div>
  <div class="footer">PhishGuard Security Awareness Platform · This simulation is confidential</div>
</div>
</body>
</html>`);
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'PhishGuard API running' }));

app.post('/api/register', authLimiter, async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  const normalEmail = email.toLowerCase().trim();
  try {
    // If account exists but is unverified, delete it and allow re-registration
    const existing = await User.findOne({ email: normalEmail });
    if (existing && !existing.emailVerified) {
      await User.deleteOne({ _id: existing._id });
    }
    const hashed = await bcrypt.hash(password, 12);
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const emailEnabled = !!process.env.EMAIL_USER;
    const user = new User({
      username: username.trim(),
      email: normalEmail,
      password: hashed,
      role: 'employee',
      emailVerified: !emailEnabled,
      verifyToken: emailEnabled ? verifyToken : null,
    });
    await user.save();
    await AuditLog.create({ userEmail: normalEmail, action: 'register', details: `New user registered: ${username}`, ip: req.ip });
    if (emailEnabled) {
      try {
        await sendMail({
          to: normalEmail,
          subject: 'Verify your PhishGuard account',
          html: `<h2>Welcome to PhishGuard!</h2><p>Click the link below to verify your email address:</p><p><a href="${FRONTEND_URL}?verify=${verifyToken}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Verify Email</a></p><p>If you didn't create this account, ignore this email.</p>`,
        });
        return res.status(201).json({ message: 'Registration successful! Check your email to verify your account.', requiresVerification: true });
      } catch (mailErr) {
        // Email failed — auto-verify so user isn't locked out
        await User.updateOne({ _id: user._id }, { $set: { emailVerified: true }, $unset: { verifyToken: '' } });
        return res.status(201).json({ message: 'User registered successfully', requiresVerification: false });
      }
    }
    res.status(201).json({ message: 'User registered successfully', requiresVerification: false });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Username already in use' });
    res.status(400).json({ error: 'Registration failed' });
  }
});

app.get('/api/verify-email/:token', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { verifyToken: req.params.token },
      { $set: { emailVerified: true }, $unset: { verifyToken: '' } },
      { new: true }
    );
    if (!user) return res.status(400).json({ error: 'Invalid or expired verification link' });
    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch {
    res.status(500).json({ error: 'Server error' });
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
    if (!user.emailVerified) return res.status(400).json({ error: 'Please verify your email before logging in. Check your inbox for the verification link.' });
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    await AuditLog.create({ userId: user._id, userEmail: user.email, action: 'login', details: `User logged in`, ip: req.ip });
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
      });
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
  await logAudit(req, 'role_change', `Changed ${user.email} role to ${role}`);
  res.json(user);
});

app.delete('/api/users/:id', auth('admin'), async (req, res) => {
  if (req.params.id === req.user.userId.toString()) return res.status(400).json({ error: 'Cannot delete your own account' });
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  await logAudit(req, 'user_delete', `Deleted user: ${user.email}`);
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
    await logAudit(req, 'template_create', `Created template: ${template.name}`);
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
  await logAudit(req, 'template_delete', `Deleted template: ${template.name}`);
  res.json({ message: 'Deleted' });
});

app.post('/api/templates/:id/send-test', auth(), async (req, res) => {
  if (!['admin', 'manager'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { toEmail } = req.body;
  if (!toEmail) return res.status(400).json({ error: 'Recipient email required' });
  const template = await Template.findById(req.params.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  try {
    const html = `<div style="border:2px dashed #f59e0b;padding:12px;margin-bottom:16px;background:#fffbeb;border-radius:8px;font-family:sans-serif;font-size:13px;color:#92400e;">
      ⚠️ <strong>PHISHGUARD TEST EMAIL</strong> — This is a simulation test, not a real phishing email.
    </div>` + template.content.replace(/\[PHISHING_LINK\]/g, '<a href="#">[SIMULATED LINK]</a>');
    await sendMail({ to: toEmail, subject: `[TEST] ${template.subject}`, html });
    res.json({ message: `Test email sent to ${toEmail}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send email. Check email configuration.' });
  }
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

  await logAudit(req, 'campaign_create', `Created campaign: ${campaign.name} with ${targets.length} targets`);
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

// ─── Export ───────────────────────────────────────────────────────────────────
app.get('/api/export/campaigns', auth(), async (req, res) => {
  if (!['admin', 'manager'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const campaigns = await Campaign.find().sort({ createdAt: -1 }).lean();
  const data = campaigns.map(c => {
    const sent = (c.emailStatus || []).length;
    const opened = (c.emailStatus || []).filter(e => e.openCount > 0).length;
    const clicked = (c.emailStatus || []).filter(e => e.clickCount > 0).length;
    return {
      name: c.name,
      status: c.status,
      sent,
      opened,
      clicked,
      openRate: sent ? ((opened / sent) * 100).toFixed(1) + '%' : '0%',
      clickRate: sent ? ((clicked / sent) * 100).toFixed(1) + '%' : '0%',
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '',
    };
  });
  res.json(data);
});

// ─── Campaign target details ──────────────────────────────────────────────────
app.get('/api/campaigns/:id/targets', auth(), async (req, res) => {
  const campaign = await Campaign.findById(req.params.id).lean();
  if (!campaign) return res.status(404).json({ error: 'Not found' });
  const result = (campaign.targets || []).map(t => {
    const es = (campaign.emailStatus || []).find(e => e.email === t.email);
    return {
      email: t.email,
      name: t.name || '',
      department: t.department || '',
      status: es?.status || 'pending',
      openCount: es?.openCount || 0,
      clickCount: es?.clickCount || 0,
      lastOpenedAt: es?.lastOpenedAt || null,
      lastClickedAt: es?.lastClickedAt || null,
    };
  });
  res.json(result);
});

// ─── Send reminder ────────────────────────────────────────────────────────────
app.post('/api/campaigns/:id/send-reminder', auth('admin'), async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Not found' });
  if (campaign.status !== 'active') return res.status(400).json({ error: 'Campaign is not active' });
  const template = campaign.template;
  let sent = 0;
  for (const target of campaign.targets || []) {
    const es = (campaign.emailStatus || []).find(e => e.email === target.email);
    if (!es || es.openCount === 0) {
      try {
        const tid = trackingId(campaign._id, target.email);
        const openPixel = `<img src="${API_BASE_URL}/track/open/${campaign._id}/${tid}" width="1" height="1" style="display:none" />`;
        const clickUrl = `${API_BASE_URL}/track/click/${campaign._id}/${tid}`;
        const html = template.content.replace(/\[PHISHING_LINK\]/g, `<a href="${clickUrl}">Click here</a>`) + openPixel;
        await sendMail({ to: target.email, subject: `Reminder: ${template.subject}`, html });
        sent++;
      } catch {}
    }
  }
  campaign.reminderSent = true;
  await campaign.save();
  await logAudit(req, 'reminder_sent', `Sent reminder for campaign: ${campaign.name} to ${sent} targets`);
  res.json({ message: `Reminder sent to ${sent} unopened targets` });
});

// ─── Target Groups ────────────────────────────────────────────────────────────
app.get('/api/target-groups', auth(), async (req, res) => {
  const groups = await TargetGroup.find({ createdBy: req.user.userId }).sort({ createdAt: -1 });
  res.json(groups);
});

app.post('/api/target-groups', auth(), async (req, res) => {
  const { name, targets = [] } = req.body;
  if (!name) return res.status(400).json({ error: 'Group name required' });
  try {
    const group = await TargetGroup.create({ name, targets, createdBy: req.user.userId });
    res.status(201).json(group);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to create group' });
  }
});

app.delete('/api/target-groups/:id', auth(), async (req, res) => {
  const group = await TargetGroup.findOneAndDelete({ _id: req.params.id, createdBy: req.user.userId });
  if (!group) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

// ─── Risk Scores ──────────────────────────────────────────────────────────────
app.get('/api/employees/risk-scores', auth(), async (req, res) => {
  if (!['admin', 'manager'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const campaigns = await Campaign.find().lean();
  const map = {};
  for (const c of campaigns) {
    for (const t of c.targets || []) {
      if (!t.email) continue;
      if (!map[t.email]) map[t.email] = { email: t.email, name: t.name || '', openCount: 0, clickCount: 0, campaigns: 0 };
      map[t.email].campaigns++;
      const es = (c.emailStatus || []).find(e => e.email === t.email);
      if (es) {
        map[t.email].openCount += (es.openCount || 0);
        map[t.email].clickCount += (es.clickCount || 0);
      }
    }
  }
  const result = Object.values(map).map(e => {
    let riskLevel = 'Low';
    let riskScore = 0;
    if (e.clickCount > 0) { riskLevel = 'High'; riskScore = Math.min(100, e.clickCount * 30 + e.openCount * 10); }
    else if (e.openCount > 0) { riskLevel = 'Medium'; riskScore = Math.min(60, e.openCount * 10); }
    return { ...e, riskLevel, riskScore };
  }).sort((a, b) => b.riskScore - a.riskScore);
  res.json(result);
});

// ─── Training completion ──────────────────────────────────────────────────────
app.post('/api/training/complete', auth(), async (req, res) => {
  const { moduleId, score, passed } = req.body;
  if (!moduleId) return res.status(400).json({ error: 'moduleId required' });
  try {
    const existing = await TrainingCompletion.findOne({ userId: req.user.userId, moduleId });
    if (existing) {
      existing.score = score;
      existing.passed = passed;
      existing.completedAt = new Date();
      await existing.save();
    } else {
      await TrainingCompletion.create({ userId: req.user.userId, moduleId, score, passed });
    }
    res.json({ message: 'Progress saved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

app.get('/api/training/progress', auth(), async (req, res) => {
  const completions = await TrainingCompletion.find({ userId: req.user.userId }).lean();
  res.json(completions);
});

app.get('/api/training/all-progress', auth(), async (req, res) => {
  if (!['admin', 'manager'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const completions = await TrainingCompletion.find().populate('userId', 'username email').lean();
  res.json(completions);
});

// ─── Audit Log ────────────────────────────────────────────────────────────────
app.get('/api/audit-log', auth('admin'), async (req, res) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100).lean();
  res.json(logs);
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
