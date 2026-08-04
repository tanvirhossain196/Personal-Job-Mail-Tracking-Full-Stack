# Rolodex — Job Application Tracker

A personal dashboard for logging every job application: the posting link, company, position,
position type, and the email used to apply — with automatic duplicate detection, an analytics
view, and an **Inbox** that pulls in Gmail replies (interview invites, offers, rejections) and
lets you link each one to an application in one click.

> **This frontend now requires the backend API** (see `../backend`) to be running — all
> application/email data is stored in SQLite via Express instead of localStorage. Start the
> backend first (`cd ../backend && npm install && npm start`), then run this app.

## Duplicate rule

An entry is blocked as a duplicate only when **company + position + email** all match an
existing entry. If any one of those three is different, it's saved as a new, separate entry
(e.g. same company, different role — or same role, applied again with a different email).

## Getting started

Requires **Node.js 18.18+**, and the backend API running (see `../backend/README.md`).

```bash
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL + Google OAuth creds
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dashboard, duplicate check, table,
filters, and analytics all work immediately as long as the backend is running.

**Gmail sync (Inbox tab) is optional** and requires a one-time setup below, because it reads
your real inbox and Google requires every app to have its own registered credentials — there's
no way around that step for any app that connects to your Gmail.

## Connecting Gmail (optional — for the Inbox tab)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) → create a new project
   (or use an existing one).
2. **APIs & Services → Library** → enable the **Gmail API**.
3. **APIs & Services → OAuth consent screen** → set it up in "External" mode, add your own
   Gmail address as a test user (this keeps it private to you while in testing mode).
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID** →
   Application type: **Web application**.
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy the generated **Client ID** and **Client Secret**.
6. In the project folder, copy `.env.local.example` to `.env.local` and fill in:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   NEXTAUTH_SECRET=...   # generate with: openssl rand -base64 32
   NEXTAUTH_URL=http://localhost:3000
   ```
7. Restart `npm run dev`, open the **Inbox** tab, and click **Connect Gmail**.

Gmail access is **read-only** (`gmail.readonly`) — the app can never send, delete, or modify
anything in your mailbox. Your access token is only used server-side, in your own local server,
to fetch messages; nothing is sent to any third party.

### How the Inbox works

- It searches your inbox (last 120 days) for messages that look application-related
  (keywords like "interview", "application", "offer", "position", etc.).
- Each message gets a **suggested verdict** — Offer / Interviewing / Rejected / Acknowledged /
  Unclear — based on common phrasing companies use in these emails.
- It tries to guess which tracked application the email belongs to, by matching the sender's
  name/domain against your logged companies. You confirm (or change) the match, then click
  **"Mark as …"** to apply that status to the application — the reply snippet is saved on that
  entry too, so you can see why it changed.
- This is a best-effort, keyword-based classifier, not a guarantee — always double check before
  relying on it, especially for anything you don't recognize.

## Production build

```bash
npm run build
npm run start
```

## Data storage

Your applications are stored locally in your browser (`localStorage`) — nothing is sent to a
server except the Gmail API calls you explicitly trigger from the Inbox tab. Clearing your
browser storage will clear your applications, so use **Export CSV** (in the sidebar) regularly
to back up your data.

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Recharts (analytics charts)
- NextAuth.js + googleapis (Gmail OAuth + API)
- lucide-react (icons)

## Project structure

```
app/                     Root layout, global styles, main dashboard page
app/api/auth/             NextAuth Google OAuth route
app/api/gmail/replies/    Gmail message fetch + classification endpoint
components/               UI components (table, form modal, charts, sidebar, inbox, etc.)
lib/                       Types, localStorage data layer, duplicate-check + reply-classifier logic
```

## Customizing

- Colors and fonts: `tailwind.config.ts` and `app/globals.css`
- Status stages: `lib/types.ts` (`STATUS_ORDER`)
- Position types: `lib/types.ts` (`POSITION_TYPE_ORDER`)
- Reply classifier keywords: `lib/classify.ts`
- Seed/demo data shown on first load: `lib/seed.ts` (delete your seeded rows from the table
  once you've added real entries)

## Sidebar

The sidebar (desktop) can be collapsed to icon-only via the button at its bottom — your
preference is remembered between visits. On mobile, use the menu icon in the top bar.
