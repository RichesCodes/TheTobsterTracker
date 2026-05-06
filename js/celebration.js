// ---- Celebration flow ----
//
// This file owns the "Done logging for the day?" prompt and the playful success animation.

let celebrationTriggered = false;

// Auto-open the celebration prompt once the user has answered all habits and chosen a mood.
function checkCelebrationTrigger() {
  if (celebrationTriggered) return;

  const allAnswered = habits.length > 0 && habits.every((h) => viewEntry.answers[h.id]);
  const hasMood = !!viewEntry.mood;

  if (allAnswered && hasMood) {
    celebrationTriggered = true;
    showCelebrationPrompt();
  }
}

// Render the confirmation prompt inside the overlay.
function showCelebrationPrompt() {
  const overlay = document.getElementById("celebration-overlay");
  overlay.innerHTML = "";
  overlay.classList.remove("hidden");

  const card = document.createElement("div");
  card.className = "celebration-card";

  const question = document.createElement("p");
  question.className = "celebration-question";
  question.textContent = "Done logging for the day?";

  const btnRow = document.createElement("div");
  btnRow.className = "celebration-btn-row";

  // "Yes" transitions from the confirmation prompt into the animation state.
  const yesBtn = document.createElement("button");
  yesBtn.className = "celebration-yes-btn";
  yesBtn.type = "button";
  yesBtn.textContent = "Yes! 🎉";
  yesBtn.addEventListener("click", () => startCelebration(overlay));

  // "Not yet" shows a gentle nudge before closing.
  const noBtn = document.createElement("button");
  noBtn.className = "celebration-no-btn";
  noBtn.type = "button";
  noBtn.textContent = "Not yet";
  noBtn.addEventListener("click", () => startNagAnimation(overlay));

  btnRow.append(yesBtn, noBtn);
  card.append(question, btnRow);
  overlay.append(card);
}

// Show a nudge screen when the user says they're not done yet.
function startNagAnimation(overlay) {
  overlay.innerHTML = "";

  const nagImgWrapper = document.createElement("div");
  nagImgWrapper.className = "celebration-image-wrapper";

  const speechBubble = document.createElement("div");
  speechBubble.className = "celebration-bubble nag-bubble";
  speechBubble.textContent = "Whats taking you so long bitch?";

  const nagImg = document.createElement("img");
  nagImg.className = "celebration-image";
  nagImg.alt = "";
  nagImg.setAttribute("aria-hidden", "true");
  nagImg.onerror = () => {
    if (nagImg.src.endsWith(".png")) {
      nagImg.src = "img/celebration.jpg";
    } else {
      nagImgWrapper.remove();
    }
  };
  nagImg.src = "img/celebration.png";

  nagImgWrapper.append(speechBubble, nagImg);

  const closeBtn = document.createElement("button");
  closeBtn.className = "celebration-close-btn nag-close-btn";
  closeBtn.type = "button";
  closeBtn.textContent = "I'm a bad girl... 😔";
  closeBtn.addEventListener("click", () => {
    overlay.classList.add("hidden");
    celebrationTriggered = false;
  });

  overlay.append(nagImgWrapper, closeBtn);
}

// Replace the prompt with a lightweight animated celebration.
function startCelebration(overlay) {
  viewEntry.finished = true;
  saveView();
  renderAll();

  overlay.innerHTML = "";

  // Big staggered "NICE" letters.
  const niceRow = document.createElement("div");
  niceRow.className = "nice-row";

  "NICE".split("").forEach((letter, i) => {
    const span = document.createElement("span");
    span.className = "nice-letter";
    span.textContent = letter;
    span.style.animationDelay = `${i * 130}ms`;
    niceRow.append(span);
  });

  // Custom image with a speech bubble — drop celebration.png or celebration.jpg into img/.
  const celebImgWrapper = document.createElement("div");
  celebImgWrapper.className = "celebration-image-wrapper";

  const speechBubble = document.createElement("div");
  speechBubble.className = "celebration-bubble";
  speechBubble.textContent = "wow great job!";

  const celebImg = document.createElement("img");
  celebImg.className = "celebration-image";
  celebImg.alt = "";
  celebImg.setAttribute("aria-hidden", "true");
  celebImg.onerror = () => {
    if (celebImg.src.endsWith(".png")) {
      celebImg.src = "img/celebration.jpg";
    } else {
      celebImgWrapper.remove();
    }
  };
  celebImg.src = "img/celebration.png";

  celebImgWrapper.append(speechBubble, celebImg);

  // Thumbs up appears after the letters.
  const thumbsRow = document.createElement("div");
  thumbsRow.className = "nice-thumbs";
  thumbsRow.style.animationDelay = "650ms";
  thumbsRow.textContent = "👍👍";

  // A small goofy animation for extra feedback.
  const eagleContainer = document.createElement("div");
  eagleContainer.className = "eagle-container";

  const eagleGroup = document.createElement("div");
  eagleGroup.className = "eagle-group";

  const explosionEl = document.createElement("span");
  explosionEl.className = "explosion-emoji";
  explosionEl.textContent = "💥";

  const eagleEl = document.createElement("span");
  eagleEl.className = "eagle-emoji";
  eagleEl.textContent = "🦅";

  eagleGroup.append(explosionEl, eagleEl);
  eagleContainer.append(eagleGroup);

  // Final close button so the user can return to the app.
  const closeBtn = document.createElement("button");
  closeBtn.className = "celebration-close-btn";
  closeBtn.type = "button";
  closeBtn.textContent = "Keep it up! 💪";
  closeBtn.addEventListener("click", () => overlay.classList.add("hidden"));

  overlay.append(niceRow, celebImgWrapper, thumbsRow, eagleContainer, closeBtn);
}
