// Жара, соль, лёд, вес и трение. Пустые руки не греют, море не поит.

import { TILE_DEEP, TILE_FRESH, TILE_SHALLOW, TILE_WATER } from "./world.js";
import { groundMatter } from "./matter.js";
import { groundTemp } from "./climate.js";
import { woodFloats } from "./laws.js";
import { digest } from "./metabol.js";
import { rubHeat } from "./friction.js";

const NEI = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function cellHeat(world, x, y) {
  ensure(world);
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (!world.inBounds(ix, iy)) return groundTemp(world, ix, iy);
  return groundTemp(world, ix, iy) + world.heat[world.idx(ix, iy)];
}

export function warm(world, x, y, degrees) {
  ensure(world);
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (!world.inBounds(ix, iy) || degrees <= 0) return 0;
  world.heat[world.idx(ix, iy)] += degrees;
  world.embers = true;
  return degrees;
}

export function fuelDegrees(grams) {
  return Math.max(0, grams) * 6;
}

export function coolField(world) {
  if (!world.embers) return;
  world.embers = false;
  ensure(world);
  const next = new Float32Array(world.heat.length);
  const cols = world.cols;
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      const i = y * cols + x;
      const hot = world.heat[i];
      if (hot < 0.4) continue;
      world.embers = true;
      next[i] += hot * 0.8;
      for (const [dx, dy] of NEI) {
        const nx = x + dx;
        const ny = y + dy;
        if (!world.inBounds(nx, ny)) continue;
        next[ny * cols + nx] += hot * 0.04;
      }
    }
  }
  world.heat = next;
}

export function phase(world, x, y) {
  const t = world.tileAt(Math.round(x), Math.round(y));
  if (t !== TILE_FRESH && t !== TILE_SHALLOW && t !== TILE_WATER && t !== TILE_DEEP) return "dry";
  const c = cellHeat(world, x, y);
  if (c < 0) return "ice";
  if (c >= 100) return "steam";
  return "water";
}

export function sip(agent, world, x, y) {
  const ix = Math.round(x);
  const iy = Math.round(y);
  const fresh = world.tileAt(ix, iy) === TILE_FRESH || NEI.some(([dx, dy]) => world.tileAt(ix + dx, iy + dy) === TILE_FRESH);
  if (phase(world, ix, iy) === "ice") {
    if (!fresh) {
      agent.thirst = Math.min(100, agent.thirst + 6);
      return { fresh: false, note: "солёный лёд не поит" };
    }
    digest(agent, "water", 0.35);
    agent.energy = Math.max(0, agent.energy - 6);
    return { fresh: true, note: "тает лёд во рту" };
  }
  if (!fresh) {
    agent.thirst = Math.min(100, agent.thirst + 6);
    return { fresh: false, note: "солёная вода сушит" };
  }
  digest(agent, "water", 1);
  return { fresh: true, note: agent.thirst > 12 ? "пьёт пресную воду" : "пресная вода утолила" };
}

export function burden(agent) {
  const grams = agent.pocket ? agent.pocket.grams || 0 : 0;
  const cap = 70 + (agent.traits && agent.traits.strength ? agent.traits.strength : 0.5) * 180;
  if (grams > cap) return { pace: 1, drop: true, note: "тяжесть выскальзывает из рук" };
  return { pace: 1 / (1 + grams / cap), drop: false, note: "" };
}

export function footing(world, x, y) {
  const piece = groundMatter(world, Math.round(x), Math.round(y));
  if (piece.id === "clay" && world.touchesWater(Math.round(x), Math.round(y))) return 0.55;
  if (phase(world, x, y) === "ice") return 0.7;
  return 1;
}

export function rub(a, b) {
  return rubHeat(a, b);
}

export function sail(world, x, y) {
  if (!woodFloats()) return false;
  return phase(world, x, y) !== "ice";
}

export function pushSteam(world, agents) {
  for (const agent of agents) {
    if (!agent.alive) continue;
    const x = Math.round(agent.x);
    const y = Math.round(agent.y);
    for (const [dx, dy] of NEI) {
      if (phase(world, x + dx, y + dy) !== "steam") continue;
      if (!held(world, x + dx, y + dy)) continue;
      agent.x -= dx * 0.35;
      agent.activity = "пар толкает";
      return;
    }
  }
}

function held(world, x, y) {
  let walls = 0;
  for (const [dx, dy] of NEI) if (world.isLand(x + dx, y + dy)) walls += 1;
  return walls >= 3;
}

function ensure(world) {
  if (!world.heat) world.heat = new Float32Array(world.cols * world.rows);
}
