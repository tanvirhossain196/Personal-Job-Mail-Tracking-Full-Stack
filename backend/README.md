# Rolodex Backend

Node.js + Express + **PostgreSQL** API that stores everything the frontend
used to keep in `localStorage`: job applications and Gmail category tags,
plus a couple of small UI preferences.

## Setup

### 1. Get a PostgreSQL database

Pick whichever is easiest for you — all give a free tier and a
`DATABASE_URL` connection string:

- **Render.com** → New → PostgreSQL → copy the "External Database URL"
- **Neon.tech** → New project → copy the connection string
- **Supabase.com** → New project → Settings → Database → connection string
- **Railway.app** → New → Database → PostgreSQL → copy `DATABASE_URL`
- Or a local Postgres install (`postgresql://postgres:postgres@localhost:5432/rolodex`)

### 2. Configure and run

```bash
cp .env.example .env
# paste your DATABASE_URL into .env
npm install
npm start        # or: npm run dev  (auto-restarts on file changes)
```

The server listens on `PORT` (default `4000`). On startup it automatically
runs `CREATE TABLE IF NOT EXISTS ...` for all three tables — no separate
migration step needed the first time.

## Environment variables (`.env`)

| Variable       | Default                  | Purpose                                            |
|----------------|----------------------------|-----------------------------------------------------|
| `PORT`         | `4000`                    | Port the API listens on                              |
| `CORS_ORIGIN`  | `http://localhost:3000`   | Comma-separated list of allowed frontend origins     |
| `DATABASE_URL` | —                          | PostgreSQL connection string (required)              |
| `PGSSL`        | `true`                     | Set to `false` only for a local Postgres without SSL |

## Data model

**`applications`** — one row per job application (mirrors the old
`JobApplication` type: company, position, status, dates, notes, etc).

**`email_meta`** — one row per Gmail message the user has tagged, keyed by
`(folder, "messageId")`, storing the category/company/position assigned to it.

**`settings`** — generic key/value table for tiny UI preferences (sidebar
collapsed state, "member since" date) that used to be one-off localStorage
keys.

## Deploying

1. Push `backend/` to its own Git repo (or a subfolder deploy on Render).
2. On Render/Railway, create a **Web Service** from that repo:
   - Build command: `npm install`
   - Start command: `npm start`
   - Add env vars: `DATABASE_URL` (from the Postgres instance you created),
     `CORS_ORIGIN` (your deployed frontend URL, e.g.
     `https://your-app.vercel.app`), and `PORT` if the host requires a
     specific one.
3. Once deployed you'll get a public URL like
   `https://rolodex-backend.onrender.com` — put that in the frontend's
   `NEXT_PUBLIC_API_URL`.

Because the data now lives in a real Postgres database (not a file on disk),
restarts, redeploys, and free-tier "sleep" cycles **do not** wipe your data —
that was the whole point of moving off SQLite.

## Notes

- Duplicate application detection (same company + position + email) is
  enforced server-side; `POST`/`PUT` return **409** with the conflicting
  record under `duplicate` when it happens, matching the old client-side
  behavior.
- This is a **single-tenant** API (no auth/user accounts) — it's meant to sit
  behind the existing frontend for one person's use, mirroring what
  localStorage did (all data local to "this app"). If you need multi-user
  support later, add an auth layer and a `userId` column to each table.
