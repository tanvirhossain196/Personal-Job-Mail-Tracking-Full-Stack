require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { initSchema } = require("./db");
const applicationsRouter = require("./routes/applications");
const emailMetaRouter = require("./routes/emailMeta");
const settingsRouter = require("./routes/settings");

const app = express();
const PORT = process.env.PORT || 4000;

// Allowed Origins
const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  "http://localhost:3000,http://localhost:3001,https://personal-job-mail-tracking-full-sta.vercel.app"
)
  .split(",")
  .map((origin) => origin.trim());

// CORS Configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow Postman/server-to-server requests (no Origin header)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Handle preflight requests
app.options("*", cors());

app.use(express.json());

// Root Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Rolodex Backend API is running 🚀",
  });
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "rolodex-backend",
  });
});

// Routes
app.use("/api/applications", applicationsRouter);
app.use("/api/email-meta", emailMetaRouter);
app.use("/api/settings", settingsRouter);

// 404 API
app.use("/api", (req, res) => {
  res.status(404).json({
    error: "API route not found.",
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

// Start Server
async function start() {
  try {
    await initSchema();
    console.log("✅ Connected to PostgreSQL.");
  } catch (err) {
    console.error("❌ Database Error:", err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

start();
