// All fixed app-wide values live here.
// Keeping them in one place makes the rest of the code easier to read and edit.

// localStorage keys:
// - day entries use STORAGE_PREFIX + YYYY-MM-DD
// - config lists use the dedicated config keys below
const STORAGE_PREFIX = "habits:";
const HABITS_KEY = "habits:config";
const ACTIVITIES_KEY = "habits:activities-config";
const EMOTIONS_KEY = "habits:emotions-config";
const MOODS_KEY = "habits:moods-config";

// Default habits shown to every new user.
const DEFAULT_HABITS = [
  { id: "teethmorning", name: "Brush Teeth - Morning", emoji: "\u{1F9B7}" },
  { id: "morning-pills", name: "Take Morning Drugs", emoji: "\u{1F48A}" },
  { id: "eat-breakfast", name: "Eat Breakfast", emoji: "\u{1F373}" },
  { id: "drink-water", name: "Drink Water", emoji: "\u{1F4A7}" },
  { id: "eat-lunch", name: "Eat Lunch", emoji: "\u{1F96A}" },
  { id: "afternoon-pills", name: "Take Afternoon Drugs", emoji: "\u{1F48A}" },
  { id: "eat-dinner", name: "Eat Dinner", emoji: "\u{1F969}" },
  { id: "teethnight", name: "Brush Teeth - Night", emoji: "\u{1F9B7}" },
];

// Default daily activities used for check-ins and future insights.
const DEFAULT_ACTIVITIES = [
  { id: "friends", name: "Friends", emoji: "\u{1F91D}" },
  { id: "family", name: "Family", emoji: "\u{1F46A}" },
  { id: "hobby", name: "Hobby", emoji: "\u{1F3A8}" },
  { id: "left-the-house", name: "Left the House", emoji: "\u{1F3E0}" },
  { id: "worked-out", name: "Worked Out", emoji: "\u{1F4AA}" },
];

const CUSTOM_ACTIVITY_EMOJI = "\u{2728}";

// Default emotion tags a user can attach to a day.
const DEFAULT_EMOTIONS = [
  { id: "overwhelmed", name: "Overwhelmed", emoji: "\u{1F635}\u{200D}\u{1F4AB}" },
  { id: "anxious", name: "Anxious", emoji: "\u{1F630}" },
  { id: "angry", name: "Angry", emoji: "\u{1F620}" },
  { id: "horny", name: "Horny", emoji: "\u{1F60F}" },
  { id: "sad", name: "Sad", emoji: "\u{1F61E}" },
];

const CUSTOM_EMOTION_EMOJI = "\u{1F4AD}";

// Mood is different from emotion:
// - mood = one overall feeling for the day with a numeric score
// - emotions = many tags that can be selected together
const DEFAULT_MOODS = [
  { id: "great", label: "Great", emoji: "\u{1F601}", score: 5 },
  { id: "good", label: "Good", emoji: "\u{1F642}", score: 4 },
  { id: "okay", label: "Okay", emoji: "\u{1F610}", score: 3 },
  { id: "low", label: "Low", emoji: "\u{1F641}", score: 2 },
  { id: "rough", label: "Rough", emoji: "\u{1F623}", score: 1 },
];

const CUSTOM_MOOD_EMOJI = "\u{1F642}";

// Shared emoji picker options used in the Customize UI.
const EMOJI_OPTIONS = [
  "\u{1FAA5}", "\u{1F4A7}", "\u{1F48A}", "\u{1F3C3}", "\u{1F6B4}", "\u{1F9D8}",
  "\u{1F4AA}", "\u{1F957}", "\u{1F34E}", "\u{2615}", "\u{1F4DA}", "\u{270D}\u{FE0F}",
  "\u{1F3B5}", "\u{1F33F}", "\u{1F6C1}", "\u{1F31E}", "\u{1F319}", "\u{1F9F9}",
  "\u{1F3AF}", "\u{1F634}", "\u{2764}\u{FE0F}", "\u{1F9B7}", "\u{1F9F4}", "\u{1F938}",
  "\u{1F601}", "\u{1F642}", "\u{1F610}", "\u{1F641}", "\u{1F623}", "\u{1F630}",
  "\u{1F620}", "\u{1F60F}", "\u{1F61E}", "\u{1F4AD}", "\u{2728}", "\u{1F91D}",
];

// Calendar header labels for the Insights month/week grid.
const DAY_NAMES = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
