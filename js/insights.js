// ---- Insights view ----
//
// This file builds the analytics side of the app. Nothing here talks directly to
// localStorage; instead it asks storage helpers for normalized data and then turns
// that data into DOM elements.

// Main Insights entry point called from renderAll().
function renderInsights() {
  const storedDays = getStoredDays();
  const storedByDate = new Map(storedDays.map((day) => [day.dateKey, day]));
  const periodDates = getPeriodDates();
  const periodEntries = buildPeriodEntries(periodDates, storedByDate);

  renderCheckinSection(periodDates, periodEntries, storedByDate);
  renderHabitSummary(periodDates, storedByDate, storedDays);
}

// Build the top check-ins panel for the selected week/month.
function renderCheckinSection(periodDates, periodEntries, storedByDate) {
  checkinPanel.innerHTML = "";

  const titleRow = document.createElement("div");
  titleRow.className = "checkin-title-row";

  const titleEl = document.createElement("h2");
  titleEl.id = "checkin-title";
  titleEl.className = "section-title";
  titleEl.textContent = "Check-ins";

  const selector = document.createElement("div");
  selector.className = "period-selector";
  selector.setAttribute("role", "group");
  selector.setAttribute("aria-label", "Period");

  ["week", "month"].forEach((period) => {
    const btn = document.createElement("button");
    btn.className = "period-btn";
    btn.type = "button";
    btn.textContent = period === "week" ? "Week" : "Month";
    btn.classList.toggle("active", period === insightsPeriod);
    btn.addEventListener("click", () => {
      if (insightsPeriod !== period) {
        insightsPeriod = period;
        insightsOffset = 0;
        resetInsightPages();
        renderInsights();
      }
    });
    selector.append(btn);
  });

  titleRow.append(titleEl, selector);
  checkinPanel.append(titleRow);

  const navRow = document.createElement("div");
  navRow.className = "insights-nav";

  const prevBtn = document.createElement("button");
  prevBtn.className = "insights-nav-arrow";
  prevBtn.type = "button";
  prevBtn.setAttribute("aria-label", "Previous period");
  prevBtn.textContent = "<";
  prevBtn.addEventListener("click", () => {
    insightsOffset -= 1;
    resetInsightPages();
    renderInsights();
  });

  const periodLabel = document.createElement("span");
  periodLabel.className = "insights-nav-label";
  periodLabel.textContent = getPeriodLabel();

  const nextBtn = document.createElement("button");
  nextBtn.className = "insights-nav-arrow";
  nextBtn.type = "button";
  nextBtn.setAttribute("aria-label", "Next period");
  nextBtn.textContent = ">";
  nextBtn.disabled = insightsOffset >= 0;
  nextBtn.addEventListener("click", () => {
    if (insightsOffset < 0) {
      insightsOffset += 1;
      resetInsightPages();
      renderInsights();
    }
  });

  navRow.append(prevBtn, periodLabel, nextBtn);
  checkinPanel.append(navRow);

  // Only days that actually have saved data count as check-ins.
  const checkedInDays = periodEntries.filter((entry) => entry.hasData);
  const checkedInEntries = checkedInDays.map((entry) => entry.day);

  const avgMood = average(
    checkedInEntries
      .map((entry) => getMood(entry.mood))
      .filter(Boolean)
      .map((mood) => mood.score)
  );
  const moodLabel = avgMood === null ? "--" : getMoodFromScore(avgMood).label;
  const moodDetail = avgMood === null ? "no data" : `${avgMood.toFixed(1)} / 5`;

  // Count yes/no answers across the selected period for the summary cards.
  let totalYes = 0;
  let totalNo = 0;
  checkedInEntries.forEach((entry) => {
    habits.forEach((habit) => {
      if (entry.answers[habit.id] === "yes") totalYes += 1;
      else if (entry.answers[habit.id] === "no") totalNo += 1;
    });
  });

  const statsGrid = document.createElement("div");
  statsGrid.className = "stats-grid";
  statsGrid.append(
    createStatCard("Checked In", String(checkedInDays.length), `of ${periodDates.length} days`),
    createStatCard("Avg Mood", moodLabel, moodDetail),
    createStatCard("Done", String(totalYes), `${totalNo} skipped`)
  );
  checkinPanel.append(statsGrid);
  checkinPanel.append(buildCalendar(periodDates, storedByDate));

  checkinPanel.append(buildInsightLinks(periodEntries));
}

