// ---- State ----
//
// These globals are the app's in-memory state while the page is open.
// localStorage keeps the long-term copy across refreshes.

// The current editable config lists.
let habits = loadHabitsConfig();
let activities = loadActivitiesConfig();
let emotions = loadEmotionsConfig();
let moods = loadMoodsConfig();

// "today" is captured once at app startup and reused across views.
const today = new Date();
const todayKey = formatDateKey(today);

// Today page state.
let viewOffset     = 0;
let flowStep       = 0;
let customizeOpen  = false;

// Temporary customize form selections.
let selectedHabitEmoji = EMOJI_OPTIONS[0];
let selectedActivityEmoji = CUSTOM_ACTIVITY_EMOJI;
let selectedEmotionEmoji = CUSTOM_EMOTION_EMOJI;
let selectedMoodEmoji = CUSTOM_MOOD_EMOJI;
let selectedMoodScore = 3;

// Insights page state.
let insightsPeriod = "week";
let insightsOffset = 0;
let insightLinkTab = "mood";
let habitSummaryTab = "period";
let habitLinkMode = "link";
let activityLinkMode = "link";
let emotionLinkMode = "link";
const insightPages = {
  mood: 0,
  activity: 0,
  emotion: 0,
};

// Tracks which details sections are expanded in the Customize panel.
const openCustomizeSections = new Set();

// Convert the current view offset into a date and then into a storage key.
function getViewDate()       { return addDays(today, viewOffset); }
function getViewKey()        { return formatDateKey(getViewDate()); }
function getViewStorageKey() { return `${STORAGE_PREFIX}${getViewKey()}`; }

// ---- DOM refs ----
//
// Cache references to HTML elements so the rest of the code can use them directly.

const habitFlowEl     = document.querySelector("#habit-list");
const dateEl          = document.querySelector("#today-date");
const eyebrowEl       = document.querySelector("#eyebrow-text");
const finishDayBtn    = document.querySelector("#finish-day");
const resetButton     = document.querySelector("#reset-today");
const customizeBtn    = document.querySelector("#customize-toggle");
const customizePanel  = document.querySelector("#customize-panel");
const moodOptions     = document.querySelector("#mood-options");
const activityOptions = document.querySelector("#activity-options");
const emotionOptions  = document.querySelector("#emotion-options");
const segmentButtons  = document.querySelectorAll(".segment");
const prevDayBtn      = document.querySelector("#prev-day");
const nextDayBtn      = document.querySelector("#next-day");
const darkToggleBtn   = document.querySelector("#dark-mode-toggle");
const views = {
  today:    document.querySelector("#today-view"),
  insights: document.querySelector("#insights-view"),
};
const checkinPanel    = document.querySelector("#checkin-panel");
const habitSummaryPanel = document.querySelector("#habit-summary-panel");

// This is the full data object for whichever day the user is currently viewing.
let viewEntry = loadDay(getViewKey());

// Start the app on the first unanswered habit.
initFlowStep();

// ---- Dark mode ----

// Restore a previously saved theme choice before the user interacts with the page.
const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
  document.documentElement.dataset.theme = savedTheme;
}
updateDarkToggle();

// Flip between light and dark mode and persist the choice.
darkToggleBtn.addEventListener("click", () => {
  const next = isDarkMode() ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
  updateDarkToggle();
});

// If the system theme changes, refresh the button icon/label.
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", updateDarkToggle);

// ---- Day navigation ----

// Move to an earlier day and redraw the app with that day's data.
prevDayBtn.addEventListener("click", () => {
  viewOffset -= 1;
  viewEntry = loadDay(getViewKey());
  initFlowStep();
  celebrationTriggered = false;
  updateHeader();
  renderAll();
});

// Move toward today, but never beyond it.
nextDayBtn.addEventListener("click", () => {
  if (viewOffset < 0) {
    viewOffset += 1;
    viewEntry = loadDay(getViewKey());
    initFlowStep();
    celebrationTriggered = false;
    updateHeader();
    renderAll();
  }
});

// ---- Segment nav ----

// Switch between the Today and Insights screens.
segmentButtons.forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

// ---- Finish day ----

// Mark the day as finished, lock the mood/activity/emotion sections, then celebrate.
finishDayBtn.addEventListener("click", () => {
  viewEntry.finished = true;
  saveView();
  celebrationTriggered = true;
  renderAll();
  showCelebrationPrompt();
});

// ---- Reset ----

// Reset only the current day entry.
// This intentionally does not remove the user's saved config lists.
resetButton.addEventListener("click", () => {
  viewEntry = createEmptyEntry();
  flowStep = 0;
  localStorage.removeItem(getViewStorageKey());
  renderAll();
});

// ---- Customize toggle ----

// Open or close the configuration UI.
customizeBtn.addEventListener("click", () => {
  customizeOpen = !customizeOpen;
  renderAll();
});

// Initial page render.
updateHeader();
renderAll();

// ---- View switching ----

// Show the requested top-level view and hide the other one.
function showView(viewName) {
  Object.entries(views).forEach(([name, view]) => {
    const isActive = name === viewName;
    view.hidden = !isActive;
    view.classList.toggle("active", isActive);
  });

  segmentButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
}

// ---- Header ----

// Update the visible date text and the reset/next-day button states.
function updateHeader() {
  const viewDate = getViewDate();

  dateEl.textContent = viewDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (viewOffset === 0) {
    eyebrowEl.textContent = "Today";
  } else if (viewOffset === -1) {
    eyebrowEl.textContent = "Yesterday";
  } else {
    eyebrowEl.textContent = `${Math.abs(viewOffset)} days ago`;
  }

  nextDayBtn.disabled = viewOffset >= 0;
  resetButton.textContent = viewOffset === 0 ? "Reset Today" : "Reset This Day";
}

// ---- Render ----

// Small apps can get a lot done with one shared redraw function.
// Any state change calls this so the UI stays synchronized with localStorage and memory.
function renderAll() {
  renderHabitFlow();
  renderActivities();
  renderMood();
  renderEmotions();
  renderCustomizePanel();
  renderInsights();
  finishDayBtn.hidden = Boolean(viewEntry.finished);
}

// ---- Dark mode helpers ----

// Resolve the active theme, falling back to the browser/OS preference when needed.
function isDarkMode() {
  const theme = document.documentElement.dataset.theme;
  if (theme === "dark")  return true;
  if (theme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// Keep the theme toggle's icon and aria-label aligned with the active theme.
function updateDarkToggle() {
  darkToggleBtn.textContent = isDarkMode() ? "☀" : "☾";
  darkToggleBtn.setAttribute(
    "aria-label",
    isDarkMode() ? "Switch to light mode" : "Switch to dark mode"
  );
}
