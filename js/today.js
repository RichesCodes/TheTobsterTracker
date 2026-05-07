// ---- Today view ----
//
// This file renders the interactive logging UI and handles all actions a user
// can take while editing one day.

// Draw the one-habit-at-a-time flow at the top of the Today page.
function renderHabitFlow() {
  habitFlowEl.innerHTML = "";
  habitFlowEl.className = "habit-flow";

  const active = getActiveHabits();

  if (habits.length === 0) {
    habitFlowEl.append(createEmptyState("No habits yet. Tap Customize below to add one."));
    return;
  }
  if (active.length === 0) {
    habitFlowEl.append(createEmptyState("All habits are hidden. Enable some in Customize below."));
    return;
  }

  const dotsRow = document.createElement("div");
  dotsRow.className = "habit-progress";
  dotsRow.setAttribute("aria-hidden", "true");

  active.forEach((habit, index) => {
    const dot = document.createElement("span");
    dot.className = "progress-dot";
    if (viewEntry.answers[habit.id]) {
      dot.classList.add("done");
    } else if (index === flowStep) {
      dot.classList.add("active");
    }
    dotsRow.append(dot);
  });

  habitFlowEl.append(dotsRow);

  const allAnswered = active.every((h) => viewEntry.answers[h.id]);
  if (allAnswered || flowStep > active.length) {
    habitFlowEl.append(buildDoneCard());
    return;
  }

  habitFlowEl.append(buildHabitCard(active[flowStep]));
}

// Build the yes/no card for a single habit.
function buildHabitCard(habit) {
  const card = document.createElement("article");
  card.className = "habit-card";

  const title = document.createElement("h2");
  title.className = "habit-title";

  const emoji = document.createElement("span");
  emoji.className = "habit-emoji";
  emoji.setAttribute("aria-hidden", "true");
  emoji.textContent = habit.emoji;

  const name = document.createElement("span");
  name.textContent = habit.name;

  title.append(emoji, name);

  const answerGroup = document.createElement("div");
  answerGroup.className = "answer-group";
  answerGroup.setAttribute("role", "group");
  answerGroup.setAttribute("aria-label", habit.name);

  ["yes", "no"].forEach((answer) => {
    const button = document.createElement("button");
    const isSelected = viewEntry.answers[habit.id] === answer;

    button.className = "answer-button";
    button.type = "button";
    button.dataset.answer = answer;
    button.textContent = answer === "yes" ? "Yes" : "No";
    button.setAttribute("aria-pressed", String(isSelected));
    button.classList.toggle("selected", isSelected);

    // Clicking a button saves immediately and then moves the flow forward.
    button.addEventListener("click", () => {
      viewEntry.answers[habit.id] = answer;
      saveView();
      advanceFlow();
    });

    answerGroup.append(button);
  });

  card.append(title, answerGroup);
  return card;
}

// Build the "all done" card shown after every habit has an answer.
function buildDoneCard() {
  const active = getActiveHabits();
  const yesCount = active.filter((h) => viewEntry.answers[h.id] === "yes").length;
  const total = active.length;

  const card = document.createElement("div");
  card.className = "all-done-card";

  const emojiEl = document.createElement("div");
  emojiEl.className = "all-done-emoji";
  emojiEl.textContent = yesCount === total ? "\u{1F389}" : yesCount > 0 ? "\u{1F44D}" : "\u{1F610}";

  const titleEl = document.createElement("p");
  titleEl.className = "all-done-title";
  titleEl.textContent = yesCount === total ? "All done!" : `${yesCount} of ${total} done`;

  const subEl = document.createElement("p");
  subEl.className = "all-done-sub";
  subEl.textContent = "Log the rest of your day below";

  card.append(emojiEl, titleEl, subEl);
  return card;
}

// Move flowStep to the next unanswered habit.
function advanceFlow() {
  const active = getActiveHabits();
  for (let i = flowStep + 1; i < active.length; i++) {
    if (!viewEntry.answers[active[i].id]) {
      flowStep = i;
      renderAll();
      return;
    }
  }
  flowStep = active.length + 1;
  renderAll();
}

// When the page loads or the day changes, start on the first unanswered habit.
function initFlowStep() {
  const active = getActiveHabits();
  for (let i = 0; i < active.length; i++) {
    if (!viewEntry.answers[active[i].id]) {
      flowStep = i;
      return;
    }
  }
  flowStep = active.length + 1;
}

