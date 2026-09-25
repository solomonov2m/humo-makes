// Наблюдаемые превращения. Каждое ещё проходит через атомы: рецепт, который их нарушает, не случается.

import { admit } from "./chem.js";
import { mixStuff } from "./mix.js";
import { burn, campHeat, dissolve, melts, spoil } from "./laws.js";

const LAWS = [
  { a: "wood", b: "air", heat: true, out: "charcoal", note: "древесина в жаре оставляет уголь" },
  { a: "carb", b: "air", heat: true, out: "charcoal", note: "углевод сгорает до угля и газа" },
  { a: "ore", b: "charcoal", heat: true, out: "iron", note: "уголь забирает кислород у руды" },
  { a: "copper", b: "charcoal", heat: true, out: "cu", note: "уголь забирает кислород у медной руды" },
  { a: "tinore", b: "charcoal", heat: true, out: "tin", note: "уголь забирает кислород у оловянной руды" },
  { a: "cu", b: "tin", heat: true, out: "bronze", note: "медь и олово в жаре становятся бронзой" },
  { a: "clay", b: "water", heat: false, out: "clay", note: "глина с водой становится мягкой" },
  { a: "clay", b: "air", heat: true, out: "ceramic", note: "обожжённая глина твердеет" },
  { a: "salt", b: "water", heat: false, out: "water", note: "соль расходится в воде" },
  { a: "iron", b: "water", heat: false, out: "ore", note: "железо во влаге снова ржавеет" },
];

export function tryMix(a, b, heat) {
  if (!a || !b) return null;
  const temp = typeof heat === "number" ? heat : heat ? campHeat() : 0;
  const hot = temp >= 280;
  const ruled = rule(a, b, hot);
  if (ruled) return ruled.out ? finish(a, b, ruled, hot) : ruled;
  const hit = LAWS.find((law) => law.heat === hot && pair(law, a.id, b.id));
  if (!hit) {
    const mixed = mixStuff(a, b, hot);
    if (!mixed) return { ok: false, note: "смесь не изменилась" };
    return mixed.out ? finish(a, b, mixed, hot) : mixed;
  }
  if (a.kind === "metal" && b.kind === "metal" && hot && (!melts(a, temp) || !melts(b, temp))) {
    return { ok: false, note: "жар не дотягивает до плавления" };
  }
  return finish(a, b, hit, hot);
}

function rule(a, b, heat) {
  return dissolve(a, b) || dissolve(b, a) || spoil(a, b.id === "water", heat) || spoil(b, a.id === "water", heat) || burn(a, b, heat) || burn(b, a, heat);
}

function finish(a, b, hit, heat) {
  const verdict = admit([a, b], hit.out, heat);
  if (!verdict.ok) return { ok: false, note: verdict.note };
  return { ok: true, out: hit.out, note: hit.note, grams: verdict.grams };
}

function pair(law, x, y) {
  return (law.a === x && law.b === y) || (law.a === y && law.b === x);
}
