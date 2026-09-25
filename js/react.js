// Превращение решает жар и состав. Пары «это с тем» в списке нет.

import { admit } from "./chem.js";
import { mixStuff } from "./mix.js";
import { burn, campHeat, dissolve, meltPoint, melts, spoil } from "./laws.js";
import { stuff } from "./elements.js";

const METAL = { Fe: "iron", Cu: "cu", Sn: "tin" };

export function tryMix(a, b, heat) {
  if (!a || !b) return null;
  const temp = typeof heat === "number" ? heat : heat ? campHeat() : 0;
  const hot = temp >= 280;
  const ruled = rule(a, b, hot);
  if (ruled) return ruled.out ? finish(a, b, ruled, hot) : ruled;
  const shaped = compose(a, b, temp);
  if (shaped) return shaped.out ? finish(a, b, shaped, hot) : shaped;
  if (a.kind === "metal" && b.kind === "metal" && a.id !== b.id && (!melts(a, temp) || !melts(b, temp))) {
    return { ok: false, note: "жар не дотягивает до плавления" };
  }
  const mixed = mixStuff(a, b, hot);
  if (!mixed) return { ok: false, note: "смесь не изменилась" };
  return mixed.out ? finish(a, b, mixed, hot) : mixed;
}

function rule(a, b, heat) {
  return dissolve(a, b) || dissolve(b, a) || spoil(a, b.id === "water", heat) || spoil(b, a.id === "water", heat) || burn(a, b, heat) || burn(b, a, heat);
}

function compose(a, b, temp) {
  return rust(a, b, temp) || clay(a, b, temp) || reduceOre(a, b, temp);
}

function rust(a, b, temp) {
  const metal = a.kind === "metal" ? a : b.kind === "metal" ? b : null;
  const water = a.id === "water" ? a : b.id === "water" ? b : null;
  if (!metal || !water || temp >= 200) return null;
  if (share(metal, "Fe") < 90) return null;
  return { ok: true, out: "ore", note: "железо во влаге снова ржавеет" };
}

function clay(a, b, temp) {
  const body = alum(a) ? a : alum(b) ? b : null;
  const other = body === a ? b : a;
  if (!body || !other) return null;
  if (other.id === "water" && temp < 200) return { ok: true, out: "clay", note: "глина с водой становится мягкой" };
  const fire = meltPoint(stuff("ceramic")) * 0.5;
  if (other.kind === "gas" && share(other, "O") >= 18 && temp >= fire) {
    return { ok: true, out: "ceramic", note: "обожжённая глина твердеет" };
  }
  return null;
}

function reduceOre(a, b, temp) {
  const ore = a.kind === "ore" ? a : b.kind === "ore" ? b : null;
  const fuel = ore === a ? b : a;
  if (!ore || !carbonRich(fuel)) return null;
  const sym = metalSym(ore);
  if (!sym) return null;
  const product = stuff(METAL[sym]);
  const need = meltPoint(product) * 0.55;
  if (temp < need) return { ok: false, note: "жар не дотягивает до плавления" };
  return { ok: true, out: product.id, note: "уголь забирает кислород у руды" };
}

function alum(piece) {
  return !!piece && piece.kind === "silicate" && share(piece, "Al") >= 10 && piece.hardness < 3;
}

function carbonRich(piece) {
  if (!piece) return false;
  if (piece.kind === "carbon") return true;
  return piece.kind === "organic" && share(piece, "C") >= 40;
}

function metalSym(piece) {
  let best = "";
  let pct = 0;
  for (const [sym, part] of piece.bits || []) {
    if (!METAL[sym] || part <= pct) continue;
    best = sym;
    pct = part;
  }
  return pct >= 40 ? best : "";
}

function share(piece, sym) {
  const row = piece.bits && piece.bits.find((bit) => bit[0] === sym);
  return row ? row[1] : 0;
}

function finish(a, b, hit, heat) {
  const verdict = admit([a, b], hit.out, heat);
  if (!verdict.ok) return { ok: false, note: verdict.note };
  return { ok: true, out: hit.out, note: hit.note, grams: verdict.grams };
}