// Render the single-choice mood selector.
function renderMood() {
  moodOptions.innerHTML = "";

  moods.forEach((mood) => {
    const button = document.createElement("button");
    const isSelected = viewEntry.mood === mood.id;

    button.className = "mood-button tile-button";
    button.type = "button";
    button.setAttribute("aria-pressed", String(isSelected));
    button.classList.toggle("selected", isSelected);

    const emoji = document.createElement("span");
    emoji.className = "mood-emoji tile-emoji";
    emoji.setAttribute("aria-hidden", "true");
    emoji.textContent = mood.emoji;

    const label = document.createElement("span");
    label.className = "tile-label";
    label.textContent = mood.label;

    button.disabled = Boolean(viewEntry.finished);
    button.append(emoji, label);
    // Mood is a one-of-many selection, so clicking replaces the previous value.
    button.addEventListener("click", () => {
      viewEntry.mood = mood.id;
      saveView();
      renderAll();
      checkCelebrationTrigger();
    });

    moodOptions.append(button);
  });
}

// Render multi-select activity buttons.
function renderActivities() {
  activityOptions.innerHTML = "";

  getVisibleActivities(viewEntry).forEach((activity) => {
    const button = document.createElement("button");
    const isSelected = Boolean(viewEntry.activities[activity.id]);

    button.className = "activity-button tile-button";
    button.type = "button";
    button.setAttribute("aria-pressed", String(isSelected));
    button.classList.toggle("selected", isSelected);

    const emoji = document.createElement("span");
    emoji.className = "tile-emoji";
    emoji.setAttribute("aria-hidden", "true");
    emoji.textContent = activity.emoji || CUSTOM_ACTIVITY_EMOJI;

    const label = document.createElement("span");
    label.className = "tile-label";
    label.textContent = activity.name;

    button.disabled = Boolean(viewEntry.finished);
    button.append(emoji, label);
    button.addEventListener("click", () => {
      toggleActivity(activity.id);
    });

    activityOptions.append(button);
  });
}

// Toggle one activity on or off for the current day.
function toggleActivity(id) {
  if (viewEntry.activities[id]) {
    delete viewEntry.activities[id];
  } else {
    viewEntry.activities[id] = true;
  }

  saveView();
  renderAll();
}

// Render multi-select emotion buttons.
function renderEmotions() {
  emotionOptions.innerHTML = "";

  getVisibleEmotions(viewEntry).forEach((emotion) => {
    const button = document.createElement("button");
    const isSelected = Boolean(viewEntry.emotions[emotion.id]);

    button.className = "emotion-button tile-button";
    button.type = "button";
    button.setAttribute("aria-pressed", String(isSelected));
    button.classList.toggle("selected", isSelected);

    const emoji = document.createElement("span");
    emoji.className = "tile-emoji";
    emoji.setAttribute("aria-hidden", "true");
    emoji.textContent = emotion.emoji || CUSTOM_EMOTION_EMOJI;

    const label = document.createElement("span");
    label.className = "tile-label";
    label.textContent = emotion.name;

    button.disabled = Boolean(viewEntry.finished);
    button.append(emoji, label);
    button.addEventListener("click", () => {
      toggleEmotion(emotion.id);
    });

    emotionOptions.append(button);
  });
}

// Toggle one emotion on or off for the current day.
function toggleEmotion(id) {
  if (viewEntry.emotions[id]) {
    delete viewEntry.emotions[id];
  } else {
    viewEntry.emotions[id] = true;
  }

  saveView();
  renderAll();
}

// Create a new custom activity if needed, then mark it selected for the current day.
function addCustomActivity(rawName, emoji = selectedActivityEmoji) {
  const name = rawName.trim().replace(/\s+/g, " ");
  if (!name) return;

  const existing = activities.find((activity) => activity.name.toLowerCase() === name.toLowerCase());
  const activity = existing || { id: generateId("activity"), name, emoji };

  if (!existing) {
    activities.push(activity);
    saveActivitiesConfig();
  }

  viewEntry.activities[activity.id] = true;
  saveView();
  renderAll();
}

// Create a new custom emotion if needed, then mark it selected for the current day.
function addCustomEmotion(rawName, emoji = selectedEmotionEmoji) {
  const name = rawName.trim().replace(/\s+/g, " ");
  if (!name) return;

  const existing = emotions.find((emotion) => emotion.name.toLowerCase() === name.toLowerCase());
  const emotion = existing || { id: generateId("emotion"), name, emoji };

  if (!existing) {
    emotions.push(emotion);
    saveEmotionsConfig();
  }

  viewEntry.emotions[emotion.id] = true;
  saveView();
  renderAll();
}

