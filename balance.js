window.DICE_GAME_BALANCE = Object.freeze({
  introDialogue: Object.freeze([
    "Oh, this dice is a joke.",
    "Only 1s???",
    "Oh, there's a single 6.",
    "Good luck.",
  ]),
  jokerRemarks: Object.freeze({
    introNudge: Object.freeze([
      "Hey, I'm here.",
      "The card on the right. Yes, me.",
      "Are you leaving me face-down forever?",
    ]),
    dismissed: Object.freeze([
      "Hey! I was talking.",
      "Rude. Turn me back over.",
      "Do you mind? It's dark in here.",
    ]),
    returned: Object.freeze([
      "Miss me?",
      "Much better.",
      "There. A face with personality.",
    ]),
    rareSix: Object.freeze([
      "There it is.",
      "A six! I knew this cube had one good side.",
      "Don't blink. You may never see it again.",
    ]),
    repeatedOne: Object.freeze([
      "Another one. Shocking.",
      "Please! Stop rolling ones, they make me sick.",
      "One, one, one... what a thrilling die.",
      "Even I have more sides than this thing.",
    ]),
    roundWin: Object.freeze([
      "You survived that one.",
      "Against all odds. Mostly ones.",
      "Fine. That was almost impressive.",
    ]),
    runLoss: Object.freeze([
      "The die wins again.",
      "Defeated by a cube full of ones.",
      "Good luck next time. You'll need more of it.",
    ]),
    lastRound: Object.freeze([
      "This is the last round.",
    ]),
    finalWin: Object.freeze([
      "You won! I'm proud.",
      "You actually did it! I can't believe it.",
      "A champion of the worst die ever made.",
      "You beat the joke. Nicely done.",
    ]),
    returningPlayer: Object.freeze([
      "You again?",
    ]),
  }),
  rounds: Object.freeze([
    Object.freeze({ target: 6, tries: 5, scores: 3 }),
    Object.freeze({ target: 7, tries: 5, scores: 3 }),
    Object.freeze({ target: 8, tries: 5, scores: 3 }),
    Object.freeze({ target: 9, tries: 5, scores: 3 }),
    Object.freeze({ target: 10, tries: 5, scores: 3 }),
  ]),
  rollDuration: 980,
  reducedRollDuration: 180,
  scoreCountDuration: 360,
  reducedScoreCountStep: 35,
  introNudgeDelay: 1500,
  jokerRemarkDuration: 2300,
  roundIntroDuration: 1300,
  roundAdvanceDelay: 1250,
  lossDuration: 2000,
  victoryTrembleDuration: 5000,
  victoryOverlayDuration: 1800,
});
