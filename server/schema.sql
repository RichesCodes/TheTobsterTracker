-- Run this in your Supabase SQL editor (or any PostgreSQL client)
-- Supabase Dashboard > SQL Editor > New Query

-- Users table - one row per account
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Daily log - one row per user per calendar day
CREATE TABLE IF NOT EXISTS daily_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date    DATE NOT NULL,
  answers     JSONB DEFAULT '{}',   -- { "brush-teeth": "yes", "drink-water": "no" }
  mood        VARCHAR(20),           -- "great" | "good" | "okay" | "bad" | "terrible"
  activities  JSONB DEFAULT '{}',   -- { "friends": true, "gym": false }
  emotions    JSONB DEFAULT '{}',   -- { "anxious": true, "happy": true }
  finished    BOOLEAN DEFAULT FALSE,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- Per-user configuration (what habits/activities/emotions they track)
CREATE TABLE IF NOT EXISTS user_configs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habits      JSONB DEFAULT '[]',     -- [{ "id": "brush-teeth", "label": "Brush teeth", "emoji": "🦷" }]
  activities  JSONB DEFAULT '[]',     -- [{ "id": "gym", "label": "Gym", "emoji": "💪" }]
  emotions    JSONB DEFAULT '[]',     -- [{ "id": "anxious", "label": "Anxious", "emoji": "😰" }]
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Web Push subscriptions - one per browser/device per user
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint    TEXT UNIQUE NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast log lookups by user + date
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, log_date DESC);
