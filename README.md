# Tobster Tracker

A small habit tracking web app built with plain HTML, CSS, and vanilla JavaScript.

This project is intentionally framework-free. That makes it a good learning project because you can see the full flow:

1. HTML defines the page structure.
2. CSS styles the app.
3. JavaScript reads and writes data, builds UI sections, and updates the page when state changes.
4. `localStorage` keeps the user's data in the browser.

## What the app does

- Tracks daily habits with `Yes` / `No`
- Tracks one mood per day
- Tracks multiple activities per day
- Tracks multiple emotions per day
- Lets the user customize habits, activities, emotions, and moods
- Shows an Insights screen for week/month summaries and correlation views
- Stores everything locally in the browser

## How the app works at a high level

The app does not use a backend or database.

Instead, it stores data in the browser with `localStorage`.

There are two kinds of data:

1. Daily entries
2. Config lists

### 1. Daily entries

Each day is stored under a key like:

```text
habits:2026-05-05
```

That object looks roughly like this:

```json
{
  "answers": {
    "brush-teeth": "yes",
    "drink-water": "no"
  },
  "mood": "good",
  "activities": {
    "friends": true
  },
  "emotions": {
    "anxious": true
  },
  "updatedAt": "2026-05-05T18:32:00.000Z"
}
```

### 2. Config lists

These are the saved definitions for customizable items:

- `habits:config`
- `habits:activities-config`
- `habits:emotions-config`
- `habits:moods-config`

These keys store arrays of objects. For example, habits look like:

```json
[
  { "id": "brush-teeth", "name": "Brush Teeth", "emoji": "🪥" }
]
```

## File structure

```text
TheTobsterTracker/
  index.html
  style.css
  app.js
  README.md
  .nojekyll
  js/
    constants.js
    utils.js
    storage.js
    today.js
    insights.js
    celebration.js
    demo-data.js
```

## What each file is responsible for

### `index.html`

This is the single page the browser loads.

It contains:

- the header
- the Today / Insights navigation
- placeholder containers for sections that JavaScript fills in
- the script tags, in the correct order

Important idea: the page starts mostly empty in a few places, and JavaScript builds many of the cards and lists at runtime.

### `style.css`

This file controls layout, colors, spacing, card styles, buttons, animations, and dark mode appearance.

It is split into comment sections like:

- Header
- Segment control
- Habit cards
- Insights
- Customize
- Celebration overlay

### `app.js`

This is the startup and orchestration file.

It is responsible for:

- loading app state
- caching DOM elements
- wiring button click handlers
- switching between views
- updating the header
- calling `renderAll()` when something changes

If you want to understand how the whole app boots up, start here.

### `js/constants.js`

This file contains:

- localStorage key names
- default habits
- default activities
- default emotions
- default moods
- shared emoji options
- day names used by the calendar

Use this file whenever you want to change default content or shared constants.

### `js/utils.js`

This file contains shared helper functions.

Examples:

- formatting dates
- parsing stored keys
- creating empty day entries
- normalizing saved data
- computing averages
- finding current habit streaks
- building reusable UI pieces like stat cards

These helpers are intentionally generic so other files can reuse them.

### `js/storage.js`

This file handles reading and writing data to `localStorage`.

It is responsible for:

- loading one day
- saving the current day
- loading all stored days
- loading and saving config lists
- migrating some older saved data shapes
- generating ids for custom items

Important idea: other files should not need to know the exact storage format. They ask these helpers for normalized data instead.

### `js/today.js`

This file builds the interactive daily logging experience.

It is responsible for:

- the one-habit-at-a-time flow
- the mood selector
- the activity selector
- the emotion selector
- the customize panel
- add/remove behavior for custom habits, activities, emotions, and moods
- testing tools UI

If you want to understand how clicking buttons updates the day, this is the main file to study.

### `js/insights.js`

This file builds the analytics screen.

It is responsible for:

