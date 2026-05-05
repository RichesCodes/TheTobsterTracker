(function () {
  // This file exposes a tiny testing API on window so the app can seed itself with
  // believable sample data. It is meant for development and demos, not production use.

  const keys = {
    habits: "habits:config",
    activities: "habits:activities-config",
    emotions: "habits:emotions-config",
    moods: "habits:moods-config",
  };

  const habits = [
    { id: "brush-teeth", name: "Brush Teeth", emoji: "\u{1FAA5}" },
    { id: "drink-water", name: "Drink Water", emoji: "\u{1F4A7}" },
    { id: "take-vitamins", name: "Take Vitamins", emoji: "\u{1F48A}" },
    { id: "demo-read", name: "Read", emoji: "\u{1F4DA}" },
    { id: "demo-walk", name: "Walk", emoji: "\u{1F6B6}" },
  ];

  const activities = [
    { id: "friends", name: "Friends", emoji: "\u{1F91D}" },
    { id: "family", name: "Family", emoji: "\u{1F46A}" },
    { id: "hobby", name: "Hobby", emoji: "\u{1F3A8}" },
    { id: "left-the-house", name: "Left the House", emoji: "\u{1F3E0}" },
    { id: "worked-out", name: "Worked Out", emoji: "\u{1F4AA}" },
    { id: "demo-meditated", name: "Meditated", emoji: "\u{1F9D8}" },
    { id: "demo-cooked", name: "Cooked", emoji: "\u{1F957}" },
  ];

  const emotions = [
    { id: "overwhelmed", name: "Overwhelmed", emoji: "\u{1F635}\u{200D}\u{1F4AB}" },
    { id: "anxious", name: "Anxious", emoji: "\u{1F630}" },
    { id: "angry", name: "Angry", emoji: "\u{1F620}" },
    { id: "horny", name: "Horny", emoji: "\u{1F60F}" },
    { id: "sad", name: "Sad", emoji: "\u{1F61E}" },
    { id: "demo-focused", name: "Focused", emoji: "\u{1F3AF}" },
    { id: "demo-tired", name: "Tired", emoji: "\u{1F634}" },
  ];

  const moods = [
    { id: "great", label: "Great", emoji: "\u{1F601}", score: 5 },
    { id: "good", label: "Good", emoji: "\u{1F642}", score: 4 },
    { id: "okay", label: "Okay", emoji: "\u{1F610}", score: 3 },
    { id: "low", label: "Low", emoji: "\u{1F641}", score: 2 },
    { id: "rough", label: "Rough", emoji: "\u{1F623}", score: 1 },
    { id: "demo-energized", label: "Energized", emoji: "\u{26A1}", score: 5 },
    { id: "demo-drained", label: "Drained", emoji: "\u{1FAAB}", score: 2 },
  ];

  // Local date formatting helper so this script can run independently.
  function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Small helper for generating a date range.
  function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  // Remove all app-owned keys so the demo can start from a clean slate.
  function clearAppData() {
    const toRemove = [];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && (key.startsWith("habits:") || key === "theme")) {
        toRemove.push(key);
      }
    }

    toRemove.forEach((key) => localStorage.removeItem(key));
  }

  // Build one fake day of data.
  // The modulo-based rules create repeatable patterns for testing Insights.
  function buildEntry(index, date) {
    const strongDay = index % 6 !== 0;
    const socialDay = index % 5 === 0 || index % 7 === 0;
    const workoutDay = index % 3 === 0;
    const quietDay = index % 4 === 0;
    const tiredDay = index % 8 === 0;

    const answers = {
      "brush-teeth": strongDay || index % 11 !== 0 ? "yes" : "no",
      "drink-water": index % 4 === 1 ? "no" : "yes",
      "take-vitamins": index % 5 === 2 ? "no" : "yes",
      "demo-read": quietDay || index % 3 === 1 ? "yes" : "no",
      "demo-walk": workoutDay || socialDay ? "yes" : "no",
    };

    const activitiesForDay = {
      "left-the-house": socialDay || workoutDay,
      "worked-out": workoutDay,
      friends: socialDay,
      family: index % 6 === 2,
      hobby: quietDay,
      "demo-meditated": quietDay && !tiredDay,
      "demo-cooked": index % 4 !== 2,
    };

    const emotionsForDay = {
      overwhelmed: index % 9 === 0,
      anxious: index % 7 === 3,
      angry: index % 13 === 4,
      horny: index % 10 === 5,
      sad: tiredDay,
      "demo-focused": quietDay || workoutDay,
      "demo-tired": tiredDay,
    };

    const completed = Object.values(answers).filter((answer) => answer === "yes").length;
    let mood = "okay";

    if (completed >= 4 && (workoutDay || socialDay)) mood = "great";
    else if (completed >= 4) mood = "good";
    else if (tiredDay || emotionsForDay.overwhelmed) mood = "demo-drained";
    else if (completed <= 2) mood = "low";
    if (workoutDay && quietDay) mood = "demo-energized";

    Object.keys(activitiesForDay).forEach((key) => {
      if (!activitiesForDay[key]) delete activitiesForDay[key];
    });
    Object.keys(emotionsForDay).forEach((key) => {
      if (!emotionsForDay[key]) delete emotionsForDay[key];
    });

    return {
      answers,
      mood,
      activities: activitiesForDay,
      emotions: emotionsForDay,
      updatedAt: date.toISOString(),
    };
  }

  // Public method: replace all app data with sample data covering roughly 6 weeks.
  function seed() {
    clearAppData();
    localStorage.setItem(keys.habits, JSON.stringify(habits));
    localStorage.setItem(keys.activities, JSON.stringify(activities));
    localStorage.setItem(keys.emotions, JSON.stringify(emotions));
    localStorage.setItem(keys.moods, JSON.stringify(moods));

    const today = new Date();

    for (let offset = -41; offset <= 0; offset += 1) {
      const date = addDays(today, offset);
      const index = Math.abs(offset);
      localStorage.setItem(`habits:${formatDateKey(date)}`, JSON.stringify(buildEntry(index, date)));
    }
  }

  // Expose a small API that the Customize -> Testing section can call.
  window.TobsterTestData = {
    seed,
    wipe: clearAppData,
  };
})();
