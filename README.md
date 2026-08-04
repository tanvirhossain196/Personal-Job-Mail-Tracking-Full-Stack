# Rolodex — Job Application Tracker (Full-stack)

This project was converted from a **localStorage-only** app into a proper
full-stack app:

```
rolodex-fullstack/
├── backend/     Node.js + Express + PostgreSQL REST API (all data lives here now)
└── frontend/    Next.js app (unchanged UI, but talks to the backend API
                 instead of the browser's localStorage)
```

## What changed

- `localStorage` for job applications → **`applications` table (PostgreSQL)**
- `localStorage` for Gmail mail category tags → **`email_meta` table (PostgreSQL)**
- The last two small `localStorage` keys (sidebar collapsed state, "member
  since" date) → **`settings` key/value table (PostgreSQL)**
- Google sign-in (NextAuth) and the live Gmail inbox fetch are unchanged and
  still run inside the Next.js frontend — only the app's own data (job
  applications + email tags) moved to the database. A small `sessionStorage`
  cache for the live Gmail fetch was left as-is; it's just a transient UI
  cache, not stored data.
- The database is PostgreSQL (not SQLite) specifically so it can be deployed
  publicly on a free host (Render/Railway/Neon/Supabase) without losing data
  on every restart or redeploy — SQLite's data file doesn't survive that on
  most free hosting.

## Running it locally

You need **two terminals** — the backend and frontend run as separate
processes. You also need a PostgreSQL database (a free one from
Render/Neon/Supabase/Railway, or Postgres installed locally).

### 1. Backend (Express + PostgreSQL)

```bash
cd backend
cp .env.example .env
# paste your DATABASE_URL into .env — see backend/README.md for free options
npm install
npm start
```

This starts the API on **http://localhost:4000** and creates the
`applications`, `email_meta`, and `settings` tables automatically on first
run.

### 2. Frontend (Next.js)

```bash
cd frontend
cp .env.local.example .env.local
# edit .env.local: add your Google OAuth credentials for Gmail sign-in
npm install
npm run dev
```

This starts the app on **http://localhost:3000** and talks to the backend
via `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`).

Open http://localhost:3000 — the backend must already be running or data
requests will fail with a toast saying "Couldn't reach the backend API".

## Backend API summary

| Method | Path                                | Purpose                              |
|--------|--------------------------------------|---------------------------------------|
| GET    | `/api/applications`                 | List all applications                 |
| POST   | `/api/applications`                 | Create one (409 if duplicate)         |
| PUT    | `/api/applications/:id`             | Update one (409 if duplicate)         |
| PATCH  | `/api/applications/:id/status`      | Change status only                    |
| PATCH  | `/api/applications/:id/reply`       | Attach a matched Gmail reply          |
| DELETE | `/api/applications/:id`             | Delete one                            |
| DELETE | `/api/applications`                 | Clear all                             |
| GET    | `/api/email-meta`                   | Get all email category tags           |
| PUT    | `/api/email-meta/:folder/:id`       | Set tag for one email                 |
| POST   | `/api/email-meta/batch`             | Set tags for many emails at once      |
| GET    | `/api/settings/:key`                | Read a small UI preference            |
| PUT    | `/api/settings/:key`                | Write a small UI preference           |

See `backend/README.md` and `frontend/README.md` for more detail on each
part.
