const { Pool } = require("pg");

// Render/Railway/Neon/Supabase all give you one connection string:
//   postgresql://user:password@host:port/dbname
// Locally, put the same shape in backend/.env as DATABASE_URL.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "Missing DATABASE_URL. Copy .env.example to .env and set it to your Postgres connection string."
  );
  process.exit(1);
}

// Most hosted Postgres providers (Render, Neon, Supabase, Railway) require
// SSL but use a self-signed cert chain, hence rejectUnauthorized: false.
// Disable SSL entirely for a plain local Postgres by setting PGSSL=false.
const useSSL = process.env.PGSSL !== "false";

const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id              TEXT PRIMARY KEY,
      "jobLink"       TEXT NOT NULL,
      "companyName"   TEXT NOT NULL,
      position        TEXT NOT NULL,
      "positionType"  TEXT NOT NULL,
      email           TEXT NOT NULL,
      applied         BOOLEAN NOT NULL DEFAULT FALSE,
      status          TEXT NOT NULL,
      "appliedDate"     TEXT,
      "followUpDate"    TEXT,
      notes             TEXT,
      "resumeVersion"   TEXT,
      "replySnippet"    TEXT,
      "replyFrom"       TEXT,
      "replyReceivedAt" TEXT,
      "createdAt"     TEXT NOT NULL,
      "updatedAt"     TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_meta (
      folder      TEXT NOT NULL,
      "messageId" TEXT NOT NULL,
      category    TEXT,
      company     TEXT,
      position    TEXT,
      "updatedAt" TEXT NOT NULL,
      PRIMARY KEY (folder, "messageId")
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

module.exports = { pool, initSchema };
