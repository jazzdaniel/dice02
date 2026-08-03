const dice = document.querySelector("#dice");

const landingAngles = {
  1: { x: 0, z: 0 },
  2: { x: 90, z: 0 },
  3: { x: 0, z: -90 },
  4: { x: 0, z: 90 },
  5: { x: -90, z: 0 },
  6: { x: 180, z: 0 },
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let rolling = false;
let revolutions = { x: 0, y: 0, z: 0 };

function rollDie() {
  if (rolling) return;

  rolling = true;
  const result = Math.floor(Math.random() * 6) + 1;
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
  dice.style.setProperty("--rot-y", `${revolutions.y * 360}deg`);
  dice.style.setProperty("--rot-z", `${landing.z + revolutions.z * 360}deg`);
  dice.setAttribute("aria-label", `Die rolling, result ${result}`);

  const duration = reducedMotion.matches ? 180 : 980;
  window.setTimeout(() => {
    dice.classList.remove("is-rolling");
    dice.setAttribute("aria-label", `Die showing ${result} on top`);
    rolling = false;
  }, duration);
}

window.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || event.repeat) return;
  event.preventDefault();
  rollDie();
});