// Convert a list of calendar dates into objects the Insights page can work with.
function buildPeriodEntries(periodDates, storedByDate) {
  return periodDates.map((date) => {
    const dateKey = formatDateKey(date);
    const stored = storedByDate.get(dateKey);

    return {
      date,
      dateKey,
      day: stored ? stored.entry : createEmptyEntry(),
      hasData: Boolean(stored),
    };
  });
}

// Build the "Habits this period" list with completion bars.
function buildPeriodTaskCounts(periodDates, storedByDate) {
  const section = document.createElement("div");
  section.className = "period-task-section";

  const title = document.createElement("h3");
  title.className = "period-task-title";
  title.textContent = "Habits this period";
  section.append(title);

  if (habits.length === 0) {
    section.append(createEmptyState("No habits to count yet."));
    return section;
  }

  const list = document.createElement("div");
  list.className = "period-task-list";

  habits.forEach((habit) => {
    const completed = periodDates.reduce((total, date) => {
      const stored = storedByDate.get(formatDateKey(date));
      return stored && stored.entry.answers[habit.id] === "yes" ? total + 1 : total;
    }, 0);
    const totalDays = periodDates.length;
    const rate = totalDays === 0 ? 0 : Math.round((completed / totalDays) * 100);

    const row = document.createElement("div");
    row.className = "period-task-row";

    const top = document.createElement("div");
    top.className = "trend-top";

    const name = document.createElement("div");
    name.className = "trend-name";
    name.textContent = `${habit.emoji} ${habit.name}`;

    const meta = document.createElement("div");
    meta.className = "trend-meta";
    meta.textContent = `${completed}/${totalDays}`;

    const bar = document.createElement("div");
    bar.className = "trend-bar";

    const fill = document.createElement("span");
    fill.className = "trend-fill";
    fill.style.width = `${rate}%`;

    top.append(name, meta);
    bar.append(fill);
    row.append(top, bar);
    list.append(row);
  });

  section.append(list);
  return section;
}

// Build the lower habit panel with tabs for current period vs long-term trends.
function renderHabitSummary(periodDates, storedByDate, storedDays) {
  habitSummaryPanel.innerHTML = "";

  const titleRow = document.createElement("div");
  titleRow.className = "checkin-title-row";

  const titleEl = document.createElement("h2");
  titleEl.id = "habit-summary-title";
  titleEl.className = "section-title";
  titleEl.textContent = "Habits";

  const tabs = document.createElement("div");
  tabs.className = "period-selector link-tabs";
  tabs.setAttribute("role", "group");
  tabs.setAttribute("aria-label", "Habit summary view");

  [
    { id: "period", label: "This Period" },
    { id: "trends", label: "Trends" },
  ].forEach((tab) => {
    const btn = document.createElement("button");
    btn.className = "period-btn";
    btn.type = "button";
    btn.textContent = tab.label;
    btn.classList.toggle("active", habitSummaryTab === tab.id);
    btn.addEventListener("click", () => {
      habitSummaryTab = tab.id;
      renderInsights();
    });
    tabs.append(btn);
  });

  titleRow.append(titleEl, tabs);
  habitSummaryPanel.append(titleRow);

  const note = document.createElement("p");
  note.className = "section-note";
  note.textContent =
    habitSummaryTab === "period"
      ? "Completed days in the selected time range"
      : "Completion rate and current streak";
  habitSummaryPanel.append(note);

  if (habitSummaryTab === "period") {
    habitSummaryPanel.append(buildPeriodTaskCounts(periodDates, storedByDate));
    return;
  }

  habitSummaryPanel.append(buildHabitTrendList(storedByDate, storedDays));
}

