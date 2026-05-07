require('dotenv').config();

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');

const authRoutes  = require('./routes/auth');
const logsRoutes  = require('./routes/logs');
const configRoutes = require('./routes/config');
const pushRoutes  = require('./routes/push');
const { errorHandler } = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security & parsing ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// ── Health check ───────────────────────────────────────────────────────────
// Render (and other hosts) ping this to verify the server is alive
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Routes ─────────────────────────────────────────────────────────────────
// How APIs work:
//   1. Frontend sends an HTTP request (GET/POST/PUT/DELETE) with optional JSON body
//   2. Express matches the URL path to a route handler
//   3. The handler reads the DB, computes a result, and replies with JSON
//   4. Frontend reads the JSON and updates the UI

app.use('/api/auth',   authRoutes);    // Register / login
app.use('/api/logs',   logsRoutes);    // Daily habit logs
app.use('/api/config', configRoutes);  // User habit/activity/emotion config
app.use('/api/push',   pushRoutes);    // Web Push subscriptions & sending

// ── 404 catch-all ──────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Global error handler ───────────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Tobster Tracker API running on port ${PORT}`);
});
