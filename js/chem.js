// Атомы не возникают. Выход берёт элементы только из входа и только тем путём, который этому виду по силам.

import { element, stuff } from "./elements.js";
import { campHeat, melts } from "./laws.js";
import { keeps } from "./maths.js";

const TRACE = 1;
const PILE = { coal: "charcoal", tin: "tinore" };

export function admit(parts, want, heat) {
  const product = typeof want === "string" ? stuff(want) : want;
  const pile = (parts || []).filter(Boolean);
  if (!product || !pile.length) return refuse("смесь не изменилась");
  const pool = poolOf(pile);
  const mass = pile.reduce((sum, part) => sum + gramsOf(part), 0);
  let room = mass;
  for (const [sym, pct] of product.bits) {
    if (pct < TRACE) continue;
    room = Math.min(room, ((pool[sym] || 0) * 100) / pct);
  }
  const gate = keeps(pile.map(gramsOf), room);
  if (!gate.ok) return refuse(gate.note);
  if (room < 1) return refuse(missing(product, pool));
  const blocked = kindBlock(pile, product, !!heat);
  if (blocked) return refuse(blocked);
  return { ok: true, note: "атомы на месте", grams: room };
}

export function fromPiles(ids, product, heat) {
  const parts = (ids || []).map((id) => stuff(PILE[id] || id)).filter(Boolean);
  return admit(parts, product, heat);
}

export function canAlloy(left, right) {
  if (!left || !right || left.kind !== "metal" || right.kind !== "metal" || left.id === right.id) {
    return refuse("сплавляются только разные металлы");
  }
  const temp = campHeat();
  if (!melts(left, temp) || !melts(right, temp)) return refuse("жар не дотягивает до плавления");
  const mix = blendMetal(left, right);
  const verdict = admit([left, right], mix, true);
  return verdict.ok ? { ok: true, out: mix, note: "в жаре металлы сливаются, новых атомов нет" } : verdict;
}

function poolOf(parts) {
  const pool = {};
  for (const part of parts) {
    for (const [sym, pct] of part.bits) pool[sym] = (pool[sym] || 0) + gramsOf(part) * pct / 100;
  }
  return pool;
}

function gramsOf(part) {
  return part.grams || 100;
}

function missing(product, pool) {
  const gap = product.bits.find(([sym, pct]) => pct >= TRACE && (pool[sym] || 0) < 0.5);
  if (!gap) return "массы не хватает";
  const bit = element(gap[0]);
  return `${bit ? bit.name : gap[0]} не из чего взять`;
}

function kindBlock(parts, product, heat) {
  if (product.kind === "polymer") {
    const feed = parts.some((part) => part.kind === "organic" && share(part, "C") >= 30 && share(part, "H") >= 5);
    if (!feed) return "из этого цепочки не собрать";
    if (!heat) return "без жара цепи не смыкаются";
  }
  if (product.kind === "carbon") {
    if (!parts.some((part) => part.kind === "organic")) return "углю не из чего взяться";
    if (!heat) return "без жара дерево остаётся деревом";
  }
  if (product.kind === "metal") return metalBlock(parts, product, heat);
  return "";
}

function metalBlock(parts, product, heat) {
  const stock = parts.filter((part) => part.kind === "metal" || part.kind === "ore");
  if (!stock.length) return "металла в смеси нет";
  const fromOre = parts.some((part) => part.kind === "ore");
  const reductant = parts.some((part) => part.kind === "carbon" || part.kind === "organic");
  if (fromOre && (!heat || !reductant)) return "руда без угля и жара остаётся рудой";
  if (!fromOre && !heat && !parts.some((part) => part.id === product.id)) return "без жара металлы не сливаются";
  return "";
}

function share(part, sym) {
  const row = part.bits.find((bit) => bit[0] === sym);
  return row ? row[1] : 0;
}

function blendMetal(left, right) {
  const bits = new Map();
  for (const part of [left, right]) {
    for (const [sym, pct] of part.bits) bits.set(sym, (bits.get(sym) || 0) + pct / 2);
  }
  return {
    id: "alloy",
    name: "сплав",
    bits: [...bits.entries()],
    density: (left.density + right.density) / 2,
    hardness: (left.hardness + right.hardness) / 2,
    state: "solid",
    kind: "metal",
  };
}

function refuse(note) {
  return { ok: false, note };
}
