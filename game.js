const dice = document.querySelector("#dice");
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

function triggerTremble(plaque) {
  plaque.classList.remove("is-trembling");
  void plaque.offsetWidth;
  plaque.classList.add("is-trembling");
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
    marker.classList.toggle("is-spent", index >= triesRemaining);
  });

  scoreMarkers.forEach((marker, index) => {
    marker.hidden = index >= activeRound.scores;
    marker.classList.toggle("is-spent", index >= scoresRemaining);
  });

  const roundComplete = roundSum >= activeRound.target;
  const campaignComplete = roundComplete && roundIndex === balance.rounds.length - 1;
  targetPlaque.classList.toggle("is-complete", displayedSum >= activeRound.target);
  rollLabel.textContent = campaignComplete ? "Complete" : currentResult === null ? "Roll" : "Roll again";
  rollButton.disabled = rolling || countingScore || transitioningRound || triesRemaining === 0 || roundComplete;
  scoreButton.disabled = rolling || countingScore || transitioningRound || currentResult === null || scoresRemaining === 0 || roundComplete;
}

function startRound(nextRoundIndex) {
  roundIndex = nextRoundIndex;
  activeRound = balance.rounds[roundIndex];
  triesRemaining = activeRound.tries;
  scoresRemaining = activeRound.scores;
  roundSum = 0;
  displayedSum = 0;
  currentResult = null;
  countingScore = false;
  transitioningRound = false;
  targetPlaque.classList.remove("is-complete");
  renderState();
}

function resolveRoundState() {
  if (transitioningRound) return;

  if (roundSum >= activeRound.target) {
    if (roundIndex === balance.rounds.length - 1) {
      renderState();
      return;
    }

    transitioningRound = true;
    renderState();
    window.setTimeout(() => startRound(roundIndex + 1), balance.roundAdvanceDelay);
    return;
  }

  const noPlayableResult = currentResult === null || scoresRemaining === 0;
  if (triesRemaining === 0 && noPlayableResult) {
    transitioningRound = true;
    renderState();
    window.setTimeout(() => startRound(roundIndex), balance.roundRetryDelay);
  }
}

function rollDie() {
  if (rolling || countingScore || transitioningRound || triesRemaining === 0 || roundSum >= activeRound.target) return;

  rolling = true;
  const result = Math.floor(Math.random() * 6) + 1;
  triesRemaining -= 1;
  currentResult = null;
  triggerTremble(triesPlaque);
  renderState();
  const landing = landingAngles[result];
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
    renderState();
    resolveRoundState();
  }, duration);
}

function scoreRoll() {
  if (rolling || countingScore || transitioningRound || currentResult === null || scoresRemaining === 0 || roundSum >= activeRound.target) return;
  const pointsToAdd = currentResult;
  roundSum += currentResult;
  scoresRemaining -= 1;
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

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;

  if (event.code === "Space") {
    event.preventDefault();
    rollDie();
  }

  if (event.code === "Enter") {
    event.preventDefault();
    scoreRoll();
  }
});

renderState();
