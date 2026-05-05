// ---- Date helpers ----
//
// These helper functions keep all date formatting logic in one place.
// That matters because dates are used both for display and as localStorage keys.

// Convert a Date object into the YYYY-MM-DD format used by storage.
function formatDateKey(date) {
  const year  = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day   = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Turn a YYYY-MM-DD storage key back into a real Date object.
function parseDateKey(dateKey) {
  const match = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Return a new Date that is N days away from the source date.
function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// A small human-readable format used in the Insights labels.
function formatShortDate(date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ---- Data helpers ----
//
// A "day entry" is the main object saved for each calendar day.

// Create the base shape for one day of data.
function createEmptyEntry() {
  return {
    answers: {},
    mood: null,
    activities: {},
    emotions: {},
    updatedAt: null,
  };
}

// Clean and normalize raw stored JSON before the rest of the app uses it.
// This protects the UI from broken or outdated saved data.
function normalizeEntry(raw) {
  const entry = createEmptyEntry();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return entry;

  const sourceAnswers =
    raw.answers && typeof raw.answers === "object" ? raw.answers : raw;

  habits.forEach((habit) => {
    if (sourceAnswers[habit.id] === "yes" || sourceAnswers[habit.id] === "no") {
      entry.answers[habit.id] = sourceAnswers[habit.id];
    }
  });

  if (getMood(raw.mood)) entry.mood = raw.mood;

  if (raw.activities && typeof raw.activities === "object" && !Array.isArray(raw.activities)) {
    Object.entries(raw.activities).forEach(([id, value]) => {
      if (value === true) entry.activities[id] = true;
    });
  }

  if (raw.emotions && typeof raw.emotions === "object" && !Array.isArray(raw.emotions)) {
    Object.entries(raw.emotions).forEach(([id, value]) => {
      if (value === true) entry.emotions[id] = true;
    });
  }

  entry.updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : null;

  return entry;
}

// ---- Counting helpers ----

// Count how many habits have any answer at all for one day.
function countEntryAnswers(entry) {
  return habits.filter((habit) => entry.answers[habit.id]).length;
}

// Count how many habits were answered "yes" for one day.
function countEntryCompleted(entry) {
  return habits.filter((habit) => entry.answers[habit.id] === "yes").length;
}

// Total answered habits across many stored day records.
function countAnswered(days) {
  return days.reduce((total, day) => total + countEntryAnswers(day.entry), 0);
}

// Total completed habits across many stored day records.
function countCompleted(days) {
  return days.reduce((total, day) => total + countEntryCompleted(day.entry), 0);
}

// ---- Analytics ----

// Simple average helper that returns null for empty lists.
function average(values) {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Find the full mood object for a stored mood id.
function getMood(id) {
  return moods.find((m) => m.id === id) || null;
}

// Convert a raw numeric mood average back into the closest named mood label.
function getMoodFromScore(score) {
  if (moods.length === 0) {
    return { label: "--", score: 0 };
  }

  return moods.reduce((closest, mood) =>
    Math.abs(mood.score - score) < Math.abs(closest.score - score) ? mood : closest
  );
}

// Older helper kept for possible future analytics expansion.
function getMoodScores(days, habitId, answer) {
  return days
    .filter((day) => day.entry.answers[habitId] === answer)
    .map((day) => getMood(day.entry.mood).score);
}

// Older helper kept for possible future analytics expansion.
function getActivityMoodScores(days, activityId, didActivity) {
  return days
    .filter((day) => Boolean(day.entry.activities[activityId]) === didActivity)
    .map((day) => getMood(day.entry.mood).score);
}

// Right now all configured activities are visible every day.
function getVisibleActivities(entry) {
  return activities;
}

// Right now all configured emotions are visible every day.
function getVisibleEmotions(entry) {
  return emotions;
}

// Legacy helper for older data shapes.
function getAllActivityDefinitions(days) {
  const definitions = new Map(activities.map((activity) => [activity.id, activity]));

  days.forEach((day) => {
    (day.entry.customActivities || []).forEach((activity) => {
      if (!definitions.has(activity.id)) definitions.set(activity.id, activity);
    });
  });

  return Array.from(definitions.values());
}

// Build a slug-like id from user text.
function getActivityId(name) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug ? `custom:${slug}` : `custom:${Date.now()}`;
}

// Build a slug-like id from user text.
function getEmotionId(name) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug ? `emotion:${slug}` : `emotion:${Date.now()}`;
}

// Average the mood score across many stored day records.
function getAverageMood(days) {
  return average(
    days
      .map((day) => getMood(day.entry.mood))
      .filter(Boolean)
      .map((mood) => mood.score)
  );
}

// Map completion state to a calendar cell color/state class.
function getTimelineStatus(answered, completed) {
  if (answered === 0) return "";
  if (completed === habits.length) return "done";
  if (completed > 0) return "partial";
  return "missed";
}

// Turn two averages into a short comparison label for Insights.
function getCorrelationLabel(yesAvg, noAvg) {
  if (yesAvg === null || noAvg === null) return "needs data";
  const diff = yesAvg - noAvg;
  if (Math.abs(diff) < 0.25) return "similar";
  return diff > 0 ? "higher with Yes" : "higher with No";
}

// Count consecutive "yes" answers going backward from today.
function getCurrentStreak(habitId, storedByDate) {
  let streak = 0;
  let cursor = new Date(today);

  while (true) {
    const dateKey = formatDateKey(cursor);
    const day = storedByDate.get(dateKey);
    if (!day || day.entry.answers[habitId] !== "yes") return streak;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
}

// ---- UI helpers ----

// Reusable "nothing to show" text block.
function createEmptyState(message) {
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = message;
  return empty;
}

// Small stat card used in the check-in summary area.
function createStatCard(label, value, detail) {
  const card = document.createElement("article");
  card.className = "stat-card";

  const labelEl = document.createElement("p");
  labelEl.className = "stat-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("p");
  valueEl.className = "stat-value";
  valueEl.textContent = value;

  const detailEl = document.createElement("p");
  detailEl.className = "stat-detail";
  detailEl.textContent = detail;

  card.append(labelEl, valueEl, detailEl);
  return card;
}

// Reusable pill used in correlation rows to show average score + sample size.
function createCorrelationPill(label, moodAverage, count) {
  const pill = document.createElement("div");
  pill.className = "correlation-pill";

  const title = document.createElement("strong");
  title.textContent = label;

  const value = document.createElement("span");
  value.textContent =
    moodAverage === null ? "No data" : `${moodAverage.toFixed(1)}/5 from ${count}`;

  pill.append(title, value);
  return pill;
}
