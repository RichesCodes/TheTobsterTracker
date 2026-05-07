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
  // Morning routine
  { id: "wake-up", name: "Wake Up", emoji: "⏰", group: "am" },
  { id: "dogs-out-am", name: "Let Dogs Out (AM)", emoji: "\u{1F43E}", group: "am" },
  { id: "morning-pills", name: "Take Morning Meds", emoji: "\u{1F48A}", group: "am" },
  { id: "start-coffee", name: "Start Coffee", emoji: "☕", group: "am" },
  { id: "potty-pad-litter", name: "Clean Potty Pad & Litter", emoji: "\u{1F9F9}", group: "am" },
  { id: "drink-coffee", name: "Drink Coffee", emoji: "\u{1FAD6}", group: "am" },
  { id: "eat-breakfast", name: "Eat Breakfast", emoji: "\u{1F373}", group: "am" },
  { id: "write-todo", name: "Write Daily To-Do List", emoji: "\u{1F4DD}", group: "am" },
  { id: "teethmorning", name: "Brush Teeth (AM)", emoji: "\u{1F9B7}", group: "am" },
  { id: "floss-string", name: "Floss - String", emoji: "\u{1FAA5}", group: "am" },
  { id: "floss-water", name: "Floss - Water", emoji: "\u{1F4A7}", group: "am" },
  { id: "scrape-tongue", name: "Scrape Tongue", emoji: "\u{1F9FC}", group: "am" },
  { id: "mouthwash", name: "Mouthwash", emoji: "\u{1FAE7}", group: "am" },
  { id: "face-wash", name: "Face Wash", emoji: "\u{1F9FC}", group: "am" },
  { id: "toner-serum", name: "Toner / Serum", emoji: "✨", group: "am" },
  { id: "moisturize-face", name: "Moisturize Face", emoji: "\u{1F9F4}", group: "am" },
  { id: "lip-balm", name: "Lip Balm", emoji: "\u{1F48B}", group: "am" },
  { id: "deodorant", name: "Deodorant", emoji: "\u{1F338}", group: "am" },
  { id: "brush-hair-am", name: "Brush Hair (AM)", emoji: "\u{1FAB8}", group: "am" },
  { id: "get-dressed", name: "Get Dressed", emoji: "\u{1F455}", group: "am" },
  { id: "make-bed", name: "Make Bed", emoji: "\u{1F6CF}\u{FE0F}", group: "am" },
  { id: "quick-tidy", name: "Pick Up House (Quick Tidy)", emoji: "\u{1F3E0}", group: "am" },
  { id: "start-day", name: "Start Day", emoji: "\u{1F680}", group: "am" },

  // Midday
  { id: "drink-water", name: "Drink Water", emoji: "\u{1F4A7}", group: "midday" },
  { id: "eat-lunch", name: "Eat Lunch", emoji: "\u{1F96A}", group: "midday" },
  { id: "afternoon-pills", name: "Take Afternoon Meds", emoji: "\u{1F48A}", group: "midday" },

  // Evening routine
  { id: "eat-dinner", name: "Eat Dinner", emoji: "\u{1F969}", group: "pm" },

  { id: "dishes", name: "Dishes - Wash & Dry", emoji: "\u{1F37D}\u{FE0F}", group: "pm" },
  { id: "set-coffee-maker", name: "Set Coffee Maker", emoji: "⏲\u{FE0F}", group: "pm" },
  { id: "dogs-out-pm", name: "Let Dogs Out (PM)", emoji: "\u{1F43E}", group: "pm" },
  { id: "fresh-potty-pad", name: "Put Out Fresh Potty Pad", emoji: "\u{1F415}", group: "pm" },
  { id: "teethnight", name: "Brush Teeth (PM)", emoji: "\u{1F9B7}", group: "pm" },
  { id: "take-shower", name: "Take Shower", emoji: "\u{1F6BF}", group: "pm" },
  { id: "night-skincare", name: "Night Skincare", emoji: "\u{1F319}", group: "pm" },
  { id: "lotion-body", name: "Lotion Body", emoji: "\u{1F9F4}", group: "pm" },
  { id: "brush-hair-pm", name: "Brush Hair (PM)", emoji: "\u{1FAB8}", group: "pm" },
  { id: "put-on-pjs", name: "Put On PJs", emoji: "\u{1F634}", group: "pm" },
  { id: "dogs-out-late", name: "Let Dogs Out (Late Night)", emoji: "\u{1F43E}", group: "pm" },
  { id: "get-in-bed", name: "Get In Bed", emoji: "\u{1F6CF}\u{FE0F}", group: "pm" },
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