// Create a custom mood if needed, then set it as the day's current mood.
function addCustomMood(rawLabel, emoji = selectedMoodEmoji, score = selectedMoodScore) {
  const label = rawLabel.trim().replace(/\s+/g, " ");
  if (!label) return;

  const existing = moods.find((mood) => mood.label.toLowerCase() === label.toLowerCase());
  const mood = existing || { id: generateId("mood"), label, emoji, score };

  if (!existing) {
    moods.push(mood);
    saveMoodsConfig();
  }

  viewEntry.mood = mood.id;
  saveView();
  renderAll();
}

// Build the entire Customize area from scratch each render.
function renderCustomizePanel() {
  customizePanel.hidden = !customizeOpen;
  customizeBtn.textContent = customizeOpen ? "Done Customizing" : "Customize";
  customizePanel.innerHTML = "";

  if (!customizeOpen) {
    return;
  }

  const header = document.createElement("div");
  header.className = "edit-header";

  const title = document.createElement("p");
  title.className = "edit-title";
  title.textContent = "Customize";

  const doneBtn = document.createElement("button");
  doneBtn.className = "edit-done-button";
  doneBtn.type = "button";
  doneBtn.textContent = "Done";
  doneBtn.addEventListener("click", () => {
    customizeOpen = false;
    initFlowStep();
    renderAll();
  });

  header.append(title, doneBtn);
  customizePanel.append(header);
  customizePanel.append(buildHabitsSection());
  customizePanel.append(
    buildCustomizeSection("Activities", activities, "name", removeActivity, buildAddConfigForm({
      labelText: "Add an activity",
      placeholder: "Activity name...",
      getEmoji: () => selectedActivityEmoji,
      setEmoji: (emoji) => { selectedActivityEmoji = emoji; },
      onAdd: (name) => addCustomActivity(name, selectedActivityEmoji),
      validate: (name, emoji) => validateActivityFields(name, emoji, activities),
    }))
  );
  customizePanel.append(
    buildCustomizeSection("Emotions", emotions, "name", removeEmotion, buildAddConfigForm({
      labelText: "Add an emotion",
      placeholder: "Emotion name...",
      getEmoji: () => selectedEmotionEmoji,
      setEmoji: (emoji) => { selectedEmotionEmoji = emoji; },
      onAdd: (name) => addCustomEmotion(name, selectedEmotionEmoji),
      validate: (name, emoji) => validateEmotionFields(name, emoji, emotions),
    }))
  );
  customizePanel.append(
    buildCustomizeSection("Moods", moods, "label", removeMood, buildAddConfigForm({
      labelText: "Add a mood",
      placeholder: "Mood name...",
      getEmoji: () => selectedMoodEmoji,
      setEmoji: (emoji) => { selectedMoodEmoji = emoji; },
      getScore: () => selectedMoodScore,
      setScore: (score) => { selectedMoodScore = score; },
      onAdd: (name) => addCustomMood(name, selectedMoodEmoji, selectedMoodScore),
      validate: (name, emoji, score) => validateMoodFields(name, emoji, score, moods),
    }))
  );
  customizePanel.append(buildDataSection());
  customizePanel.append(buildTestingSection());
}

// Outer "Habits" section containing collapsible AM / Midday / PM subsections.
function buildHabitsSection() {
  const details = document.createElement("details");
  details.className = "customize-section";
  details.open = openCustomizeSections.has("Habits");
  details.addEventListener("toggle", () => {
    if (details.open) openCustomizeSections.add("Habits");
    else openCustomizeSections.delete("Habits");
  });

  const summary = document.createElement("summary");
  summary.className = "customize-summary";

  const titleEl = document.createElement("span");
  titleEl.textContent = "Habits";

  const activeCount = habits.filter((h) => !h.disabled).length;
  const count = document.createElement("span");
  count.className = "customize-count";
  count.textContent = `${activeCount} / ${habits.length}`;

  summary.append(titleEl, count);
  details.append(summary);

  const body = document.createElement("div");
  body.className = "customize-section-body";

  [
    { key: "am",     title: "AM Routine" },
    { key: "midday", title: "Midday"     },
    { key: "pm",     title: "PM Routine" },
  ].forEach(({ key, title }) => {
    const groupHabits = habits.filter((h) => (h.group || "am") === key);
    const subsection = buildCustomizeSection(title, groupHabits, "name", removeHabit, buildAddConfigForm({
      labelText: `Add to ${title}`,
      placeholder: "Habit name...",
      getEmoji: () => selectedHabitEmoji,
      setEmoji: (emoji) => { selectedHabitEmoji = emoji; },
      onAdd: (name) => addHabit(name, selectedHabitEmoji, key),
      validate: (name, emoji) => validateHabitFields(name, emoji, habits),
    }), toggleHabit);
    subsection.classList.add("customize-subsection");
    body.append(subsection);
  });

  details.append(body);
  return details;
}

