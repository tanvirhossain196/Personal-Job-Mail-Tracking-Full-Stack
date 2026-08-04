require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { initSchema } = require("./db");
const applicationsRouter = require("./routes/applications");
const emailMetaRouter = require("./routes/emailMeta");
const settingsRouter = require("./routes/settings");

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "rolodex-backend" });
});

app.use("/api/applications", applicationsRouter);
app.use("/api/email-meta", emailMetaRouter);
app.use("/api/settings", settingsRouter);

// 404 fallback for unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found." });
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

async function start() {
  try {
    await initSchema();
    console.log("Connected to Postgres and verified schema.");
  } catch (err) {
    console.error("Could not connect to Postgres / create tables:", err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Rolodex backend listening on http://localhost:${PORT}`);
  });
}

start();
