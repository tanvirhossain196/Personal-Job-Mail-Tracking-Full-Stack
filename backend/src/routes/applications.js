const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { pool } = require("../db");

const router = express.Router();

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function rowToApplication(row) {
  if (!row) return undefined;
  return {
    id: row.id,
    jobLink: row.jobLink,
    companyName: row.companyName,
    position: row.position,
    positionType: row.positionType,
    email: row.email,
    applied: !!row.applied,
    status: row.status,
    appliedDate: row.appliedDate ?? undefined,
    followUpDate: row.followUpDate ?? undefined,
    notes: row.notes ?? undefined,
    resumeVersion: row.resumeVersion ?? undefined,
    replySnippet: row.replySnippet ?? undefined,
    replyFrom: row.replyFrom ?? undefined,
    replyReceivedAt: row.replyReceivedAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function findDuplicate(input, excludeId) {
  const { rows } = await pool.query(`SELECT * FROM applications`);
  return rows
    .map(rowToApplication)
    .find(
      (a) =>
        a.id !== excludeId &&
        normalize(a.companyName) === normalize(input.companyName) &&
        normalize(a.position) === normalize(input.position) &&
        normalize(a.email) === normalize(input.email)
    );
}

function validateInput(input) {
  if (!input || typeof input !== "object") return "Missing request body.";
  const required = ["jobLink", "companyName", "position", "positionType", "email", "status"];
  for (const field of required) {
    if (!input[field] || String(input[field]).trim() === "") {
      return `"${field}" is required.`;
    }
  }
  return null;
}

// GET /api/applications - list everything
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM applications ORDER BY "createdAt" DESC`
    );
    res.json(rows.map(rowToApplication));
  } catch (err) {
    next(err);
  }
});

// POST /api/applications - create (rejects duplicates on company+position+email)
router.post("/", async (req, res, next) => {
  try {
    const input = req.body;
    const error = validateInput(input);
    if (error) return res.status(400).json({ error });

    const duplicate = await findDuplicate(input);
    if (duplicate) return res.status(409).json({ duplicate });

    const now = new Date().toISOString();
    const id = uuidv4();
    const { rows } = await pool.query(
      `INSERT INTO applications
        (id, "jobLink", "companyName", position, "positionType", email, applied, status,
         "appliedDate", "followUpDate", notes, "resumeVersion", "replySnippet", "replyFrom",
         "replyReceivedAt", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        id,
        input.jobLink,
        input.companyName,
        input.position,
        input.positionType,
        input.email,
        !!input.applied,
        input.status,
        input.appliedDate ?? null,
        input.followUpDate ?? null,
        input.notes ?? null,
        input.resumeVersion ?? null,
        input.replySnippet ?? null,
        input.replyFrom ?? null,
        input.replyReceivedAt ?? null,
        now,
        now,
      ]
    );

    res.status(201).json({ created: rowToApplication(rows[0]) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/applications - clear everything
router.delete("/", async (req, res, next) => {
  try {
    await pool.query(`DELETE FROM applications`);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// PUT /api/applications/:id - full update (rejects duplicates)
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: existingRows } = await pool.query(
      `SELECT * FROM applications WHERE id = $1`,
      [id]
    );
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: "Application not found." });

    const input = req.body;
    const error = validateInput(input);
    if (error) return res.status(400).json({ error });

    const duplicate = await findDuplicate(input, id);
    if (duplicate) return res.status(409).json({ duplicate });

    const updatedAt = new Date().toISOString();
    const { rows } = await pool.query(
      `UPDATE applications SET
        "jobLink"=$1, "companyName"=$2, position=$3, "positionType"=$4,
        email=$5, applied=$6, status=$7, "appliedDate"=$8,
        "followUpDate"=$9, notes=$10, "resumeVersion"=$11,
        "replySnippet"=$12, "replyFrom"=$13, "replyReceivedAt"=$14,
        "updatedAt"=$15
       WHERE id=$16
       RETURNING *`,
      [
        input.jobLink,
        input.companyName,
        input.position,
        input.positionType,
        input.email,
        !!input.applied,
        input.status,
        input.appliedDate ?? null,
        input.followUpDate ?? null,
        input.notes ?? null,
        input.resumeVersion ?? null,
        input.replySnippet ?? existing.replySnippet,
        input.replyFrom ?? existing.replyFrom,
        input.replyReceivedAt ?? existing.replyReceivedAt,
        updatedAt,
        id,
      ]
    );

    res.json({ updated: rowToApplication(rows[0]) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/applications/:id/status - just the status (mirrors old setStatus())
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { rows: existingRows } = await pool.query(
      `SELECT * FROM applications WHERE id = $1`,
      [id]
    );
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: "Application not found." });
    if (!status) return res.status(400).json({ error: '"status" is required.' });

    const applied = status === "Saved" ? existing.applied : true;
    const updatedAt = new Date().toISOString();
    const { rows } = await pool.query(
      `UPDATE applications SET status=$1, applied=$2, "updatedAt"=$3 WHERE id=$4 RETURNING *`,
      [status, applied, updatedAt, id]
    );

    res.json({ updated: rowToApplication(rows[0]) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/applications/:id/reply - attach a matched Gmail reply
router.patch("/:id/reply", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { snippet, fromEmail, receivedAt, status } = req.body;
    const { rows: existingRows } = await pool.query(
      `SELECT * FROM applications WHERE id = $1`,
      [id]
    );
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: "Application not found." });

    const nextStatus = status ?? existing.status;
    const applied = status ? true : existing.applied;
    const updatedAt = new Date().toISOString();

    const { rows } = await pool.query(
      `UPDATE applications SET
        status=$1, applied=$2, "replySnippet"=$3, "replyFrom"=$4,
        "replyReceivedAt"=$5, "updatedAt"=$6
       WHERE id=$7
       RETURNING *`,
      [
        nextStatus,
        applied,
        snippet ?? existing.replySnippet,
        fromEmail ?? existing.replyFrom,
        receivedAt ?? existing.replyReceivedAt,
        updatedAt,
        id,
      ]
    );

    res.json({ updated: rowToApplication(rows[0]) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/applications/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(`DELETE FROM applications WHERE id = $1`, [id]);
    if (rowCount === 0) return res.status(404).json({ error: "Application not found." });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
