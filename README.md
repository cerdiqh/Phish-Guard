# PhishGuard 🛡️

**PhishGuard** is a full-stack phishing simulation and security awareness platform that helps organisations train employees, run realistic phishing campaigns, and measure security posture — all from a single dashboard.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Security](#security)
- [Screenshots](#screenshots)
- [Roadmap](#roadmap)

---

## Features

### Phishing Campaign Management
- Create campaigns with a template selector, manual target entry (email/name/department), or bulk CSV import
- Schedule campaigns for a future date
- Real-time email delivery tracking via Socket.IO (sent, opened, clicked)
- Pause and resume active campaigns
- Automatic "You've been phished!" awareness landing page served to anyone who clicks a simulation link

### Email Template Library
- Persistent MongoDB-backed templates (admin/manager)
- 3 built-in default templates seeded on startup: credential harvest, CEO invoice, software update
- Full CRUD — create, edit, delete custom templates
- Difficulty ratings (Easy / Medium / Hard) and phishing indicator tags

### Security Awareness Training
- 4 interactive modules with real lesson content:
  - Phishing Fundamentals
  - Advanced Social Engineering
  - Mobile Security Awareness
  - Incident Response Protocol
- 5-question quiz bank per module with immediate feedback and explanations
- Pass/fail scoring (60% threshold), retry support
- Progress tracked in browser localStorage

### Phishing Email Analyzer
- Paste any email or URL to get an instant AI-style analysis
- Detects suspicious patterns: urgency language, lookalike domains, credential requests
- Returns actionable tips and risk verdict

### User Management (Admin)
- List all registered users with role badges
- Change user roles (Employee / Manager / Admin) via dropdown
- Delete users with confirmation modal
- Role permission legend

### User Profile
- Edit username and email address
- Change password with current-password verification

### Authentication
- JWT-based authentication (token stored in localStorage)
- Secure registration — role always set to `employee` (no self-promotion)
- Forgot Password flow — email link with 1-hour expiry token
- Reset Password — token validated server-side, secure new password set

### UI / UX
- Dark mode toggle with localStorage persistence
- Notification bell with unread badge and live event feed
- User avatar dropdown with profile link and logout
- Fully responsive layout (mobile-friendly)
- Toast notifications for all actions
- Real-time updates via Socket.IO

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Real-time | Socket.IO |
| Auth | JSON Web Tokens (JWT), bcryptjs |
| Email | Nodemailer |
| Security | Helmet, express-rate-limit, CORS allowlist |
| Icons | Lucide React |
| Notifications | react-hot-toast |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm

### 1. Clone the repository

```bash
git clone https://github.com/cerdiqh/Phish-Guard.git
cd Phish-Guard
```

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npm run dev
```

### 3. Set up the frontend

```bash
cd ../project
npm install
cp .env.example .env   # set VITE_API_URL
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:5000`.

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Required
MONGO_URI=mongodb://localhost:27017/phishguard
JWT_SECRET=your_strong_random_secret_here

# URLs (update for production)
API_BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# Email (Nodemailer — use Gmail App Password or SMTP)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=PhishGuard <your_email@gmail.com>

# Optional: extra allowed CORS origins (comma-separated)
EXTRA_ORIGINS=https://yourdomain.com
```

### Frontend (`project/.env`)

```env
VITE_API_URL=http://localhost:5000
```

---

## Project Structure

```
Phish-Guard/
├── backend/
│   ├── index.js              # Express app, all API routes, Socket.IO
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   └── models/
│       ├── User.js           # User schema (roles, reset tokens)
│       ├── Campaign.js       # Campaign schema with email tracking
│       └── Template.js       # Phishing email template schema
│
└── project/                  # React + TypeScript frontend
    └── src/
        ├── App.tsx           # Root: routing, auth state, dark mode
        ├── components/
        │   ├── Layout.tsx          # Navigation, dark mode, bell, user menu
        │   ├── Dashboard.tsx       # Overview stats and charts
        │   ├── CampaignManager.tsx # Campaign list, creation modal
        │   ├── TemplateLibrary.tsx # Template CRUD
        │   ├── Training.tsx        # Lesson content + quiz engine
        │   ├── PhishingAnalyzer.tsx# Email/URL risk analyzer
        │   ├── Reports.tsx         # Campaign reports
        │   ├── UserManagement.tsx  # Admin user table
        │   ├── UserProfile.tsx     # Profile + password change
        │   ├── ForgotPassword.tsx  # Forgot password form
        │   ├── ResetPassword.tsx   # Reset password form
        │   ├── Login.tsx           # Login form
        │   ├── Register.tsx        # Registration form
        │   ├── LandingPage.tsx     # Public landing page
        │   └── Chatbot.tsx         # Contextual assistant
        └── types/
            └── index.ts            # Shared TypeScript types
```

---

## API Reference

### Authentication
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/register` | Public | Register new user |
| POST | `/api/login` | Public | Login, returns JWT |
| POST | `/api/forgot-password` | Public | Send reset email |
| POST | `/api/reset-password` | Public | Reset password with token |

### Profile
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/profile` | Auth | Get own profile |
| PATCH | `/api/profile` | Auth | Update username/email |
| PATCH | `/api/profile/password` | Auth | Change password |

### Users (Admin)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/users` | Admin | List all users |
| PATCH | `/api/users/:id/role` | Admin | Change user role |
| DELETE | `/api/users/:id` | Admin | Delete user |

### Campaigns
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/campaigns` | Auth | List all campaigns |
| POST | `/api/campaigns` | Admin | Create campaign + send emails |
| PATCH | `/api/campaigns/:id/status` | Admin | Pause / resume |

### Templates
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/templates` | Auth | List all templates |
| POST | `/api/templates` | Admin/Manager | Create template |
| PUT | `/api/templates/:id` | Admin/Manager | Update template |
| DELETE | `/api/templates/:id` | Admin/Manager | Delete template |

### Tracking
| Method | Endpoint | Description |
|---|---|---|
| GET | `/track/open/:campaignId/:tid` | Tracking pixel — records email open |
| GET | `/track/click/:campaignId/:tid` | Records click, redirects to awareness page |
| GET | `/phished/:campaignId/:tid` | "You've been phished!" awareness page |

### Analyzer
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/analyze-phishing` | Auth | Analyze email or URL for phishing |

---

## Security

- **Helmet** — sets secure HTTP headers on every response
- **Rate limiting** — 20 requests per 15 minutes on `/api/login` and `/api/register`
- **CORS allowlist** — only configured origins accepted (no wildcard)
- **JWT from environment** — secret never hardcoded
- **Role enforcement** — registration always assigns `employee`; role changes require `admin` JWT
- **Password hashing** — bcrypt with cost factor 12
- **Reset tokens** — cryptographically random, 1-hour expiry, single-use

---

## Roadmap

- [ ] Two-factor authentication (TOTP)
- [ ] PDF report export per campaign
- [ ] AI-powered email generation for templates
- [ ] Department-level risk scoring
- [ ] Scheduled campaign auto-launch
- [ ] SSO / LDAP integration

---

## License

MIT © PhishGuard
