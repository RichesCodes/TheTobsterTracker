// ---- Mood model ----
//
// SQL table: moods
//   id         TEXT PRIMARY KEY
//   label      TEXT NOT NULL
//   emoji      TEXT NOT NULL
//   score      INTEGER NOT NULL CHECK (score BETWEEN 0 AND 5)
//   created_at TEXT NOT NULL

function validateMoodFields(label, emoji, score, existingItems = []) {
  const trimmed = typeof label === "string" ? label.trim() : "";
  if (!trimmed) return "Name is required.";
  if (trimmed.length > 40) return "Name must be 40 characters or fewer.";
  if (!emoji) return "Please select an emoji.";
  if (!Number.isFinite(score) || score < 1 || score > 5) return "Please select a score from 1 to 5.";
  if (existingItems.some((m) => m.label.toLowerCase() === trimmed.toLowerCase())) {
    return "A mood with that name already exists.";
  }
  return null;
}

function createMoodModel(label, emoji, score) {
  return {
    id:        generateId("mood"),
    label:     label.trim(),
    emoji,
    score,
    createdAt: new Date().toISOString(),
  };
}