// Build the main Links panel and switch between Habit / Activity / Emotion views.
function buildInsightLinks(periodEntries) {
  const periodDays = periodEntries.map((entry) => entry.day);
  const panel = document.createElement("section");
  panel.className = "insight-link-card";

  const header = buildInsightHeader("Links", "Mood, activity, and emotion views for this period");
  const tabs = document.createElement("div");
  tabs.className = "period-selector link-tabs";
  tabs.setAttribute("role", "group");
  tabs.setAttribute("aria-label", "Insight link type");

  [
    { id: "mood", label: "Habit" },
    { id: "activity", label: "Activity" },
    { id: "emotion", label: "Emotion" },
  ].forEach((tab) => {
    const btn = document.createElement("button");
    btn.className = "period-btn";
    btn.type = "button";
    btn.textContent = tab.label;
    btn.classList.toggle("active", insightLinkTab === tab.id);
    btn.addEventListener("click", () => {
      insightLinkTab = tab.id;
      renderInsights();
    });
    tabs.append(btn);
  });

  const content = document.createElement("div");
  content.className = "insight-link-content";

  panel.append(header, tabs, content);

  if (insightLinkTab === "mood") {
    renderMoodLinkContent(periodDays, content);
  } else if (insightLinkTab === "activity") {
    renderActivityLinkContent(periodDays, content);
  } else {
    renderEmotionLinkContent(periodDays, content);
  }

  return panel;
}

// Shared title + note block used by several insights sub-sections.
function buildInsightHeader(titleText, noteText) {
  const heading = document.createElement("div");
  heading.className = "section-heading";

  const title = document.createElement("h3");
  title.className = "period-task-title";
  title.textContent = titleText;

  const note = document.createElement("p");
  note.className = "section-note";
  note.textContent = noteText;

  heading.append(title, note);
  return heading;
}

// Summary card showing the single most-selected emotion in the current period.
function buildMostUsedEmotion(periodDays) {
  const card = document.createElement("div");
  card.className = "emotion-summary";

  const counts = getEmotionCounts(periodDays);
  const topEmotion = counts.reduce((best, item) => {
    return item.count > best.count ? item : best;
  }, { count: 0, emotion: null });

  if (!topEmotion.emotion || topEmotion.count === 0) {
    card.append(createEmptyState("Add emotions for a few days to see a top emotion."));
    return card;
  }

  const emoji = document.createElement("div");
  emoji.className = "emotion-summary-emoji";
  emoji.textContent = topEmotion.emotion.emoji || CUSTOM_EMOTION_EMOJI;

  const name = document.createElement("p");
  name.className = "emotion-summary-name";
  name.textContent = topEmotion.emotion.name;

  const detail = document.createElement("p");
  detail.className = "emotion-summary-detail";
  detail.textContent = `${topEmotion.count}/${periodDays.length} days`;

  card.append(emoji, name, detail);
  return card;
}

// Bar list showing total emotion selection counts across the current period.
function buildEmotionTotals(periodDays) {
  const counts = getEmotionCounts(periodDays)
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const wrapper = document.createElement("div");
  wrapper.className = "insight-link-section";

  const list = document.createElement("div");
  list.className = "correlation-list";

  if (counts.length === 0) {
    wrapper.append(createEmptyState("No emotion data for this period yet."));
    return wrapper;
  }

  const rows = counts.map(({ emotion, count }) => {
    const row = document.createElement("div");
    row.className = "correlation-row";

    const top = document.createElement("div");
    top.className = "correlation-top";

    const name = document.createElement("div");
    name.className = "correlation-name";
    name.textContent = `${emotion.emoji || CUSTOM_EMOTION_EMOJI} ${emotion.name}`;

    const meta = document.createElement("div");
    meta.className = "correlation-meta";
    meta.textContent = `${count}/${periodDays.length}`;

    const bar = document.createElement("div");
    bar.className = "trend-bar";

    const fill = document.createElement("span");
    fill.className = "trend-fill";
    fill.style.width = `${Math.round((count / periodDays.length) * 100)}%`;

    top.append(name, meta);
    bar.append(fill);
    row.append(top, bar);
    return row;
  });

  paginateInsightList({
    key: "emotion",
    rows,
    list,
    parent: wrapper,
  });

  wrapper.prepend(list);
  return wrapper;
}

