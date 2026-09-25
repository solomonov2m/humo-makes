// Слепой прогон. Политика видит твёрдость и сухость кожи, не формулу нагрева.

import { stuff } from "./elements.js";
import { contactDegrees } from "./friction.js";
import { blankGuess, learnHeat, pickPair, predictHeat } from "./guess.js";

const wood = stuff("wood");
const stone = stuff("stone");
const clay = stuff("clay");
const soil = stuff("soil");

const PAIRS = [
  { id: "damp", hand: wood, ground: { ...stone, wet: 0.9 } },
  { id: "dry", hand: wood, ground: { ...stone, wet: 0 } },
  { id: "soft", hand: clay, ground: { ...soil, wet: 0 } },
];

function episode(guess, steps, learn) {
  const picks = [];
  for (let i = 0; i < steps; i++) {
    const choice = pickPair(guess, PAIRS);
    const degrees = contactDegrees(choice.hand, choice.ground, choice.ground.wet);
    if (learn) learnHeat(guess, choice.felt, choice.predicted, degrees);
    picks.push(choice.id);
  }
  return picks;
}

function tally(picks, from) {
  const count = { damp: 0, dry: 0, soft: 0 };
  for (const id of picks.slice(from)) count[id] += 1;
  return count;
}

const learner = blankGuess();
const picks = episode(learner, 40, true);
const late = tally(picks, 24);
const still = tally(episode(blankGuess(), 40, false), 24);

const bark = { ...wood, id: "bark", name: "кора" };
const transfer = pickPair(learner, [
  { id: "bark", hand: bark, ground: { ...stone, wet: 0 } },
  { id: "damp", hand: wood, ground: { ...stone, wet: 0.9 } },
]);

const pupil = blankGuess();
learner.trace.forEach((row, index) => {
  if (index % 2) return;
  const noisy = row.actual * 0.65;
  learnHeat(pupil, row.felt, predictHeat(pupil, row.felt), noisy);
});
const pupilPick = pickPair(pupil, PAIRS);

const report = {
  weights: learner.w.map((v) => Number(v.toFixed(3))),
  bias: Number(learner.bias.toFixed(3)),
  changed: Number(learner.changed.toFixed(3)),
  early: tally(picks, 0),
  late,
  noLearnLate: still,
  transfer: transfer.id,
  pupil: pupilPick.id,
  pupilChanged: Number(pupil.changed.toFixed(3)),
  lastErr: learner.trace.slice(-3).map((row) => Number(row.err.toFixed(2))),
};

console.log(JSON.stringify(report, null, 2));

const learned = late.dry > late.damp && learner.changed > 0.2;
const transferred = transfer.id === "bark";
const pupilOk = pupilPick.id !== "damp" && pupil.changed > 0;
if (!learned || !transferred || !pupilOk) {
  console.error("probe failed", { learned, transferred, pupilOk });
  process.exit(1);
}
