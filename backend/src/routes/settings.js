const express = require("express");
const { pool } = require("../db");

const router = express.Router();

// GET /api/settings/:key
router.get("/:key", async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT value FROM settings WHERE key = $1`, [
      req.params.key,
    ]);
    res.json({ key: req.params.key, value: rows[0] ? rows[0].value : null });
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings/:key  body: { value: string }
router.put("/:key", async (req, res, next) => {
  try {
    const { value } = req.body ?? {};
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ($1,$2)
       ON CONFLICT (key) DO UPDATE SET value=excluded.value`,
      [req.params.key, value ?? null]
    );
    res.json({ key: req.params.key, value: value ?? null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
