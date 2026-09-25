// Личные веса: житель ждёт нагрев от того, что чувствует, и правит связь после ошибки.

const RATE = 0.22;
const CAP = 4;

export function blankGuess() {
  return { w: [0, 0, 0], bias: 0, changed: 0, lastErr: 0, trace: [] };
}

export function feelPair(hand, ground) {
  const hard = Math.min(1, ((hand.hardness || 0) + (ground.hardness || 0)) / 16);
  const dry = 1 - Math.max(0, Math.min(1, ground.wet || hand.wet || 0));
  return [hard, dry, 1];
}

export function predictHeat(guess, felt) {
  let sum = guess.bias;
  for (let i = 0; i < 3; i++) sum += guess.w[i] * (felt[i] || 0);
  return sum;
}

export function learnHeat(guess, felt, predicted, actual) {
  const err = actual - predicted;
  const before = guess.w.slice();
  const bias0 = guess.bias;
  for (let i = 0; i < 3; i++) {
    guess.w[i] = clamp(guess.w[i] + RATE * err * (felt[i] || 0));
  }
  guess.bias = clamp(guess.bias + RATE * err * 0.35);
  let moved = Math.abs(guess.bias - bias0);
  for (let i = 0; i < 3; i++) moved += Math.abs(guess.w[i] - before[i]);
  guess.changed += moved;
  guess.lastErr = err;
  guess.trace.push({ felt: felt.slice(), predicted, actual, err, w: guess.w.slice() });
  if (guess.trace.length > 16) guess.trace.shift();
  return err;
}

export function pickPair(guess, pairs) {
  let best = null;
  let bestScore = -Infinity;
  for (const pair of pairs) {
    const felt = feelPair(pair.hand, pair.ground);
    const predicted = predictHeat(guess, felt);
    if (predicted > bestScore) {
      bestScore = predicted;
      best = { ...pair, felt, predicted };
    }
  }
  return best;
}

function clamp(value) {
  return Math.max(-CAP, Math.min(CAP, value));
}