- week/month selection
- previous/next period navigation
- the calendar grid
- period summary stats
- the habit summary panel
- the tabbed correlation panels for habits, activities, and emotions
- pagination inside long insight lists

This is the most logic-heavy file in the app because it transforms raw saved entries into summaries.

### `js/celebration.js`

This file controls the finish-day prompt and animation.

It is responsible for:

- deciding when the app should ask "Done logging for the day?"
- showing the modal overlay
- rendering the celebration animation

### `js/demo-data.js`

This file exists only for development/testing.

It provides:

- `window.TobsterTestData.seed()`
- `window.TobsterTestData.wipe()`

Those are used by the Customize -> Testing section.

## Script loading order

The order in `index.html` matters because this app uses shared global functions and variables.

Current order:

1. `js/constants.js`
2. `js/utils.js`
3. `js/storage.js`
4. `js/today.js`
5. `js/insights.js`
6. `js/celebration.js`
7. `js/demo-data.js`
8. `app.js`

Why this matters:

- `app.js` uses functions from almost every other file
- `storage.js` uses constants and helpers loaded before it
- `today.js` and `insights.js` depend on shared globals defined in `app.js` at runtime

## The main render pattern

This app does not use React or another UI framework.

Instead, it uses a simple pattern:

1. User clicks something
2. JavaScript updates in-memory state
3. JavaScript saves to `localStorage` if needed
4. JavaScript calls `renderAll()`
5. Each section rebuilds its visible UI from current state

That pattern is very common in small vanilla JavaScript apps.

## How to read the code as a beginner

A good order is:

1. `index.html`
2. `app.js`
3. `js/today.js`
4. `js/storage.js`
5. `js/utils.js`
6. `js/insights.js`
7. `js/celebration.js`
8. `js/demo-data.js`

Read it with these questions in mind:

- Where does the data live?
- What happens when a button is clicked?
- Which functions redraw UI?
- Which functions only format data?
- Which functions actually save to storage?

## Running locally

Because this is a static app, there is no build step.

You can open it directly:

```powershell
cd C:\Users\seand\repos\TheTobsterTracker
start .\index.html
```

Or serve it locally:

```powershell
cd C:\Users\seand\repos\TheTobsterTracker
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Publishing online

This app is ready to publish as a static site.

There is no server code, build step, or API to deploy.

### Option 1: GitHub Pages

1. Create a GitHub repository.
2. Push this project to the repository.
3. Go to `Settings -> Pages`.
4. Under `Build and deployment`, choose:
   - `Source: Deploy from a branch`
   - `Branch: main`
   - `Folder: / (root)`
5. Save.
6. Wait for GitHub Pages to publish.

GitHub will give you a URL like:

```text
https://yourusername.github.io/your-repo-name/
```

Notes:

- The included `.nojekyll` file helps GitHub Pages serve the project as a plain static site.
- Because data uses `localStorage`, each browser keeps its own saved data.

### Option 2: Netlify

1. Create a Netlify account.
2. Choose `Add new site` -> `Deploy manually`.
3. Drag the whole project folder into Netlify, or connect the Git repository.
4. If connecting the repo:
   - Build command: leave blank
   - Publish directory: `.`

Netlify will host it immediately because it is already a static site.

### Option 3: Vercel

1. Import the Git repository into Vercel.
2. Use:
   - Framework preset: `Other`
   - Build command: blank
   - Output directory: `.`

## Important limitation when published

Because the app uses browser `localStorage`:

- data is tied to one browser on one device
- users do not share data across devices
- clearing browser storage will erase saved entries

If you later want accounts or syncing, the next step would be adding a backend or a cloud database.

## Beginner roadmap for future improvements

If you want to keep learning by expanding this project, good next steps are:

1. Convert the JavaScript files to ES modules
2. Add edit/rename support for habits and emotions
3. Add export/import of user data as JSON
4. Add tests for storage and analytics helpers
5. Add a backend for cross-device sync