// Generic "most used item" summary card used for habits and activities too.
function buildMostUsedItemCard(item, count, totalDays, fallbackEmoji, emptyMessage) {
  const card = document.createElement("div");
  card.className = "emotion-summary";

  if (!item || count === 0) {
    card.append(createEmptyState(emptyMessage));
    return card;
  }

  const emoji = document.createElement("div");
  emoji.className = "emotion-summary-emoji";
  emoji.textContent = item.emoji || fallbackEmoji;

  const name = document.createElement("p");
  name.className = "emotion-summary-name";
  name.textContent = item.name;

  const detail = document.createElement("p");
  detail.className = "emotion-summary-detail";
  detail.textContent = `${count}/${totalDays} days`;

  card.append(emoji, name, detail);
  return card;
}

// Generic bar-list builder used by habit/activity total count views.
function buildCountTotals(items, getCount, totalDays, key, fallbackEmoji, emptyMessage) {
  const counts = items
    .map((item) => ({ item, count: getCount(item) }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);

  const wrapper = document.createElement("div");
  wrapper.className = "insight-link-section";

  const list = document.createElement("div");
  list.className = "correlation-list";

  if (counts.length === 0) {
    wrapper.append(createEmptyState(emptyMessage));
    return wrapper;
  }

  const rows = counts.map(({ item, count }) => {
    const row = document.createElement("div");
    row.className = "correlation-row";

    const top = document.createElement("div");
    top.className = "correlation-top";

    const name = document.createElement("div");
    name.className = "correlation-name";
    name.textContent = `${item.emoji || fallbackEmoji} ${item.name}`;

    const meta = document.createElement("div");
    meta.className = "correlation-meta";
    meta.textContent = `${count}/${totalDays}`;

    const bar = document.createElement("div");
    bar.className = "trend-bar";

    const fill = document.createElement("span");
    fill.className = "trend-fill";
    fill.style.width = `${totalDays === 0 ? 0 : Math.round((count / totalDays) * 100)}%`;

    top.append(name, meta);
    bar.append(fill);
    row.append(top, bar);
    return row;
  });

  paginateInsightList({
    key,
    rows,
    list,
    parent: wrapper,
  });

  wrapper.prepend(list);
  return wrapper;
}

// Most-used summary for habits answered "yes".
function buildMostUsedHabit(periodDays) {
  const counts = habits.map((habit) => ({
    item: habit,
    count: periodDays.reduce((total, day) => total + (day.answers[habit.id] === "yes" ? 1 : 0), 0),
  }));
  const top = counts.reduce((best, entry) => (entry.count > best.count ? entry : best), {
    item: null,
    count: 0,
  });
  return buildMostUsedItemCard(
    top.item,
    top.count,
    periodDays.length,
    "",
    "Answer a few habits to see the most-used one."
  );
}

// Total completion counts for each habit in the current period.
function buildHabitTotals(periodDays) {
  return buildCountTotals(
    habits,
    (habit) => periodDays.reduce((total, day) => total + (day.answers[habit.id] === "yes" ? 1 : 0), 0),
    periodDays.length,
    "mood",
    "",
    "No habit data for this period yet."
  );
}

// Most-used summary for activities.
function buildMostUsedActivity(periodDays) {
  const counts = activities.map((activity) => ({
    item: activity,
    count: periodDays.reduce((total, day) => total + (day.activities[activity.id] ? 1 : 0), 0),
  }));
  const top = counts.reduce((best, entry) => (entry.count > best.count ? entry : best), {
    item: null,
    count: 0,
  });
  return buildMostUsedItemCard(
    top.item,
    top.count,
    periodDays.length,
    CUSTOM_ACTIVITY_EMOJI,
    "Track a few activities to see the most-used one."
  );
}

// Total activity selection counts for the current period.
function buildActivityTotals(periodDays) {
  return buildCountTotals(
    activities,
    (activity) => periodDays.reduce((total, day) => total + (day.activities[activity.id] ? 1 : 0), 0),
    periodDays.length,
    "activity",
    CUSTOM_ACTIVITY_EMOJI,
    "No activity data for this period yet."
  );
}

// Habit insight tab:
// - Link = mood on yes vs no days
// - Most Used = most frequently completed habit
// - Totals = completion counts for each habit
function renderMoodLinkContent(periodDays, content) {
  const header = buildInsightHeader("Habit link", "Mood comparison and completion summary for this period");
  const controls = document.createElement("div");
  controls.className = "period-selector emotion-toggle";
  controls.setAttribute("role", "group");
  controls.setAttribute("aria-label", "Habit view");

  [
    { id: "link", label: "Link" },
    { id: "most-used", label: "Most Used" },
    { id: "totals", label: "Totals" },
  ].forEach((mode) => {
    const btn = document.createElement("button");
    btn.className = "period-btn";
    btn.type = "button";
    btn.textContent = mode.label;
    btn.classList.toggle("active", habitLinkMode === mode.id);
    btn.addEventListener("click", () => {
      habitLinkMode = mode.id;
      insightPages.mood = 0;
      renderInsights();
    });
    controls.append(btn);
  });

  content.append(header, controls);

  if (habitLinkMode === "most-used") {
    content.append(buildMostUsedHabit(periodDays));
    return;
  }

  if (habitLinkMode === "totals") {
    content.append(buildHabitTotals(periodDays));
    return;
  }

  const list = document.createElement("div");
  list.className = "correlation-list";

  const rows = habits.map((habit) => {
    const yesMoods = periodDays
      .filter((day) => day.answers[habit.id] === "yes")
      .map((day) => getMood(day.mood))
      .filter(Boolean)
      .map((mood) => mood.score);
    const noMoods = periodDays
      .filter((day) => day.answers[habit.id] === "no")
      .map((day) => getMood(day.mood))
      .filter(Boolean)
      .map((mood) => mood.score);

    const row = document.createElement("div");
    row.className = "correlation-row";

    const top = document.createElement("div");
    top.className = "correlation-top";

    const name = document.createElement("div");
    name.className = "correlation-name";
    name.textContent = `${habit.emoji} ${habit.name}`;

    const meta = document.createElement("div");
    meta.className = "correlation-meta";
    meta.textContent = getCorrelationLabel(average(yesMoods), average(noMoods));

    const values = document.createElement("div");
    values.className = "correlation-values";
    values.append(
      createCorrelationPill("Yes days", average(yesMoods), yesMoods.length),
      createCorrelationPill("No days", average(noMoods), noMoods.length)
    );

    top.append(name, meta);
    row.append(top, values);
    return row;
  });

  content.append(list);
  paginateInsightList({
    key: "mood",
    rows,
    list,
    parent: content,
    emptyMessage: "No habits available for mood comparison.",
  });
}

// Activity insight tab:
// - Link = mood on days activity happened vs did not happen
// - Most Used = most frequently selected activity
// - Totals = counts for each activity
function renderActivityLinkContent(periodDays, content) {
  const header = buildInsightHeader("Activity link", "Mood comparison and completion summary for this period");
  const controls = document.createElement("div");
  controls.className = "period-selector emotion-toggle";
  controls.setAttribute("role", "group");
  controls.setAttribute("aria-label", "Activity view");

  [
    { id: "link", label: "Link" },
    { id: "most-used", label: "Most Used" },
    { id: "totals", label: "Totals" },
  ].forEach((mode) => {
    const btn = document.createElement("button");
    btn.className = "period-btn";
    btn.type = "button";
    btn.textContent = mode.label;
    btn.classList.toggle("active", activityLinkMode === mode.id);
    btn.addEventListener("click", () => {
      activityLinkMode = mode.id;
      insightPages.activity = 0;
      renderInsights();
    });
    controls.append(btn);
  });

  content.append(header, controls);

  if (activityLinkMode === "most-used") {
    content.append(buildMostUsedActivity(periodDays));
    return;
  }

  if (activityLinkMode === "totals") {
    content.append(buildActivityTotals(periodDays));
    return;
  }

  const list = document.createElement("div");
  list.className = "correlation-list";

  const rows = activities.map((activity) => {
    const didMoods = periodDays
      .filter((day) => Boolean(day.activities[activity.id]))
      .map((day) => getMood(day.mood))
      .filter(Boolean)
      .map((mood) => mood.score);
    const skippedMoods = periodDays
      .filter((day) => !day.activities[activity.id])
      .map((day) => getMood(day.mood))
      .filter(Boolean)
      .map((mood) => mood.score);

    const row = document.createElement("div");
    row.className = "correlation-row";

    const top = document.createElement("div");
    top.className = "correlation-top";

    const name = document.createElement("div");
    name.className = "correlation-name";
    name.textContent = `${activity.emoji || CUSTOM_ACTIVITY_EMOJI} ${activity.name}`;

    const meta = document.createElement("div");
    meta.className = "correlation-meta";
    meta.textContent = getCorrelationLabel(average(didMoods), average(skippedMoods));

    const values = document.createElement("div");
    values.className = "correlation-values";
    values.append(
      createCorrelationPill("Did it", average(didMoods), didMoods.length),
      createCorrelationPill("Did not", average(skippedMoods), skippedMoods.length)
    );

    top.append(name, meta);
    row.append(top, values);
    return row;
  });

  content.append(list);
  paginateInsightList({
    key: "activity",
    rows,
    list,
    parent: content,
    emptyMessage: "No activities available for mood comparison.",
  });
}

// Emotion insight tab:
// - Link = mood on days an emotion was selected vs not selected
// - Most Used = most frequent emotion
// - Totals = counts for each emotion
function renderEmotionLinkContent(periodDays, content) {
  const header = buildInsightHeader("Emotion link", "Summary and mood correlation for this period");
  const controls = document.createElement("div");
  controls.className = "period-selector emotion-toggle";
  controls.setAttribute("role", "group");
  controls.setAttribute("aria-label", "Emotion view");

  [
    { id: "link", label: "Link" },
    { id: "most-used", label: "Most Used" },
    { id: "totals", label: "Totals" },
  ].forEach((mode) => {
    const btn = document.createElement("button");
    btn.className = "period-btn";
    btn.type = "button";
    btn.textContent = mode.label;
    btn.classList.toggle("active", emotionLinkMode === mode.id);
    btn.addEventListener("click", () => {
      emotionLinkMode = mode.id;
      insightPages.emotion = 0;
      renderInsights();
    });
    controls.append(btn);
  });

  content.append(header, controls);
  if (emotionLinkMode === "totals") {
    content.append(buildEmotionTotals(periodDays));
  } else if (emotionLinkMode === "link") {
    content.append(buildEmotionMoodLinks(periodDays));
  } else {
    content.append(buildMostUsedEmotion(periodDays));
  }
}

// Build the emotion correlation rows for the "Link" mode.
function buildEmotionMoodLinks(periodDays) {
  const wrapper = document.createElement("div");
  wrapper.className = "insight-link-section";

  const list = document.createElement("div");
  list.className = "correlation-list";
  wrapper.append(list);

  const rows = emotions.map((emotion) => {
    const feltMoods = periodDays
      .filter((day) => Boolean(day.emotions[emotion.id]))
      .map((day) => getMood(day.mood))
      .filter(Boolean)
      .map((mood) => mood.score);
    const notFeltMoods = periodDays
      .filter((day) => !day.emotions[emotion.id])
      .map((day) => getMood(day.mood))
      .filter(Boolean)
      .map((mood) => mood.score);

    const row = document.createElement("div");
    row.className = "correlation-row";

    const top = document.createElement("div");
    top.className = "correlation-top";

    const name = document.createElement("div");
    name.className = "correlation-name";
    name.textContent = `${emotion.emoji || CUSTOM_EMOTION_EMOJI} ${emotion.name}`;

    const meta = document.createElement("div");
    meta.className = "correlation-meta";
    meta.textContent = getCorrelationLabel(average(feltMoods), average(notFeltMoods));

    const values = document.createElement("div");
    values.className = "correlation-values";
    values.append(
      createCorrelationPill("Felt it", average(feltMoods), feltMoods.length),
      createCorrelationPill("Did not", average(notFeltMoods), notFeltMoods.length)
    );

    top.append(name, meta);
    row.append(top, values);
    return row;
  });

  paginateInsightList({
    key: "emotion",
    rows,
    list,
    parent: wrapper,
    emptyMessage: "No emotions available for mood comparison.",
  });

  return wrapper;
}

// Count how many days each emotion appears in the selected period.
function getEmotionCounts(periodDays) {
  return emotions.map((emotion) => {
    const count = periodDays.reduce((total, day) => {
      return day.emotions[emotion.id] ? total + 1 : total;
    }, 0);

    return { emotion, count };
  });
}

// Shared pagination helper for long insight lists.
function paginateInsightList({ key, rows, list, parent, emptyMessage }) {
  list.innerHTML = "";

  if (rows.length === 0) {
    if (emptyMessage) {
      list.append(createEmptyState(emptyMessage));
    }
    return;
  }

  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  insightPages[key] = Math.min(insightPages[key], totalPages - 1);
  insightPages[key] = Math.max(insightPages[key], 0);

  const start = insightPages[key] * pageSize;
  rows.slice(start, start + pageSize).forEach((row) => list.append(row));

  if (totalPages > 1) {
    const pager = buildInsightPager(key, totalPages);
    if (parent) {
      parent.append(pager);
    } else {
      list.after(pager);
    }
  }
}

// Build previous/next pager controls for a paged insight list.
function buildInsightPager(key, totalPages) {
  const nav = document.createElement("div");
  nav.className = "insight-pager";

  const prevBtn = document.createElement("button");
  prevBtn.className = "insight-pager-button";
  prevBtn.type = "button";
  prevBtn.textContent = "<";
  prevBtn.disabled = insightPages[key] <= 0;
  prevBtn.addEventListener("click", () => {
    if (insightPages[key] > 0) {
      insightPages[key] -= 1;
      renderInsights();
    }
  });

  const label = document.createElement("span");
  label.className = "insight-pager-label";
  label.textContent = `${insightPages[key] + 1}/${totalPages}`;

  const nextBtn = document.createElement("button");
  nextBtn.className = "insight-pager-button";
  nextBtn.type = "button";
  nextBtn.textContent = ">";
  nextBtn.disabled = insightPages[key] >= totalPages - 1;
  nextBtn.addEventListener("click", () => {
    if (insightPages[key] < totalPages - 1) {
      insightPages[key] += 1;
      renderInsights();
    }
  });

  nav.append(prevBtn, label, nextBtn);
  return nav;
}

// Reset page numbers when the user changes the selected period or tab context.
function resetInsightPages() {
  insightPages.mood = 0;
  insightPages.activity = 0;
  insightPages.emotion = 0;
}

// Generate the actual dates that belong to the selected week or month.
function getPeriodDates() {
  if (insightsPeriod === "week") {
    const dow = today.getDay();
    const offsetToMonday = dow === 0 ? -6 : 1 - dow;
    const monday = addDays(today, offsetToMonday + insightsOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }

  const baseDate = new Date(today.getFullYear(), today.getMonth() + insightsOffset, 1);
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
}

// Human-readable label for the currently selected week or month.
function getPeriodLabel() {
  if (insightsPeriod === "week") {
    const dow = today.getDay();
    const offsetToMonday = dow === 0 ? -6 : 1 - dow;
    const monday = addDays(today, offsetToMonday + insightsOffset * 7);
    const sunday = addDays(monday, 6);

    if (monday.getMonth() === sunday.getMonth()) {
      const start = monday.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return `${start} - ${sunday.getDate()}`;
    }

    return `${formatShortDate(monday)} - ${formatShortDate(sunday)}`;
  }

  const baseDate = new Date(today.getFullYear(), today.getMonth() + insightsOffset, 1);
  return baseDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

// Calendar grid used inside Check-ins.
function buildCalendar(periodDates, storedByDate) {
  const grid = document.createElement("div");
  grid.className = "checkin-calendar";
  grid.setAttribute("aria-label", `${insightsPeriod} check-in calendar`);

  DAY_NAMES.forEach((name) => {
    const hdr = document.createElement("div");
    hdr.className = "cal-header";
    hdr.setAttribute("aria-hidden", "true");
    hdr.textContent = name;
    grid.append(hdr);
  });

  if (insightsPeriod === "month") {
    const firstDow = periodDates[0].getDay();
    const leading = firstDow === 0 ? 6 : firstDow - 1;
    for (let i = 0; i < leading; i += 1) {
      const empty = document.createElement("div");
      empty.className = "cal-cell empty";
      empty.setAttribute("aria-hidden", "true");
      grid.append(empty);
    }
  }

  periodDates.forEach((date) => grid.append(buildCalCell(date, storedByDate)));
  return grid;
}

// One calendar cell for one date.
function buildCalCell(date, storedByDate) {
  const dateKey = formatDateKey(date);
  const stored = storedByDate.get(dateKey);
  const isFuture = dateKey > todayKey;
  const isToday = dateKey === todayKey;

  const cell = document.createElement("div");
  cell.className = "cal-cell";
  cell.setAttribute("title", formatShortDate(date));

  if (isFuture) {
    cell.classList.add("future");
  } else if (stored) {
    const status = getTimelineStatus(
      countEntryAnswers(stored.entry),
      countEntryCompleted(stored.entry)
    );
    if (status) {
      cell.classList.add(status);
    }
  }

  if (isToday) {
    cell.classList.add("today");
  }

  const dayNum = document.createElement("span");
  dayNum.className = "cal-day-num";
  dayNum.textContent = String(date.getDate());
  cell.append(dayNum);

  if (stored && stored.entry.mood) {
    const mood = getMood(stored.entry.mood);
    if (mood) {
      const moodEl = document.createElement("span");
      moodEl.className = "cal-mood";
      moodEl.setAttribute("aria-hidden", "true");
      moodEl.textContent = mood.emoji;
      cell.append(moodEl);
    }
  }

  return cell;
}

// Long-term habit trend list shown in the Habits -> Trends tab.
function buildHabitTrendList(storedByDate, storedDays) {
  const list = document.createElement("div");
  list.className = "trend-list";
  if (storedDays.length === 0) {
    list.append(createEmptyState("No habit history yet."));
    return list;
  }

  habits.forEach((habit) => {
    const answeredDays = storedDays.filter((day) => day.entry.answers[habit.id]);
    const yesCount = answeredDays.filter((day) => day.entry.answers[habit.id] === "yes").length;
    const rate = answeredDays.length === 0 ? 0 : Math.round((yesCount / answeredDays.length) * 100);
    const streak = getCurrentStreak(habit.id, storedByDate);

    const row = document.createElement("div");
    row.className = "trend-row";

    const top = document.createElement("div");
    top.className = "trend-top";

    const name = document.createElement("div");
    name.className = "trend-name";
    name.textContent = `${habit.emoji} ${habit.name}`;

    const meta = document.createElement("div");
    meta.className = "trend-meta";
    meta.textContent = `${streak} day streak`;

    const bar = document.createElement("div");
    bar.className = "trend-bar";

    const fill = document.createElement("span");
    fill.className = "trend-fill";
    fill.style.width = `${rate}%`;

    const detail = document.createElement("p");
    detail.className = "stat-detail";
    detail.textContent = `${rate}% completed (${yesCount}/${answeredDays.length || 0})`;

    top.append(name, meta);
    bar.append(fill);
    row.append(top, bar, detail);
    list.append(row);
  });

  return list;
}
