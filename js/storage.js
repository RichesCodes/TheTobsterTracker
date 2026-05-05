// Storage helpers are responsible for translating between:
// - localStorage strings
// - normalized JavaScript objects
// - config lists used by the UI

// Load one day's entry from localStorage.
function loadDay(dateKey) {
  const saved = localStorage.getItem(`${STORAGE_PREFIX}${dateKey}`);
  if (!saved) return createEmptyEntry();

  try {
    return normalizeEntry(JSON.parse(saved));
  } catch {
    return createEmptyEntry();
  }
}

// Save the currently viewed day back to localStorage.
function saveView() {
  viewEntry.updatedAt = new Date().toISOString();
  localStorage.setItem(getViewStorageKey(), JSON.stringify(viewEntry));
}

// Read every stored day from localStorage and return them sorted oldest -> newest.
function getStoredDays() {
  const days = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
    if ([HABITS_KEY, ACTIVITIES_KEY, EMOTIONS_KEY, MOODS_KEY].includes(key)) continue;

    const dateKey = key.slice(STORAGE_PREFIX.length);
    const date = parseDateKey(dateKey);
    if (!date) continue;

    try {
      days.push({
        date,
        dateKey,
        entry: normalizeEntry(JSON.parse(localStorage.getItem(key))),
      });
    } catch {
      continue;
    }
  }

  return days.sort((a, b) => a.date - b.date);
}

// Legacy helper kept from an earlier insights implementation.
function getLastThirtyDays(storedByDate) {
  return Array.from({ length: 30 }, (_, index) => {
    const date = addDays(today, index - 29);
    const dateKey = formatDateKey(date);
    const stored = storedByDate.get(dateKey);

    return {
      date,
      dateKey,
      entry: stored ? stored.entry : createEmptyEntry(),
    };
  });
}

// Load the saved habit list, or fall back to defaults.
function loadHabitsConfig() {
  return loadConfigList(HABITS_KEY, DEFAULT_HABITS, "name");
}

// Persist the current habits array.
function saveHabitsConfig() {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}

// Load activities, migrating any old per-day custom activities into the config list once.
function loadActivitiesConfig() {
  const saved = localStorage.getItem(ACTIVITIES_KEY);
  const loaded = loadConfigList(ACTIVITIES_KEY, DEFAULT_ACTIVITIES, "name");

  if (saved) return loaded;

  const migrated = mergeConfigLists(
    loaded,
    collectLegacyDailyConfig("customActivities", CUSTOM_ACTIVITY_EMOJI, "name")
  );
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(migrated));
  return migrated;
}

// Persist the current activities array.
function saveActivitiesConfig() {
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
}

// Load emotions, migrating any old per-day custom emotions into the config list once.
function loadEmotionsConfig() {
  const saved = localStorage.getItem(EMOTIONS_KEY);
  const loaded = loadConfigList(EMOTIONS_KEY, DEFAULT_EMOTIONS, "name");

  if (saved) return loaded;

  const migrated = mergeConfigLists(
    loaded,
    collectLegacyDailyConfig("customEmotions", CUSTOM_EMOTION_EMOJI, "name")
  );
  localStorage.setItem(EMOTIONS_KEY, JSON.stringify(migrated));
  return migrated;
}

// Persist the current emotions array.
function saveEmotionsConfig() {
  localStorage.setItem(EMOTIONS_KEY, JSON.stringify(emotions));
}

// Load moods from config storage.
function loadMoodsConfig() {
  return loadConfigList(MOODS_KEY, DEFAULT_MOODS, "label", true);
}

// Persist the current moods array.
function saveMoodsConfig() {
  localStorage.setItem(MOODS_KEY, JSON.stringify(moods));
}

// Shared loader for config lists like habits, activities, emotions, and moods.
function loadConfigList(key, defaults, nameField, includeScore = false) {
  const saved = localStorage.getItem(key);
  if (!saved) return defaults.map((item) => ({ ...item }));

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.every((item) => isValidConfigItem(item, nameField, includeScore))) {
      return parsed.map((item) => normalizeConfigItem(item, nameField, includeScore));
    }
  } catch {
    // fall through
  }

  return defaults.map((item) => ({ ...item }));
}

// Validate one stored config item before the app trusts it.
function isValidConfigItem(item, nameField, includeScore) {
  if (!item || typeof item !== "object") return false;
  if (!item.id || !item.emoji || !item[nameField]) return false;
  if (includeScore && !Number.isFinite(Number(item.score))) return false;
  return true;
}

// Normalize a config item so the rest of the app sees a consistent shape.
function normalizeConfigItem(item, nameField, includeScore) {
  const normalized = {
    id: String(item.id),
    [nameField]: String(item[nameField]),
    emoji: String(item.emoji),
  };

  if (includeScore) {
    normalized.score = Math.max(0, Math.min(5, Number(item.score)));
  }

  return normalized;
}

// Scan old saved day entries for legacy embedded custom config items.
function collectLegacyDailyConfig(field, fallbackEmoji, nameField) {
  const items = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
    if (!parseDateKey(key.slice(STORAGE_PREFIX.length))) continue;

    try {
      const raw = JSON.parse(localStorage.getItem(key));
      if (!raw || !Array.isArray(raw[field])) continue;

      raw[field].forEach((item) => {
        if (!item || typeof item !== "object") return;
        const id = typeof item.id === "string" ? item.id.trim() : "";
        const name = typeof item[nameField] === "string" ? item[nameField].trim() : "";
        const emoji = typeof item.emoji === "string" ? item.emoji : fallbackEmoji;

        if (id && name) {
          items.push({ id, [nameField]: name, emoji });
        }
      });
    } catch {
      continue;
    }
  }

  return items;
}

// Merge a default list with migrated extras without duplicating ids.
function mergeConfigLists(primary, extras) {
  const byId = new Map(primary.map((item) => [item.id, item]));

  extras.forEach((item) => {
    if (!byId.has(item.id)) byId.set(item.id, item);
  });

  return Array.from(byId.values());
}

// Generate ids for newly created habits, activities, emotions, and moods.
function generateId(prefix = "item") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// Build a portable JSON-friendly backup of all app-owned data in localStorage.
function buildBackupPayload() {
  return {
    app: "TobsterTracker",
    version: 1,
    exportedAt: new Date().toISOString(),
    theme: localStorage.getItem("theme"),
    habits: loadHabitsConfig(),
    activities: loadActivitiesConfig(),
    emotions: loadEmotionsConfig(),
    moods: loadMoodsConfig(),
    days: getStoredDays().map((day) => ({
      dateKey: day.dateKey,
      entry: day.entry,
    })),
  };
}
