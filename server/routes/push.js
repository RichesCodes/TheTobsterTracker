const express = require('express');
const webpush = require('web-push');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// Configure web-push once when this module loads
// (VAPID keys must be set in .env before this will work)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// GET /api/push/vapid-public-key
// The frontend needs the public key to create a push subscription in the browser.
// This is safe to expose — it's the PUBLIC half of the VAPID keypair.
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe
// Body: the PushSubscription object from navigator.serviceWorker + pushManager.subscribe()
// { endpoint, keys: { p256dh, auth } }
router.post('/subscribe', async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Invalid push subscription object' });
    }

    await db.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET
         user_id = $1,
         p256dh  = $3,
         auth    = $4`,
      [req.user.id, endpoint, keys.p256dh, keys.auth]
    );

    res.status(201).json({ message: 'Subscribed' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/push/subscribe
// Body: { endpoint }
// Called when the user disables notifications in the app
router.delete('/subscribe', async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: 'endpoint is required' });
    }

    await db.query(
      `DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`,
      [req.user.id, endpoint]
    );

    res.json({ message: 'Unsubscribed' });
  } catch (err) {
    next(err);
  }
});

// POST /api/push/send-reminder
// Sends a push notification to all of the user's registered devices.
// In production you'd call this from a cron job at a user-configured reminder time.
// Body: { title, body }  (optional — defaults to a habit reminder message)
router.post('/send-reminder', async (req, res, next) => {
  try {
    const title = req.body.title || "Habit check-in 📋";
    const body  = req.body.body  || "Don't forget to log your habits for today!";

    const { rows } = await db.query(
      `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.json({ sent: 0, message: 'No subscriptions found' });
    }

    const payload = JSON.stringify({ title, body });

    const results = await Promise.allSettled(
      rows.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    );

    // Remove any subscriptions that are no longer valid (410 Gone)
    const staleEndpoints = rows
      .filter((_, i) => results[i].status === 'rejected' && results[i].reason?.statusCode === 410)
      .map((sub) => sub.endpoint);

    if (staleEndpoints.length > 0) {
      await db.query(
        `DELETE FROM push_subscriptions WHERE endpoint = ANY($1)`,
        [staleEndpoints]
      );
    }

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    res.json({ sent, total: rows.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
