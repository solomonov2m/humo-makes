import { TILE_FOREST, TILE_FRESH, TILE_GRASS, TILE_HILL, TILE_SAND, TILE_SHALLOW } from "./world.js";
import { stuff } from "./elements.js";
import { massOf } from "./maths.js";

function hash(x, y, salt) {
  let n = (x * 374761393 + y * 668265263 + salt * 1274126177) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}

export function groundMatter(world, x, y) {
  const t = world.tileAt(x, y);
  if (!world.isLand(x, y) && t !== TILE_FRESH && t !== TILE_SHALLOW) return stuff("air");
  if (t === TILE_FRESH || t === TILE_SHALLOW) return stuff("water");
  if (t === TILE_HILL) return hillRock(x, y);
  if (t === TILE_FOREST) return stuff("wood");
  if (bank(world, x, y)) return stuff("clay");
  if (t === TILE_SAND) return beach(x, y);
  return stuff("soil");
}

function beach(x, y) {
  const h = hash(x, y, 3) % 9;
  if (h === 0) return stuff("ore");
  if (h < 3) return stuff("salt");
  return stuff("sand");
}

function hillRock(x, y) {
  const h = hash(x, y, 5) % 13;
  if (h === 0) return stuff("copper");
  if (h === 1) return stuff("tinore");
  if (h < 4) return stuff("ore");
  return stuff("stone");
}

function bank(world, x, y) {
  const t = world.tileAt(x, y);
  if (t !== TILE_GRASS && t !== TILE_SAND) return false;
  return world.tileAt(x + 1, y) === TILE_FRESH || world.tileAt(x - 1, y) === TILE_FRESH
    || world.tileAt(x, y + 1) === TILE_FRESH || world.tileAt(x, y - 1) === TILE_FRESH;
}

export function takeSample(agent, world) {
  const x = Math.round(agent.x);
  const y = Math.round(agent.y);
  const piece = groundMatter(world, x, y);
  if (!piece || piece.state === "gas" || piece.id === "water") return null;
  const volume = 40 + (hash(x, y, 1) % 40);
  agent.pocket = { ...piece, grams: massOf(piece.density, volume) };
  return agent.pocket;
}

export function pocketLine(agent) {
  const p = agent.pocket;
  if (!p) return "В руках пусто.";
  return `${p.name}, ${p.grams} г, плотность ${p.density}`;
}
