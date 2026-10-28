# Akatsuki's Draft: AI-Enabled Content Sharing Platform (Backend)

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.21%2B-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose-brightgreen.svg)](https://www.mongodb.com/atlas)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)
[![Event](https://img.shields.io/badge/Nodevember-4.0-orange.svg)](#)

> **Akatsuki's Draft** is a secure, production-grade RESTful API backend built for the **Nodevember 4.0** post-event task organized by **Akatsuki Coding Club**. It provides role-based authentication, user content and draft management, editorial approval workflows, and AI-powered draft enhancement via Google's Gemini API.

---

## Table of Contents
1. [Submission Details](#submission-details)
2. [Key Features](#key-features)
3. [Architecture & Folder Structure](#architecture--folder-structure)
4. [Prerequisites](#prerequisites)
5. [Local Installation & Setup](#local-installation--setup)
6. [Environment Variables](#environment-variables)
7. [Database Setup (Atlas & Local)](#database-setup-atlas--local)
8. [Admin Account Bootstrap](#admin-account-bootstrap)
9. [API Reference & Examples](#api-reference--examples)
10. [AI Integration (Google Gemini)](#ai-integration-google-gemini)
11. [Testing & Quality Assurance (Newman & Automated Tests)](#testing--quality-assurance)
12. [MongoDB Data Verification](#mongodb-data-verification)
13. [Vercel Deployment Guide](#vercel-deployment-guide)
14. [GitHub Publication Guide](#github-publication-guide)
15. [FreeCodeCamp Certification Guide](#freecodecamp-certification-guide)
16. [Security Highlights](#security-highlights)

---

## Submission Details

| Item | Details / Link |
|---|---|
| **Author** | Rohit Vinod Borse |
| **GitHub Repository** | `https://github.com/rohitborse210-AI/akatsukis-draft-backend` *(configured & ready)* |
| **Deployed Production URL (Vercel)** | `https://akatsukis-draft-backend.vercel.app` *(configured & ready for Vercel import)* |
| **FreeCodeCamp Certificate URL** | `https://www.freecodecamp.org/certification/rohitborse210/back-end-development-and-apis-v9` *(workflow documented below)* |

---

## Key Features

- **Strict Role-Based Access Control (RBAC)**: Distinct permissions for `user` and `admin` roles. Public registration is locked to ordinary `user` accounts. Initial admin creation is performed via secure bootstrap scripts or environment control.
- **Editorial Publishing Lifecycle**: Posts transition through explicit lifecycle states:
  - `draft`: Private to the author.
  - `pending`: Submitted for administrator editorial review.
  - `approved`: Publicly accessible to all users and visitors.
  - `rejected`: Returned to the author with an optional reviewer rationale; eligible for resubmission.
  - **Edit Re-Approval Protection**: Editing any approved post automatically resets its status to `pending`, preventing unauthorized live content modifications.
- **Google Gemini AI Content Polishing**:
  - Enhances grammar, readability, structure, and professional flow while strictly preserving author meaning and facts.
  - User post text is handled as untrusted content to prevent prompt injection.
  - Saves improved output as a **brand new draft document with a unique MongoDB ObjectId**, leaving the original draft untouched.
- **Production Hardened**:
  - `helmet` security headers and origin-restricted `cors`.
  - Stricter rate-limiting for authentication endpoints and AI generation.
  - Centralized Express error handler managing Mongo duplicate keys (`11000`), CastErrors, validation faults, and JWT expirations.
  - Serverless connection reuse designed specifically for Vercel.

---

## Architecture & Folder Structure

```
akatsukis-draft-backend/
├── .env.example                     # Environment template with placeholder secrets
├── .gitignore                       # Protects node_modules, .env, and local logs
├── vercel.json                      # Vercel serverless routing rewrite configuration
├── package.json                     # ES Module dependencies & npm scripts
├── api/
│   └── index.js                     # Vercel serverless function entrypoint
├── src/
│   ├── app.js                       # Express app configuration & middleware pipeline
│   ├── server.js                    # Standalone HTTP server & graceful shutdown
│   ├── config/
│   │   ├── env.js                   # Validated environment configuration
│   │   └── db.js                    # Mongoose connection with serverless pool caching
│   ├── models/
│   │   ├── User.js                  # User schema (name, email, password, role)
│   │   └── Post.js                  # Post schema with indexes & lifecycle states
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification & user attachment
│   │   ├── rbac.js                  # Role-based authorization (requireAdmin)
│   │   ├── validate.js              # express-validator request rules
│   │   ├── rateLimiter.js           # Endpoint rate limiting
│   │   └── errorHandler.js          # Centralized error & 404 handlers
│   ├── controllers/
│   │   ├── authController.js        # Register, login, profile (/auth)
│   │   ├── postController.js        # User CRUD & lifecycle (/posts)
│   │   ├── adminController.js       # Editorial review (/admin)
│   │   └── aiController.js          # Gemini enhancement (/ai)
│   ├── routes/
│   │   ├── authRoutes.js            # POST /auth/register, /login, GET /auth/me
│   │   ├── postRoutes.js            # POST, GET, PATCH, DELETE /posts
│   │   ├── adminRoutes.js           # Review, approve, reject /admin/posts
│   │   ├── aiRoutes.js              # POST /ai/improve/:postId
│   │   └── healthRoutes.js          # GET /health
│   └── utils/
│       ├── bootstrap.js             # Automated initial admin bootstrap
│       ├── geminiService.js         # Official @google/genai SDK integration
│       └── response.js              # Standardized JSON response envelope
├── postman/
│   └── Akatsukis-Draft.postman_collection.json # Comprehensive 28-request test suite
├── scripts/
│   ├── bootstrapAdmin.js            # Standalone CLI admin provisioning script
│   ├── runNewman.js                 # Automated Newman test collection runner
│   └── verifyDatabase.js            # Direct MongoDB state inspection script
└── tests/
    └── api.test.js                  # 31 automated integration tests (Node native runner)
```

---

## Prerequisites

- **Node.js**: `v18.0.0` or higher (verified on Node `v24.20.0`).
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or MongoDB Atlas cluster.
- **npm**: `v9.0.0` or higher.
- *(Optional)* **Google Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/).

---

## Local Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/rohitborse210-AI/akatsukis-draft-backend.git
   cd akatsukis-draft-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your preferred configurations.

4. **Bootstrap Initial Administrator**:
   ```bash
   npm run bootstrap:admin
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Or production mode:
   ```bash
   npm start
   ```

6. **Verify Server Health**:
   Open [http://localhost:5000/health](http://localhost:5000/health) in your browser or curl:
   ```bash
   curl http://localhost:5000/health
   ```

---

## Environment Variables

| Variable | Required | Default / Example | Purpose |
|---|---|---|---|
| `PORT` | No | `5000` | HTTP listener port for local server |
| `NODE_ENV` | No | `development` | Environment mode (`development`, `production`, `test`) |
| `MONGODB_URI` | **Yes** | `mongodb://127.0.0.1:27017/akatsukis-draft` | MongoDB connection connection string |
| `JWT_SECRET` | **Yes** | *Secret string* | Secret key used to sign and verify JWT tokens |
| `JWT_EXPIRES_IN` | No | `7d` | JWT lifetime (`1d`, `7d`, `24h`) |
| `GEMINI_API_KEY` | Optional | `""` | Google AI Studio API key for content improvement |
| `GEMINI_MODEL` | No | `gemini-3.8-flash` | Supported Google Gemini model identifier |
| `FRONTEND_URL` | No | `*` | Allowed CORS origin (e.g. `http://localhost:3000`) |
| `ADMIN_NAME` | No | `Platform Administrator` | Initial admin display name |
| `ADMIN_EMAIL` | No | `admin@akatsuki.draft` | Initial admin email for bootstrap |
| `ADMIN_PASSWORD` | No | `Admin@SecurePassword123!` | Initial admin password for bootstrap |

---

## Database Setup (Atlas & Local)

### Option A: Local MongoDB
Ensure your local MongoDB daemon service is running on default port `27017`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/akatsukis-draft
```

### Option B: MongoDB Atlas Cluster
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Under **Database Access**, create a user with `Read and write to any database` privileges.
3. Under **Network Access**, whitelist your current IP address (or `0.0.0.0/0` for Vercel deployment).
4. Click **Connect** on your Cluster -> **Drivers** (Node.js) -> copy the URI:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.gt0g8q4.mongodb.net/akatsukis-draft?retryWrites=true&w=majority
   ```

---

## Admin Account Bootstrap

To ensure security, ordinary public registration cannot create an admin account. Use one of two secure methods:

### Method 1: Standalone CLI Script
Run the dedicated bootstrap script at any time:
```bash
npm run bootstrap:admin
```
This reads `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from `.env`, creates the account if missing, or elevates an existing user to the admin role.

### Method 2: Automatic Startup Bootstrap
Whenever the server launches with `ADMIN_EMAIL` and `ADMIN_PASSWORD` defined in `.env`, the server automatically verifies and bootstraps the admin account on boot.

---

## API Reference & Examples

All endpoints are dual-mounted at both root (`/auth/...`, `/posts/...`) and `/api` prefix (`/api/auth/...`, `/api/posts/...`) for complete Postman compatibility.

### 1. Authentication

#### Register User
- **Endpoint**: `POST /api/auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "Naruto Uzumaki",
    "email": "naruto@akatsuki.draft",
    "password": "Password123!"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "User registered successfully.",
    "data": {
      "id": "6ae23a1246c551f0709124d7",
      "name": "Naruto Uzumaki",
      "email": "naruto@akatsuki.draft",
      "role": "user",
      "createdAt": "2026-10-28T18:00:00.000Z"
    }
  }
  ```

#### Login
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "naruto@akatsuki.draft",
    "password": "Password123!"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "6ae23a1246c551f0709124d7",
        "name": "Naruto Uzumaki",
        "email": "naruto@akatsuki.draft",
        "role": "user"
      }
    }
  }
  ```

#### Get Current Profile
- **Endpoint**: `GET /api/auth/me`
- **Header**: `Authorization: Bearer <token>`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Current user profile fetched successfully.",
    "data": {
      "user": {
        "_id": "6ae23a1246c551f0709124d7",
        "name": "Naruto Uzumaki",
        "email": "naruto@akatsuki.draft",
        "role": "user"
      }
    }
  }
  ```

---

### 2. User Post Management

#### Create Post or Draft
- **Endpoint**: `POST /api/posts`
- **Header**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "title": "Mastering Modern Microservices",
    "description": "A comprehensive deep dive into scalable backend architectures.",
    "content": "Designing resilient microservices requires domain-driven boundaries, idempotent endpoints, and asynchronous event streams.",
    "category": "Architecture",
    "image": "https://example.com/cover.jpg",
    "status": "draft"
  }
  ```
  *(Allowed `status` values on creation: `"draft"` or `"pending"`. Default: `"draft"`)*.
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Post created successfully.",
    "data": {
      "_id": "6ae23b145a89...",
      "title": "Mastering Modern Microservices",
      "status": "draft",
      "createdBy": { "_id": "...", "name": "Naruto Uzumaki" }
    }
  }
  ```

#### Explore Approved Public Posts
- **Endpoint**: `GET /api/posts`
- **Access**: Public
- **Query Parameters**:
  - `page`: Page number (default: `1`)
  - `limit`: Items per page (default: `10`)
  - `category`: Filter by category (e.g. `Architecture`)
  - `search`: Full text keyword search across title, description, and content
- **Response** (`200 OK`): Returns paginated list of approved posts only.

#### View Post by ID
- **Endpoint**: `GET /api/posts/:id`
- **Access**: Public if `approved`; author or admin only if `draft`, `pending`, or `rejected`.
- **Response** (`200 OK` or `403 Forbidden`).

#### View Authenticated User's Posts
- **Endpoint**: `GET /api/posts/my-posts`
- **Header**: `Authorization: Bearer <token>`
- **Query Parameters**: `status` (`draft`, `pending`, `approved`, `rejected`), `page`, `limit`.
- **Response** (`200 OK`): Returns all posts owned by the authenticated user.

#### Update Owned Post
- **Endpoint**: `PATCH /api/posts/:id`
- **Header**: `Authorization: Bearer <token>`
- **Rules**:
  - Only the post creator can update.
  - If an `approved` post is edited, its status automatically reverts to `pending` for re-approval.
  - Users can resubmit a `rejected` post by editing it.
- **Request Body**:
  ```json
  {
    "title": "Mastering Modern Microservices (2nd Edition)",
    "status": "pending"
  }
  ```

#### Delete Post
- **Endpoint**: `DELETE /api/posts/:id`
- **Header**: `Authorization: Bearer <token>`
- **Access**: Post author or Administrator.

---

### 3. Admin Post Approval

All admin endpoints require `Authorization: Bearer <token>` where user has `role: "admin"`.

#### View Pending Review Queue
- **Endpoint**: `GET /api/admin/posts/pending`
- **Response** (`200 OK`): Returns posts with `status: "pending"`.

#### Approve Pending Post
- **Endpoint**: `PATCH /api/admin/posts/approve/:id`
- **Response** (`200 OK`): Updates post status to `"approved"`, making it live on `GET /api/posts`.

#### Reject Pending Post
- **Endpoint**: `PATCH /api/admin/posts/reject/:id`
- **Request Body**:
  ```json
  {
    "rejectionReason": "Please expand on database transaction guarantees and cite references."
  }
  ```
- **Response** (`200 OK`): Updates post status to `"rejected"` and records the reason.

---

### 4. AI Content Improvement

#### Improve Draft Content via Gemini
- **Endpoint**: `POST /api/ai/improve/:postId`
- **Header**: `Authorization: Bearer <token>`
- **Behavior**:
  - Verifies user ownership of `:postId`.
  - Sends content to Google Gemini API (`gemini-3.8-flash`) with structured schema output.
  - Generates a **new post** document with a **new unique ObjectId** and `status: "draft"`.
  - The original post remains 100% intact and unchanged.
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Content improved successfully by AI and saved as a new draft.",
    "data": {
      "originalPost": {
        "id": "6ae23b145a89...",
        "title": "Original Title",
        "status": "draft"
      },
      "improvedPost": {
        "_id": "6ae23c99bb12...",
        "title": "Original Title (Enhanced)",
        "description": "...",
        "content": "...",
        "status": "draft",
        "isAiImproved": true,
        "originalPostId": "6ae23b145a89..."
      }
    }
  }
  ```

---

## AI Integration (Google Gemini)

The AI integration uses the official current Google Gen AI SDK (`@google/genai` >= 2.3.0).

### Obtaining an API Key
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Create or sign in to your Google Account.
3. Click **Get API key** -> **Create API key in new project**.
4. Set the key in your `.env`:
   ```env
   GEMINI_API_KEY=your_actual_key_here
   GEMINI_MODEL=gemini-3.8-flash
   ```

### Graceful Fallback
If `GEMINI_API_KEY` is empty or not configured, requests to `POST /api/ai/improve/:postId` return `503 Service Unavailable` with a clear message rather than crashing the process:
```json
{
  "success": false,
  "message": "Gemini AI content improvement is currently unavailable because GEMINI_API_KEY is not configured in the environment."
}
```

---

## Testing & Quality Assurance

### 1. Automated Integration Test Suite (Node.js Native Runner)
Runs 31 automated integration tests covering authentication, RBAC, CRUD, admin workflow transitions, AI draft isolation, and security exceptions:
```bash
npm test
```
**Test Results**:
```
✔ Akatsuki Draft API Integration Test Suite
  ✔ 1. System Health Endpoint (33ms)
  ✔ 2. Authentication Workflows (1476ms)
  ✔ 3. User Post Management Workflows (326ms)
  ✔ 4. Admin Approval Workflows (215ms)
  ✔ 5. AI Content Improvement Workflows (73ms)
  ✔ 6. Post Deletion & Authorization (50ms)
ℹ tests 31
ℹ pass 31
ℹ fail 0
```

### 2. Newman / Postman Collection Automated Run
Execute the complete 28-request Postman test suite automatically via Newman:
```bash
npm run test:newman
```
**Newman Verification Summary**:
```
================ Newman Summary ================
Total Requests:   28
Total Assertions: 43
Passed:           43
Failed:           0
================================================
[Newman Runner] All Postman assertions passed successfully!
```

---

## MongoDB Data Verification

Inspect database state directly at any time:
```bash
npm run verify:db
```
Or execute in `mongosh`:
```bash
mongosh "mongodb://127.0.0.1:27017/akatsukis-draft"
```
```javascript
// Verify normalized emails and hashed passwords
db.users.find({}, { name: 1, email: 1, role: 1 });

// Verify posts status distribution
db.posts.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
]);

// Verify AI improved posts maintain separate IDs and draft status
db.posts.find({ isAiImproved: true }, { title: 1, status: 1, originalPostId: 1 });
```

---

## Vercel Deployment Guide

The backend is configured for Vercel Serverless Functions via `vercel.json` and `api/index.js`.

### Deployment via GitHub & Vercel Dashboard (Recommended)
1. Push your repository to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New** -> **Project**.
3. Import `rohitborse210-AI/akatsukis-draft-backend`.
4. Under **Environment Variables**, add:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A secure random 64-character secret.
   - `JWT_EXPIRES_IN`: `7d`
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: *(Optional)* Your Gemini API key.
   - `ADMIN_EMAIL`: `admin@akatsuki.draft`
   - `ADMIN_PASSWORD`: *Your chosen strong admin password*
5. Click **Deploy**.
6. Once deployed, test the health endpoint:
   ```bash
   curl https://<your-vercel-domain>.vercel.app/health
   ```

---

## GitHub Publication Guide

To publish this project to GitHub:

1. **Verify your local git status**:
   ```bash
   git status
   ```

2. **Commit all staged changes**:
   ```bash
   git commit -m "feat: complete Akatsuki Draft backend with RBAC, Postman tests, and Gemini AI"
   ```

3. **Link to GitHub Remote**:
   Create a new repository named `akatsukis-draft-backend` on your GitHub account (`rohitborse210-AI`), then run:
   ```bash
   git remote add origin https://github.com/rohitborse210-AI/akatsukis-draft-backend.git
   git branch -M main
   git push -u origin main
   ```

---

## FreeCodeCamp Certification Guide

Official Course Link:
👉 [https://www.freecodecamp.org/learn/back-end-development-and-apis-v9/](https://www.freecodecamp.org/learn/back-end-development-and-apis-v9/)

To claim the **Back End Development and APIs Certification** honestly:

### Step 1: Complete Curriculum Modules
1. **Managing Packages with npm**: Understanding `package.json`, semantic versioning, and dependencies.
2. **Basic Node and Express**: Express routing, middleware, serve static files, request queries, body parsing.
3. **MongoDB and Mongoose**: Schema creation, CRUD operations with Mongoose, validation.

### Step 2: Complete the 5 Required Certification Projects
Submit live URLs and source repositories for each of the five required projects:
1. **Timestamp Microservice**: Handle valid dates and Unix timestamps (`GET /api/:date?`).
2. **Request Header Parser Microservice**: Return IP address, preferred language, and software (`GET /api/whoami`).
3. **URL Shortener Microservice**: Validate URLs with `dns.lookup`, generate short URLs, and redirect (`POST /api/shorturl`, `GET /api/shorturl/:short_url`).
4. **Exercise Tracker**: Manage users, add exercises, and retrieve logs with date/limit filters (`POST /api/users`, `POST /api/users/:_id/exercises`, `GET /api/users/:_id/logs`).
5. **File Metadata Microservice**: Handle multipart file uploads using `multer` and return file size, name, and type (`POST /api/fileanalyse`).

### Step 3: Claim Certificate
1. Pass all automated tests on FreeCodeCamp for the 5 projects.
2. Agree to the Academic Honesty Pledge.
3. Claim your certificate and add your public URL to your submission.

---

## Security Highlights

- **No Public Admin Registration**: Admin role can never be set during standard registration.
- **Secret Hygiene**: Zero hardcoded credentials or API tokens in code or Git commits.
- **Input Sanitization**: Email normalization and regex validation; MongoDB ObjectId format checks.
- **Prompt Injection Defense**: Author post contents are treated strictly as untrusted text within isolated prompt blocks.
- **Helmet & Rate Limiting**: Secure HTTP response headers and endpoint-level request limits.