// One collapsible customize section, such as Habits or Activities.
function buildCustomizeSection(title, items, labelField, onRemove, addForm, onToggle = null) {
  const details = document.createElement("details");
  details.className = "customize-section";
  details.open = openCustomizeSections.has(title);
  details.addEventListener("toggle", () => {
    if (details.open) {
      openCustomizeSections.add(title);
    } else {
      openCustomizeSections.delete(title);
    }
  });

  const summary = document.createElement("summary");
  summary.className = "customize-summary";

  const titleEl = document.createElement("span");
  titleEl.textContent = title;

  const count = document.createElement("span");
  count.className = "customize-count";
  if (onToggle) {
    const activeCount = items.filter((i) => !i.disabled).length;
    count.textContent = `${activeCount} / ${items.length}`;
  } else {
    count.textContent = String(items.length);
  }

  summary.append(titleEl, count);
  details.append(summary);

  const body = document.createElement("div");
  body.className = "customize-section-body";

  const list = document.createElement("div");
  list.className = "customize-list";

  if (items.length === 0) {
    list.append(createEmptyState(`No ${title.toLowerCase()} yet.`));
  } else {
    items.forEach((item) => {
      list.append(buildConfigRow(item, labelField, onRemove, onToggle));
    });
  }

  body.append(list, addForm);
  details.append(body);
  return details;
}

// ---- Habit drag-and-drop ----

let dragSourceId = null;

function handleHabitDragStart(e) {
  dragSourceId = e.currentTarget.dataset.habitId;
  e.dataTransfer.effectAllowed = "move";
  setTimeout(() => e.currentTarget.classList.add("dragging"), 0);
}

function handleHabitDragOver(e) {
  if (!dragSourceId) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  document.querySelectorAll(".edit-habit-row.drag-over").forEach((el) => el.classList.remove("drag-over"));
  if (e.currentTarget.dataset.habitId !== dragSourceId) {
    e.currentTarget.classList.add("drag-over");
  }
}

function handleHabitDrop(e) {
  e.preventDefault();
  const targetId = e.currentTarget.dataset.habitId;
  const targetGroup = e.currentTarget.dataset.habitGroup;
  if (!dragSourceId || dragSourceId === targetId) return;

  const sourceIndex = habits.findIndex((h) => h.id === dragSourceId);
  const targetIndex = habits.findIndex((h) => h.id === targetId);
  if (sourceIndex === -1 || targetIndex === -1) return;

  // Moving to a different section updates the habit's group so it stays there.
  const sourceHabit = habits[sourceIndex];
  if (targetGroup && sourceHabit.group !== targetGroup) {
    sourceHabit.group = targetGroup;
  }

  const [moved] = habits.splice(sourceIndex, 1);
  habits.splice(targetIndex, 0, moved);

  saveHabitsConfig();
  dragSourceId = null;
  renderAll();
}

function handleHabitDragEnd(e) {
  e.currentTarget.classList.remove("dragging");
  document.querySelectorAll(".edit-habit-row.drag-over").forEach((el) => el.classList.remove("drag-over"));
  dragSourceId = null;
}

