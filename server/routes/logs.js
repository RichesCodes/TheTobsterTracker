const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All log routes require a logged-in user
router.use(requireAuth);

// Validate that a string is a real calendar date in YYYY-MM-DD format
function isValidDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}

// GET /api/logs/:date
// Returns the log for a single day, or an empty log if none exists yet
router.get('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    if (!isValidDate(date)) {
      return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
    }

    const { rows } = await db.query(
      `SELECT log_date, answers, mood, activities, emotions, finished, updated_at
       FROM daily_logs
       WHERE user_id = $1 AND log_date = $2`,
      [req.user.id, date]
    );

    if (rows.length === 0) {
      // Return a blank log so the frontend doesn't have to handle null
      return res.json({
        log_date: date,
        answers: {},
        mood: null,
        activities: {},
        emotions: {},
        finished: false,
        updated_at: null,
      });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/logs/:date
// Creates or updates (upserts) the log for a day.
// Body can contain any subset of: { answers, mood, activities, emotions, finished }
// Fields not included in the body are left unchanged.
router.put('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    if (!isValidDate(date)) {
      return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
    }

    const { answers, mood, activities, emotions, finished } = req.body;

    // Build a partial update: only set columns that were actually sent
    const { rows } = await db.query(
      `INSERT INTO daily_logs (user_id, log_date, answers, mood, activities, emotions, finished, updated_at)
       VALUES ($1, $2,
         COALESCE($3::jsonb, '{}'),
         $4,
         COALESCE($5::jsonb, '{}'),
         COALESCE($6::jsonb, '{}'),
         COALESCE($7, false),
         NOW()
       )
       ON CONFLICT (user_id, log_date) DO UPDATE SET
         answers    = COALESCE($3::jsonb,   daily_logs.answers),
         mood       = COALESCE($4,          daily_logs.mood),
         activities = COALESCE($5::jsonb,   daily_logs.activities),
         emotions   = COALESCE($6::jsonb,   daily_logs.emotions),
         finished   = COALESCE($7,          daily_logs.finished),
         updated_at = NOW()
       RETURNING log_date, answers, mood, activities, emotions, finished, updated_at`,
      [
        req.user.id,
        date,
        answers ? JSON.stringify(answers) : null,
        mood || null,
        activities ? JSON.stringify(activities) : null,
        emotions ? JSON.stringify(emotions) : null,
        finished !== undefined ? finished : null,
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/logs?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns all logs in a date range (inclusive), sorted oldest first.
// Used by the Insights page to load history.
router.get('/', async (req, res, next) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to query params are required (YYYY-MM-DD)' });
    }
    if (!isValidDate(from) || !isValidDate(to)) {
      return res.status(400).json({ error: 'from and to must be YYYY-MM-DD' });
    }
    if (from > to) {
      return res.status(400).json({ error: 'from must be before or equal to to' });
    }

    const { rows } = await db.query(
      `SELECT log_date, answers, mood, activities, emotions, finished, updated_at
       FROM daily_logs
       WHERE user_id = $1 AND log_date BETWEEN $2 AND $3
       ORDER BY log_date ASC`,
      [req.user.id, from, to]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
