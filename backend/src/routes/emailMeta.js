const express = require("express");
const { pool } = require("../db");

const router = express.Router();

function metaKey(folder, messageId) {
  return `${folder}:${messageId}`;
}

// GET /api/email-meta - same shape the frontend used to keep in localStorage:
// { "inbox:<id>": { category, company, position, updatedAt }, ... }
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM email_meta`);
    const map = {};
    for (const row of rows) {
      map[metaKey(row.folder, row.messageId)] = {
        category: row.category ?? undefined,
        company: row.company ?? undefined,
        position: row.position ?? undefined,
        updatedAt: row.updatedAt,
      };
    }
    res.json(map);
  } catch (err) {
    next(err);
  }
});

// PUT /api/email-meta/:folder/:messageId - upsert one entry
router.put("/:folder/:messageId", async (req, res, next) => {
  try {
    const { folder, messageId } = req.params;
    if (folder !== "inbox" && folder !== "sent") {
      return res.status(400).json({ error: '"folder" must be "inbox" or "sent".' });
    }
    const { category, company, position } = req.body ?? {};
    const updatedAt = new Date().toISOString();

    const { rows: existingRows } = await pool.query(
      `SELECT * FROM email_meta WHERE folder = $1 AND "messageId" = $2`,
      [folder, messageId]
    );
    const existing = existingRows[0];

    const nextCategory = category ?? existing?.category ?? null;
    const nextCompany = company ?? existing?.company ?? null;
    const nextPosition = position ?? existing?.position ?? null;

    await pool.query(
      `INSERT INTO email_meta (folder, "messageId", category, company, position, "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (folder, "messageId") DO UPDATE SET
         category=excluded.category, company=excluded.company,
         position=excluded.position, "updatedAt"=excluded."updatedAt"`,
      [folder, messageId, nextCategory, nextCompany, nextPosition, updatedAt]
    );

    res.json({
      key: metaKey(folder, messageId),
      meta: {
        category: nextCategory ?? undefined,
        company: nextCompany ?? undefined,
        position: nextPosition ?? undefined,
        updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/email-meta/batch - upsert many entries at once
// body: { folder: "inbox" | "sent", entries: [{ id, patch: {category, company, position} }] }
router.post("/batch", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { folder, entries } = req.body ?? {};
    if (folder !== "inbox" && folder !== "sent") {
      return res.status(400).json({ error: '"folder" must be "inbox" or "sent".' });
    }
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.json({ ok: true, updated: 0 });
    }

    const updatedAt = new Date().toISOString();

    await client.query("BEGIN");
    for (const { id, patch } of entries) {
      const { rows: existingRows } = await client.query(
        `SELECT * FROM email_meta WHERE folder = $1 AND "messageId" = $2`,
        [folder, id]
      );
      const existing = existingRows[0];
      await client.query(
        `INSERT INTO email_meta (folder, "messageId", category, company, position, "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (folder, "messageId") DO UPDATE SET
           category=excluded.category, company=excluded.company,
           position=excluded.position, "updatedAt"=excluded."updatedAt"`,
        [
          folder,
          id,
          patch?.category ?? existing?.category ?? null,
          patch?.company ?? existing?.company ?? null,
          patch?.position ?? existing?.position ?? null,
          updatedAt,
        ]
      );
    }
    await client.query("COMMIT");

    res.json({ ok: true, updated: entries.length });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