// A single row inside a customize section.
function buildConfigRow(item, labelField, onRemove, onToggle = null) {
  const row = document.createElement("div");
  row.className = "edit-habit-row";
  if (item.disabled) row.classList.add("is-disabled");

  const emojiEl = document.createElement("span");
  emojiEl.className = "edit-habit-emoji";
  emojiEl.setAttribute("aria-hidden", "true");
  emojiEl.textContent = item.emoji;

  const nameEl = document.createElement("span");
  nameEl.className = "edit-habit-name";
  nameEl.textContent = item[labelField];

  const delBtn = document.createElement("button");
  delBtn.className = "delete-habit-button";
  delBtn.type = "button";
  delBtn.setAttribute("aria-label", `Remove ${item[labelField]}`);
  delBtn.textContent = "x";
  delBtn.addEventListener("click", () => onRemove(item.id));

  if (onToggle) {
    const handle = document.createElement("span");
    handle.className = "drag-handle";
    handle.setAttribute("aria-hidden", "true");
    handle.textContent = "⠿";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "toggle-habit-button";
    toggleBtn.type = "button";
    toggleBtn.textContent = item.disabled ? "Show" : "Hide";
    toggleBtn.setAttribute("aria-label", `${item.disabled ? "Show" : "Hide"} ${item[labelField]}`);
    toggleBtn.addEventListener("click", () => onToggle(item.id));

    row.draggable = true;
    row.dataset.habitId = item.id;
    row.dataset.habitGroup = item.group || "am";
    row.addEventListener("dragstart", handleHabitDragStart);
    row.addEventListener("dragover", handleHabitDragOver);
    row.addEventListener("drop", handleHabitDrop);
    row.addEventListener("dragend", handleHabitDragEnd);

    row.append(handle, emojiEl, nameEl, toggleBtn, delBtn);
  } else {
    row.append(emojiEl, nameEl, delBtn);
  }

  return row;
}

// Reusable add form for habits, activities, emotions, and moods.
function buildAddConfigForm({ labelText, placeholder, getEmoji, setEmoji, onAdd, getScore, setScore, validate }) {
  const card = document.createElement("form");
  card.className = "add-habit-card";

  const label = document.createElement("p");
  label.className = "add-habit-section-label";
  label.textContent = labelText;

  const picker = buildEmojiPicker(getEmoji, setEmoji);

  const inputRow = document.createElement("div");
  inputRow.className = "add-habit-inputs";

  const input = document.createElement("input");
  input.className = "habit-name-input";
  input.type = "text";
  input.placeholder = placeholder;
  input.maxLength = 40;

  const addBtn = document.createElement("button");
  addBtn.className = "add-habit-confirm";
  addBtn.type = "submit";
  addBtn.textContent = "+";
  addBtn.disabled = true;

  const errorEl = document.createElement("p");
  errorEl.className = "field-error";
  errorEl.setAttribute("aria-live", "polite");
  errorEl.hidden = true;

  input.addEventListener("input", () => {
    addBtn.disabled = input.value.trim().length === 0;
    errorEl.hidden = true;
  });

  inputRow.append(input, addBtn);
  card.append(label, picker);

  if (getScore && setScore) {
    card.append(buildMoodScorePicker(getScore, setScore));
  }

  card.append(inputRow, errorEl);

  card.addEventListener("submit", (event) => {
    event.preventDefault();

    if (validate) {
      const score = getScore ? getScore() : undefined;
      const error = validate(input.value, getEmoji(), score);
      if (error) {
        errorEl.textContent = error;
        errorEl.hidden = false;
        input.focus();
        return;
      }
    }

    errorEl.hidden = true;
    onAdd(input.value);
    input.value = "";
    addBtn.disabled = true;
  });

  return card;
}

// Horizontal emoji picker used by the customize forms.
function buildEmojiPicker(getEmoji, setEmoji) {
  const picker = document.createElement("div");
  picker.className = "emoji-picker";

  EMOJI_OPTIONS.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.className = "emoji-option";
    btn.type = "button";
    btn.textContent = emoji;
    btn.setAttribute("aria-label", `Use ${emoji}`);
    btn.classList.toggle("selected", emoji === getEmoji());

    // Clicking an emoji updates only the temporary customize form state.
    btn.addEventListener("click", () => {
      setEmoji(emoji);
      picker.querySelectorAll(".emoji-option").forEach((option) => {
        option.classList.toggle("selected", option.textContent === getEmoji());
      });
    });

    picker.append(btn);
  });

  return picker;
}

// Numeric mood score picker used only when creating custom moods.
function buildMoodScorePicker(getScore, setScore) {
  const wrapper = document.createElement("div");
  wrapper.className = "mood-score-picker";
  wrapper.setAttribute("role", "group");
  wrapper.setAttribute("aria-label", "Mood score");

  [1, 2, 3, 4, 5].forEach((score) => {
    const button = document.createElement("button");
    button.className = "score-option";
    button.type = "button";
    button.textContent = String(score);
    button.classList.toggle("selected", score === getScore());
    button.addEventListener("click", () => {
      setScore(score);
      wrapper.querySelectorAll(".score-option").forEach((option) => {
        option.classList.toggle("selected", Number(option.textContent) === getScore());
      });
    });
    wrapper.append(button);
  });

  return wrapper;
}

