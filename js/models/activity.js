// ---- Activity model ----
//
// SQL table: activities
//   id         TEXT PRIMARY KEY
//   name       TEXT NOT NULL
//   emoji      TEXT NOT NULL
//   sort_order INTEGER NOT NULL DEFAULT 0
//   created_at TEXT NOT NULL

function validateActivityFields(name, emoji, existingItems = []) {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed) return "Name is required.";
  if (trimmed.length > 40) return "Name must be 40 characters or fewer.";
  if (!emoji) return "Please select an emoji.";
  if (existingItems.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())) {
    return "An activity with that name already exists.";
  }
  return null;
}

function createActivityModel(name, emoji) {
  return {
    id:        generateId("activity"),
    name:      name.trim(),
    emoji,
    createdAt: new Date().toISOString(),
  };
}
