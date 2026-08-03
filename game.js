const dice = document.querySelector("#dice");
const rollButton = document.querySelector("#roll-button");
const scoreButton = document.querySelector("#score-button");
const rollLabel = document.querySelector("#roll-label");
const triesValue = document.querySelector("#tries-value");
const scoresValue = document.querySelector("#scores-value");
const scoreValue = document.querySelector("#score-value");
const progressValue = document.querySelector("#progress-value");
const targetPlaque = document.querySelector(".target-plaque");
const tryMarkers = [...document.querySelectorAll(".try-marker")];
const scoreMarkers = [...document.querySelectorAll(".score-marker")];

const targetScore = 12;
const maximumTries = 5;
const maximumScores = 3;

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
let triesRemaining = maximumTries;
let scoresRemaining = maximumScores;
let roundSum = 0;
let currentResult = null;

function renderState() {
  triesValue.textContent = triesRemaining;
  scoresValue.textContent = scoresRemaining;
  scoreValue.textContent = roundSum;
  progressValue.textContent = roundSum;
  rollLabel.textContent = currentResult === null ? "Roll" : "Roll again";

  tryMarkers.forEach((marker, index) => {
    marker.classList.toggle("is-spent", index >= triesRemaining);
  });

  scoreMarkers.forEach((marker, index) => {
    marker.classList.toggle("is-spent", index >= scoresRemaining);
  });

  const roundComplete = roundSum >= targetScore;
  targetPlaque.classList.toggle("is-complete", roundComplete);
  rollButton.disabled = rolling || triesRemaining === 0 || roundComplete;
  scoreButton.disabled = rolling || currentResult === null || scoresRemaining === 0 || roundComplete;
}

function rollDie() {
  if (rolling || triesRemaining === 0 || roundSum >= targetScore) return;

  rolling = true;
  const result = Math.floor(Math.random() * 6) + 1;
  triesRemaining -= 1;
  currentResult = null;
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

  const duration = reducedMotion.matches ? 180 : 980;
  window.setTimeout(() => {
    dice.classList.remove("is-rolling");
    dice.setAttribute("aria-label", `Die showing ${result} on top`);
    currentResult = result;
    rolling = false;
    renderState();
  }, duration);
}

function scoreRoll() {
  if (rolling || currentResult === null || scoresRemaining === 0 || roundSum >= targetScore) return;
  roundSum += currentResult;
  scoresRemaining -= 1;
  currentResult = null;
  renderState();
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
