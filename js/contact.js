// Житель трёт то, что держит, о то, что под ногами, и запоминает, насколько стало теплее.

import { contactDegrees } from "./friction.js";
import { feelPair, learnHeat, predictHeat, blankGuess } from "./guess.js";
import { groundMatter, takeSample } from "./matter.js";
import { warm } from "./phys.js";

export function practiceContact(agent, world) {
  if (!agent.alive || !agent.body) return false;
  if (!agent.guess) agent.guess = blankGuess();
  const x = Math.round(agent.x);
  const y = Math.round(agent.y);
  const here = groundMatter(world, x, y);
  if (!here || here.state !== "solid") return false;
  if (!agent.pocket) takeSample(agent, world);
  const hand = agent.pocket;
  if (!hand || hand.state !== "solid") return false;
  const wet = world.touchesWater(x, y) ? 0.85 : 0;
  const ground = { ...here, wet };
  const felt = feelPair(hand, ground);
  const predicted = predictHeat(agent.guess, felt);
  const degrees = contactDegrees(hand, here, wet);
  warm(world, x, y, degrees);
  const err = learnHeat(agent.guess, felt, predicted, degrees);
  agent.idea = err > 0.4 ? "трение теплее, чем ждал" : err < -0.4 ? "трение холоднее, чем ждал" : "трение примерно как ждал";
  agent.activity = agent.idea;
  return true;
}
