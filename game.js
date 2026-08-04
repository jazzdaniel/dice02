const dice = document.querySelector("#dice");
const gameTable = document.querySelector(".game-table");
const rollButton = document.querySelector("#roll-button");
const scoreButton = document.querySelector("#score-button");
const rollLabel = document.querySelector("#roll-label");
const roundValue = document.querySelector("#round-value");
const targetValue = document.querySelector("#target-value");
const progressTarget = document.querySelector("#progress-target");
const triesValue = document.querySelector("#tries-value");
const scoresValue = document.querySelector("#scores-value");
const scoreValue = document.querySelector("#score-value");
const progressValue = document.querySelector("#progress-value");
const targetPlaque = document.querySelector(".target-plaque");
const triesPlaque = document.querySelector(".tries-plaque");
const scorePlaque = document.querySelector(".score-plaque");
const lossOverlay = document.querySelector("#loss-overlay");
const roundOverlay = document.querySelector("#round-overlay");
const roundMessage = document.querySelector("#round-message");
const victoryOverlay = document.querySelector("#victory-overlay");
const jokerArea = document.querySelector("#joker-area");
const jokerCard = document.querySelector("#joker-card");
const jokerSpeech = document.querySelector("#joker-speech");
const jokerLine = document.querySelector("#joker-line");
const tableCards = [...document.querySelectorAll(".table-card")];
const tryMarkers = [...document.querySelectorAll(".try-marker")];
const scoreMarkers = [...document.querySelectorAll(".score-marker")];

const balance = window.DICE_GAME_BALANCE;

if (!balance?.rounds?.length) {
  throw new Error("Missing round configuration in balance.js");
}

const landingAngles = {
  1: { x: -90, y: 0, z: 0 },
  2: { x: 0, y: 0, z: 0 },
  3: { x: 0, y: -90, z: 0 },
  4: { x: 0, y: 90, z: 0 },
  5: { x: 0, y: 180, z: 0 },
  6: { x: 90, y: 0, z: 0 },
};

