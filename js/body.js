import { element } from "./elements.js";
import { aminoLine } from "./metabol.js";

const FLESH = [
  ["O", 65],
  ["C", 18],
  ["H", 10],
  ["N", 3],
  ["Ca", 1.5],
  ["P", 1],
  ["K", 0.4],
  ["S", 0.3],
  ["Na", 0.2],
  ["Fe", 0.006],
];

export function makeBody(agent) {
  const g = agent.genome.values;
  const mass = 42 + g.strength * 28;
  return {
    mass,
    water: 0.55 + (1 - g.metabolism) * 0.08,
    protein: 0.14 + g.strength * 0.06,
    carb: 0.02 + (1 - g.metabolism) * 0.03,
    fat: 0.1 + g.metabolism * 0.08,
    bone: 0.12 + g.immunity * 0.04,
    nerves: {
      skin: 0.35 + g.vision * 0.4,
      gut: 0.4 + g.metabolism * 0.45,
      pain: 0.25 + (1 - g.immunity) * 0.4,
      joint: 0.3 + g.strength * 0.4,
    },
    links: 18 + Math.round(g.vision * 40),
  };
}

export function feelMatter(agent, piece) {
  if (!piece || !agent.body) return null;
  const skin = agent.body.nerves.skin;
  return {
    density: piece.density,
    hardness: piece.hardness * skin,
    wet: piece.state === "liquid" ? 1 : 0,
    heavy: piece.density > 4 ? 1 : 0,
  };
}

export function bodyLine(agent) {
  const b = agent.body;
  if (!b) return "";
  const bits = FLESH.slice(0, 6).map(([sym, pct]) => `${element(sym).name} ${pct}%`).join(", ");
  const rot = !agent.alive && b.rot != null ? ` Гниль ${Math.round(b.rot)} г, вонь ${Math.round(b.gas)} г.` : "";
  return `Масса ${b.mass.toFixed(1)} кг из ${b.goal ? b.goal.toFixed(0) : b.mass.toFixed(0)}. ${bits}. ${aminoLine(agent)}${rot}`;
}

export function nerveLine(agent) {
  const n = agent.body && agent.body.nerves;
  if (!n) return "";
  return `Кожа ${Math.round(n.skin * 100)}, живот ${Math.round(n.gut * 100)}, боль ${Math.round(n.pain * 100)}, суставы ${Math.round(n.joint * 100)}.`;
}
