const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// GET /api/config
// Returns the user's full config: which habits, activities, and emotions they track
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT habits, activities, emotions, updated_at
       FROM user_configs
       WHERE user_id = $1`,
      [req.user.id]
    );

    // Row is seeded at registration; this should never be empty
    res.json(rows[0] || { habits: [], activities: [], emotions: [] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/config/habits
// Body: { habits: [{ id, label, emoji }, ...] }
router.put('/habits', async (req, res, next) => {
  try {
    const { habits } = req.body;
    if (!Array.isArray(habits)) {
      return res.status(400).json({ error: 'habits must be an array' });
    }

    const { rows } = await db.query(
      `UPDATE user_configs
       SET habits = $1::jsonb, updated_at = NOW()
       WHERE user_id = $2
       RETURNING habits, updated_at`,
      [JSON.stringify(habits), req.user.id]
    );

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/config/activities
// Body: { activities: [{ id, label, emoji }, ...] }
router.put('/activities', async (req, res, next) => {
  try {
    const { activities } = req.body;
    if (!Array.isArray(activities)) {
      return res.status(400).json({ error: 'activities must be an array' });
    }

    const { rows } = await db.query(
      `UPDATE user_configs
       SET activities = $1::jsonb, updated_at = NOW()
       WHERE user_id = $2
       RETURNING activities, updated_at`,
      [JSON.stringify(activities), req.user.id]
    );

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/config/emotions
// Body: { emotions: [{ id, label, emoji }, ...] }
router.put('/emotions', async (req, res, next) => {
  try {
    const { emotions } = req.body;
    if (!Array.isArray(emotions)) {
      return res.status(400).json({ error: 'emotions must be an array' });
    }

    const { rows } = await db.query(
      `UPDATE user_configs
       SET emotions = $1::jsonb, updated_at = NOW()
       WHERE user_id = $2
       RETURNING emotions, updated_at`,
      [JSON.stringify(emotions), req.user.id]
    );

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
