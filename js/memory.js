// Рабочая память держит несколько картин сразу. Эпизод помнит, чем дело кончилось.

const SLOTS = 3;

export function blankMemory() {
  return {
    wm: Array.from({ length: SLOTS }, () => ({ v: [], gain: 0 })),
    episodes: [],
    plan: null,
  };
}

export function attend(brain, input) {
  let hold = 0;
  for (let i = 1; i < brain.wm.length; i++) {
    if (brain.wm[i].gain < brain.wm[hold].gain) hold = i;
  }
  for (const slot of brain.wm) slot.gain *= 0.84;
  const write = Math.tanh(dotGate(brain.gate[hold], input));
  if (write > brain.wm[hold].gain) {
    brain.wm[hold] = { v: input.slice(), gain: Math.max(0.2, write) };
  }
  return hold;
}

export function recallBias(brain, scores) {
  brain.wm.forEach((slot, slotIndex) => {
    if (slot.gain < 0.2) return;
    const row = brain.bind[slotIndex];
    for (let act = 0; act < scores.length; act++) scores[act] += row[act] * slot.gain;
  });
}

export function noteEpisode(brain, act, reward) {
  brain.episodes.push({ act, reward });
  if (brain.episodes.length > 8) brain.episodes.shift();
}

export function actMemory(brain, act) {
  let sum = 0;
  let n = 0;
  for (const episode of brain.episodes) {
    if (episode.act !== act) continue;
    sum += episode.reward;
    n += 1;
  }
  return n ? sum / n : 0;
}

export function memoryLine(agent) {
  const brain = agent.brain;
  if (!brain || !brain.wm) return "Рабочая память ещё пустая.";
  const held = brain.wm.filter((slot) => slot.gain > 0.2).length;
  const past = brain.episodes.length;
  return `В рабочей памяти ${held} из ${SLOTS}. Эпизодов: ${past}.`;
}

function dotGate(row, input) {
  if (!row) return 0;
  let sum = 0;
  for (let i = 0; i < row.length; i++) sum += row[i] * (input[i] || 0);
  return sum;
}
