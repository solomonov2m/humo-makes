// Мир пускает только то, что сходится с плотностью, жаром, кислородом и водой.

import { stuff } from "./elements.js";
import { leverHolds } from "./maths.js";

const CAMP = 1100;
const MELT = {
  tin: 232,
  bronze: 950,
  cu: 1085,
  iron: 1538,
  stone: 1700,
  ceramic: 1600,
  sand: 1700,
};

export function campHeat() {
  return CAMP;
}

export function meltPoint(piece) {
  if (!piece || piece.state === "gas" || piece.state === "liquid") return 0;
  return MELT[piece.id] ?? 2000;
}

export function melts(piece, heat) {
  return !!piece && heat >= meltPoint(piece);
}

export function floats(piece) {
  return !!piece && piece.state === "solid" && piece.density < 1;
}

export function woodFloats() {
  return floats(stuff("wood"));
}

export function flexes(piece) {
  if (!piece) return false;
  return piece.kind === "organic" || piece.kind === "polymer" || piece.kind === "carbon";
}

export function lifts(heft, shaft, target) {
  const held = leverHolds(1, shaft, (target && target.density) || 1, 1);
  if (!held.ok) return { ok: false, note: held.note };
  return { ok: true, arm: held.have, heft: heft && heft.density };
}

export function bite(edge, target, device) {
  const gap = edge.hardness - (target.hardness || 0);
  const keen = device && device.edge === edge.id ? (device.keen ?? 1) : 1;
  if (gap <= 0) return { cuts: false, keen: 0, note: "кромка не твёрже цели и только тупится" };
  const next = keen - 0.12 / gap;
  if (next <= 0) return { cuts: false, keen: 0, note: "кромка стёрлась" };
  return { cuts: true, keen: next };
}

export function burn(fuel, other, heat) {
  if (!heat || !fuel) return null;
  if (fuel.kind !== "organic" && fuel.kind !== "carbon") return null;
  if (other && (other.kind === "ore" || other.kind === "metal")) return null;
  if (other && other.kind === "gas") {
    const ox = share(other, "O");
    if (ox >= 18) return { ok: true, note: "на воздухе сгорает до газа" };
    return { ok: false, note: "воздуха мало, огонь не держится" };
  }
  if (other && other.kind === "silicate") {
    return { ok: true, out: "charcoal", note: "под засыпкой остаётся уголь" };
  }
  return null;
}

export function dissolve(solid, liquid) {
  if (!liquid || liquid.id !== "water" || !solid) return null;
  if (solid.id === "salt") return { ok: true, brine: true, note: "соль расходится в воде" };
  if (solid.kind === "silicate" || solid.kind === "ore" || solid.kind === "metal") {
    return { ok: false, note: "в воде не растворяется" };
  }
  return null;
}

export function spoil(piece, wet, heat) {
  if (heat || !wet || !piece || piece.kind !== "organic") return null;
  return { ok: true, out: "rot", note: "в воде без жара органика киснет" };
}

export function dryBrine(pocket, ground) {
  if (!pocket || !pocket.brine) return null;
  if (!ground || ground.id === "water" || ground.state === "liquid") return null;
  return { ...stuff("salt"), grams: pocket.grams || 40 };
}

function share(piece, sym) {
  const row = piece.bits && piece.bits.find((bit) => bit[0] === sym);
  return row ? row[1] : 0;
}

const GRASP = [
  ["соль расходится", "Растворение", "соль уходит в воду"],
  ["не растворяется", "Растворение", "песок и камень в воде остаются"],
  ["вода ушла", "Выпаривание", "соль остаётся, когда вода уходит"],
  ["сгорает", "Горение", "на воздухе органика сгорает"],
  ["остаётся уголь", "Горение", "под засыпкой остаётся уголь"],
  ["плавления", "Плавление", "плавится только то, чей жар достигнут"],
  ["древко", "Рычаг", "момент руки равен силе на плече"],
  ["ломается", "Упругость", "камень в длинном древке ломается"],
  ["кромка", "Износ", "кромка тупится, если не твёрже цели"],
  ["киснет", "Гниение", "органика в воде без жара киснет"],
  ["тонет", "Плавучесть", "плотнее воды тонет"],
];

export function graspNote(agent, culture, note) {
  const hit = GRASP.find((row) => note && note.includes(row[0]));
  if (!hit) return "";
  if (!agent.laws) agent.laws = {};
  agent.laws[hit[1]] = hit[2];
  agent.lawName = hit[1];
  agent.lawUse = hit[2];
  if (!culture) return hit[1];
  culture.laws = culture.laws || {};
  if (!culture.laws[hit[1]]) culture.lastLaw = hit[1];
  culture.laws[hit[1]] = hit[2];
  return hit[1];
}

export function applyKnown(agent, here) {
  const pocket = agent.pocket;
  const laws = agent.laws || {};
  if (!pocket || !here) return false;
  if (laws["Растворение"] && pocket.id === "salt" && here.id === "water") {
    agent.pocket = { ...pocket, brine: true };
    return wield(agent, "Растворение");
  }
  if (laws["Горение"] && (pocket.kind === "organic" || pocket.kind === "carbon")) {
    const fired = burn(pocket, here.kind === "gas" || here.kind === "silicate" ? here : stuff("air"), true);
    if (fired && fired.ok && fired.out) {
      agent.pocket = { ...stuff(fired.out), grams: pocket.grams };
      return wield(agent, "Горение");
    }
    if (fired && fired.ok) {
      agent.pocket = null;
      return wield(agent, "Горение");
    }
  }
  if (laws["Гниение"] && pocket.kind === "organic" && here.id === "water") return wield(agent, "Гниение");
  if (laws["Плавучесть"] && pocket.id === "wood" && here.id === "water") return wield(agent, "Плавучесть");
  if (laws["Износ"] && pocket.hardness <= here.hardness) return wield(agent, "Износ");
  return false;
}

export function passLaws(agent, neighbors) {
  if (!agent.laws) agent.laws = {};
  for (const other of neighbors || []) {
    if (!other.alive || !other.laws) continue;
    for (const name of Object.keys(other.laws)) {
      if (agent.laws[name] || Math.random() > 0.04) continue;
      agent.laws[name] = other.laws[name];
      agent.lawName = name;
      agent.lawUse = other.laws[name];
      return;
    }
  }
}

function wield(agent, name) {
  agent.lawName = name;
  agent.lawUse = agent.laws[name];
  agent.activity = `применяет «${name}»: ${agent.lawUse}`;
  agent.idea = agent.activity;
  return true;
}

export function lawRows(culture) {
  const laws = (culture && culture.laws) || {};
  return Object.keys(laws).map((name) => ({ name, use: laws[name] }));
}