const faceValues = {
  1: 1,
  2: 1,
  3: 1,
  4: 1,
  5: 1,
  6: 6,
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let rolling = false;
let revolutions = { x: 0, y: 0, z: 0 };
let roundIndex = 0;
let activeRound = balance.rounds[roundIndex];
let triesRemaining = activeRound.tries;
let scoresRemaining = activeRound.scores;
let roundSum = 0;
let displayedSum = 0;
let currentResult = null;
let countingScore = false;
let transitioningRound = false;
let losing = false;
let celebratingVictory = false;
let pendingJokerRemark = null;
let introState = "waiting";
let introLineIndex = -1;
let introComplete = false;
let consecutiveOnes = 0;
let jokerRemarkTimer = null;
let introNudgeTimer = null;
const lastJokerRemarks = {};

function getJokerRemark(state) {
  const options = balance.jokerRemarks[state];
  const available = options.filter((line) => line !== lastJokerRemarks[state]);
  const choices = available.length > 0 ? available : options;
  const line = choices[Math.floor(Math.random() * choices.length)];
  lastJokerRemarks[state] = line;
  return line;
}

function setJokerRevealed(revealed) {
  jokerCard.classList.toggle("is-revealed", revealed);
  jokerCard.setAttribute("aria-label", revealed ? "Turn Joker face down" : "Reveal Joker guide");
}

function showJokerLine(message, timed = false, revealJoker = true) {
  window.clearTimeout(jokerRemarkTimer);
  if (introComplete && revealJoker) {
    setJokerRevealed(true);
  }
  jokerLine.textContent = message;
  jokerSpeech.classList.remove("is-visible");
  void jokerSpeech.offsetWidth;
  jokerSpeech.classList.add("is-visible");
  jokerSpeech.setAttribute("aria-hidden", "false");

  if (timed) {
    jokerRemarkTimer = window.setTimeout(hideJokerLine, balance.jokerRemarkDuration);
  }
}

function showJokerRemark(state, timed = true, revealJoker = true) {
  showJokerLine(getJokerRemark(state), timed, revealJoker);
}

function hideJokerLine() {
  window.clearTimeout(jokerRemarkTimer);
  jokerSpeech.classList.remove("is-visible");
  jokerSpeech.setAttribute("aria-hidden", "true");
}

function beginIntro() {
  introState = "waiting";
  introLineIndex = -1;
  introComplete = false;
  transitioningRound = true;
  dice.classList.add("is-idle-spinning");
  jokerCard.classList.add("is-awaiting");
  jokerCard.classList.remove("is-revealed");
  jokerCard.setAttribute("aria-label", "Reveal the trembling card");
  window.clearTimeout(introNudgeTimer);
  introNudgeTimer = window.setTimeout(() => {
    if (introState === "waiting") {
      showJokerRemark("introNudge", false, false);
    }
  }, balance.introNudgeDelay);
  renderState();
}

function advanceIntro() {
  if (introComplete) return;

  if (introState === "waiting") {
    window.clearTimeout(introNudgeTimer);
    introState = "dialogue";
    jokerCard.classList.remove("is-awaiting");
    jokerCard.classList.add("is-revealed");
    jokerCard.setAttribute("aria-label", "Advance Joker dialogue");
    introLineIndex = 0;
    showJokerLine(balance.introDialogue[introLineIndex]);
    return;
  }

  if (introLineIndex < balance.introDialogue.length - 1) {
    introLineIndex += 1;
    showJokerLine(balance.introDialogue[introLineIndex]);
    return;
  }

  introState = "complete";
  introComplete = true;
  hideJokerLine();
  dice.classList.remove("is-idle-spinning");
  dice.style.setProperty("--rot-x", "-90deg");
  dice.style.setProperty("--rot-y", "0deg");
  dice.style.setProperty("--rot-z", "0deg");
  jokerCard.setAttribute("aria-label", "Joker guide");
  startRound(0);
}

function handleJokerClick() {
  if (celebratingVictory) return;

  if (!introComplete) {
    advanceIntro();
    return;
  }

  if (jokerCard.classList.contains("is-revealed")) {
    setJokerRevealed(false);
    showJokerRemark("dismissed", true, false);
  } else {
    setJokerRevealed(true);
    showJokerRemark("returned", true, false);
  }
}

function revealEmptyCard(card) {
  if (!introComplete) return;
  const revealed = card.classList.toggle("is-revealed");
  card.setAttribute("aria-label", revealed ? "Turn empty card face down" : "Reveal empty card");
}

function triggerTremble(plaque) {
  plaque.classList.remove("is-trembling");
  void plaque.offsetWidth;
  plaque.classList.add("is-trembling");
}

function blinkConsumedMarker(markers, remaining) {
  const marker = markers[remaining];
  if (!marker) return;

  marker.classList.add("is-consuming");
  window.setTimeout(() => {
    marker.classList.remove("is-consuming");
    renderState();
  }, 800);
}

function renderState() {
  roundValue.textContent = roundIndex + 1;
  targetValue.textContent = activeRound.target;
  progressTarget.textContent = activeRound.target;
  triesValue.textContent = triesRemaining;
  scoresValue.textContent = scoresRemaining;
  scoreValue.textContent = displayedSum;
  progressValue.textContent = displayedSum;

  tryMarkers.forEach((marker, index) => {
    marker.hidden = index >= activeRound.tries;
    marker.classList.toggle("is-spent", index >= triesRemaining && !marker.classList.contains("is-consuming"));
  });

  scoreMarkers.forEach((marker, index) => {
    marker.hidden = index >= activeRound.scores;
    marker.classList.toggle("is-spent", index >= scoresRemaining && !marker.classList.contains("is-consuming"));
  });

  const roundComplete = roundSum >= activeRound.target;
  const campaignComplete = roundComplete && roundIndex === balance.rounds.length - 1;
  targetPlaque.classList.toggle("is-complete", displayedSum >= activeRound.target);
  rollLabel.textContent = campaignComplete ? "Complete" : currentResult === null ? "Roll" : "Roll again";
  rollButton.disabled = rolling || countingScore || transitioningRound || losing || celebratingVictory || triesRemaining === 0 || scoresRemaining === 0 || roundComplete;
  scoreButton.disabled = rolling || countingScore || transitioningRound || losing || celebratingVictory || currentResult === null || scoresRemaining === 0 || roundComplete;
}

function startRound(nextRoundIndex) {
  roundIndex = nextRoundIndex;
  activeRound = balance.rounds[roundIndex];
  triesRemaining = activeRound.tries;
  scoresRemaining = activeRound.scores;
  roundSum = 0;
  displayedSum = 0;
  currentResult = null;
  consecutiveOnes = 0;
  countingScore = false;
  transitioningRound = false;
  losing = false;
  celebratingVictory = false;
  [...tryMarkers, ...scoreMarkers].forEach((marker) => marker.classList.remove("is-consuming", "is-spent"));
  lossOverlay.classList.remove("is-visible");
  lossOverlay.setAttribute("aria-hidden", "true");
  targetPlaque.classList.remove("is-complete");
  victoryOverlay.classList.remove("is-visible");
  victoryOverlay.setAttribute("aria-hidden", "true");
  gameTable.classList.remove("is-victory-trembling");
  hideJokerLine();
  showRoundIntro();
}

function showRoundIntro() {
  transitioningRound = true;
  roundMessage.textContent = `Round ${roundIndex + 1}`;
  roundOverlay.classList.remove("is-visible");
  void roundOverlay.offsetWidth;
  roundOverlay.classList.add("is-visible");
  roundOverlay.setAttribute("aria-hidden", "false");
  renderState();

  window.setTimeout(() => {
    roundOverlay.classList.remove("is-visible");
    roundOverlay.setAttribute("aria-hidden", "true");
    transitioningRound = false;
    renderState();
    if (pendingJokerRemark) {
      showJokerRemark(pendingJokerRemark);
      pendingJokerRemark = null;
    } else if (roundIndex === balance.rounds.length - 1) {
      showJokerRemark("lastRound");
    }
  }, balance.roundIntroDuration);
}

function showVictory() {
  if (celebratingVictory) return;

  celebratingVictory = true;
  transitioningRound = true;
  showJokerRemark("finalWin", false);
  gameTable.classList.add("is-victory-trembling");
  renderState();

  window.setTimeout(() => {
    gameTable.classList.remove("is-victory-trembling");
    hideJokerLine();
    victoryOverlay.classList.remove("is-visible");
    void victoryOverlay.offsetWidth;
    victoryOverlay.classList.add("is-visible");
    victoryOverlay.setAttribute("aria-hidden", "false");

    window.setTimeout(() => {
      victoryOverlay.classList.remove("is-visible");
      victoryOverlay.setAttribute("aria-hidden", "true");
      pendingJokerRemark = "returningPlayer";
      startRound(0);
    }, balance.victoryOverlayDuration);
  }, balance.victoryTrembleDuration);
}

function showLoss() {
  if (losing) return;

  losing = true;
  transitioningRound = true;
  currentResult = null;
  lossOverlay.classList.remove("is-visible");
  void lossOverlay.offsetWidth;
  lossOverlay.classList.add("is-visible");
  lossOverlay.setAttribute("aria-hidden", "false");
  jokerArea.classList.add("is-over-overlay");
  showJokerRemark("runLoss");
  renderState();

  window.setTimeout(() => {
    lossOverlay.classList.remove("is-visible");
    lossOverlay.setAttribute("aria-hidden", "true");
    jokerArea.classList.remove("is-over-overlay");
    hideJokerLine();
    startRound(0);
  }, balance.lossDuration);
}

function resolveRoundState() {
  if (transitioningRound) return;

  if (roundSum >= activeRound.target) {
    if (roundIndex === balance.rounds.length - 1) {
      showVictory();
      return;
    }

    showJokerRemark("roundWin");
    transitioningRound = true;
    renderState();
    window.setTimeout(() => startRound(roundIndex + 1), balance.roundAdvanceDelay);
    return;
  }

  const noScoringOpportunities = scoresRemaining === 0;
  const noRollsAndNoPendingScore = triesRemaining === 0 && currentResult === null;
  if (noScoringOpportunities || noRollsAndNoPendingScore) {
    showLoss();
  }
}

function rollDie() {
  if (rolling || countingScore || transitioningRound || triesRemaining === 0 || scoresRemaining === 0 || roundSum >= activeRound.target) return;

  rolling = true;
  const landedFace = Math.floor(Math.random() * 6) + 1;
  const result = faceValues[landedFace];
  triesRemaining -= 1;
  blinkConsumedMarker(tryMarkers, triesRemaining);
  currentResult = null;
  triggerTremble(triesPlaque);
  renderState();
  const landing = landingAngles[landedFace];
  const extraTurns = reducedMotion.matches ? 1 : 2;

  revolutions = {
    x: revolutions.x + extraTurns + Math.floor(Math.random() * 2),
    y: revolutions.y + extraTurns + Math.floor(Math.random() * 2),
    z: revolutions.z + extraTurns + Math.floor(Math.random() * 2),
  };

  dice.classList.remove("is-rolling");
  void dice.offsetWidth;
  dice.classList.add("is-rolling");
  dice.style.setProperty("--rot-x", `${landing.x + revolutions.x * 360}deg`);
  dice.style.setProperty("--rot-y", `${landing.y + revolutions.y * 360}deg`);
  dice.style.setProperty("--rot-z", `${landing.z + revolutions.z * 360}deg`);
  dice.setAttribute("aria-label", `Die rolling, result ${result}`);

  const duration = reducedMotion.matches ? balance.reducedRollDuration : balance.rollDuration;
  window.setTimeout(() => {
    dice.classList.remove("is-rolling");
    dice.setAttribute("aria-label", `Die showing ${result} on top`);
    currentResult = result;
    rolling = false;
    if (result === 6) {
      consecutiveOnes = 0;
      showJokerRemark("rareSix");
    } else {
      consecutiveOnes += 1;
      if (consecutiveOnes >= 2) {
        showJokerRemark("repeatedOne");
      }
    }
    renderState();
    resolveRoundState();
  }, duration);
}

function scoreRoll() {
  if (rolling || countingScore || transitioningRound || currentResult === null || scoresRemaining === 0 || roundSum >= activeRound.target) return;
  const pointsToAdd = currentResult;
  roundSum += currentResult;
  scoresRemaining -= 1;
  blinkConsumedMarker(scoreMarkers, scoresRemaining);
  currentResult = null;
  countingScore = true;
  triggerTremble(scorePlaque);
  renderState();

  const countTimer = window.setInterval(() => {
    displayedSum += 1;
    renderState();

    if (displayedSum >= roundSum) {
      window.clearInterval(countTimer);
      countingScore = false;
      renderState();
      resolveRoundState();
    }
  }, reducedMotion.matches ? balance.reducedScoreCountStep : Math.max(65, balance.scoreCountDuration / pointsToAdd));
}

rollButton.addEventListener("click", rollDie);
scoreButton.addEventListener("click", scoreRoll);
jokerCard.addEventListener("click", handleJokerClick);
tableCards.forEach((card) => card.addEventListener("click", () => revealEmptyCard(card)));

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;

  const focusedCard = event.target.closest?.("#joker-card, .table-card");
  if (focusedCard && (event.code === "Enter" || event.code === "Space")) return;

  if (!introComplete && (event.code === "Enter" || event.code === "KeyR" || event.code === "KeyS")) {
    event.preventDefault();
    advanceIntro();
    return;
  }

  if (event.code === "Space" || event.code === "KeyR") {
    event.preventDefault();
    rollDie();
  }

  if (event.code === "Enter" || event.code === "KeyS") {
    event.preventDefault();
    scoreRoll();
  }
});

beginIntro();