// Small admin/testing area for loading demo data or wiping all storage.
function buildDataSection() {
  const details = document.createElement("details");
  details.className = "customize-section";

  const summary = document.createElement("summary");
  summary.className = "customize-summary";

  const title = document.createElement("span");
  title.textContent = "Data";

  const count = document.createElement("span");
  count.className = "customize-count";
  count.textContent = "backup";

  summary.append(title, count);

  const body = document.createElement("div");
  body.className = "customize-section-body";

  const card = document.createElement("div");
  card.className = "test-tools-card";

  const exportBtn = document.createElement("button");
  exportBtn.className = "test-tool-button";
  exportBtn.type = "button";
  exportBtn.textContent = "Download Backup";
  exportBtn.addEventListener("click", downloadBackupFile);

  card.append(exportBtn);
  body.append(card);
  details.append(summary, body);
  return details;
}

// Create and download a JSON backup of all app-owned data.
function downloadBackupFile() {
  const payload = buildBackupPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `tobster-tracker-backup-${todayKey}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Small admin/testing area for loading demo data or wiping all storage.
function buildTestingSection() {
  const details = document.createElement("details");
  details.className = "customize-section";

  const summary = document.createElement("summary");
  summary.className = "customize-summary";

  const title = document.createElement("span");
  title.textContent = "Testing";

  const count = document.createElement("span");
  count.className = "customize-count";
  count.textContent = "tools";

  summary.append(title, count);

  const body = document.createElement("div");
  body.className = "customize-section-body";

  const card = document.createElement("div");
  card.className = "test-tools-card";

  const seedBtn = document.createElement("button");
  seedBtn.className = "test-tool-button";
  seedBtn.type = "button";
  seedBtn.textContent = "Load Sample Data";
  seedBtn.addEventListener("click", () => {
    if (!window.TobsterTestData) return;
    if (!window.confirm("Replace current app data with sample testing data?")) return;
    window.TobsterTestData.seed();
    window.location.reload();
  });

  const wipeBtn = document.createElement("button");
  wipeBtn.className = "test-tool-button danger";
  wipeBtn.type = "button";
  wipeBtn.textContent = "Wipe All Data";
  wipeBtn.addEventListener("click", () => {
    if (!window.TobsterTestData) return;
    if (!window.confirm("Delete all app data and return to the base app?")) return;
    window.TobsterTestData.wipe();
    window.location.reload();
  });

  card.append(seedBtn, wipeBtn);
  body.append(card);
  details.append(summary, body);
  return details;
}

// Toggle a habit's visible/hidden state without deleting it.
function toggleHabit(id) {
  const habit = habits.find((h) => h.id === id);
  if (!habit) return;
  habit.disabled = !habit.disabled;
  saveHabitsConfig();
  initFlowStep();
  renderAll();
}

// Add a brand new habit to the config list.
function addHabit(name, emoji, group = "am") {
  habits.push(createHabitModel(name, emoji, group));
  saveHabitsConfig();
  initFlowStep();
  renderAll();
}

// Remove a habit from config and from the current day's answers.
function removeHabit(id) {
  const index = habits.findIndex((h) => h.id === id);
  if (index === -1) return;
  habits.splice(index, 1);
  const hadAnswer = Boolean(viewEntry.answers[id]);
  delete viewEntry.answers[id];
  saveHabitsConfig();
  if (hadAnswer) saveView();
  initFlowStep();
  renderAll();
}

// Remove an activity from config and from the current day's selections.
function removeActivity(id) {
  const index = activities.findIndex((activity) => activity.id === id);
  if (index === -1) return;
  activities.splice(index, 1);
  const hadActivity = Boolean(viewEntry.activities[id]);
  delete viewEntry.activities[id];
  saveActivitiesConfig();
  if (hadActivity) saveView();
  renderAll();
}

// Remove an emotion from config and from the current day's selections.
function removeEmotion(id) {
  const index = emotions.findIndex((emotion) => emotion.id === id);
  if (index === -1) return;
  emotions.splice(index, 1);
  const hadEmotion = Boolean(viewEntry.emotions[id]);
  delete viewEntry.emotions[id];
  saveEmotionsConfig();
  if (hadEmotion) saveView();
  renderAll();
}

// Remove a mood from config and clear it from the current day if needed.
function removeMood(id) {
  const index = moods.findIndex((mood) => mood.id === id);
  if (index === -1) return;
  moods.splice(index, 1);
  const hadMood = viewEntry.mood === id;
  if (hadMood) viewEntry.mood = null;
  saveMoodsConfig();
  if (hadMood) saveView();
  renderAll();
}
