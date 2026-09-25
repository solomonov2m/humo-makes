// Два элемента соединяются только своим путём. Чужой путь смесь не открывает.

import { element } from "./table.js";

const NOBLE = new Set(["He", "Ne", "Ar", "Kr", "Xe", "Rn", "Og"]);
const ACTIVE = new Set(["Li", "Na", "K", "Rb", "Cs", "Fr", "Be", "Mg", "Ca", "Sr", "Ba", "Ra"]);
const HALOGEN = new Set(["F", "Cl", "Br", "I", "At", "Ts"]);

export function mixElements(aSym, bSym, heat) {
  const a = element(aSym);
  const b = element(bSym);
  if (!a || !b || a.sym === b.sym) return refuse("это одно и то же");
  if (NOBLE.has(a.sym) || NOBLE.has(b.sym)) return refuse("благородный газ не вступает");
  if (pair(a, b, "H", "O")) {
    return heat ? { ok: true, out: "water", note: "водород и кислород дают воду" } : refuse("водород с кислородом без жара не сходятся");
  }
  if (pair(a, b, "C", "O")) {
    return heat ? { ok: true, note: "углерод в кислороде сгорает" } : refuse("углерод без жара не горит");
  }
  if (pair(a, b, "S", "O")) {
    return heat ? { ok: true, note: "сера сгорает в едкий газ" } : refuse("сера без жара не горит");
  }
  if ((a.sym === "H" && HALOGEN.has(b.sym)) || (b.sym === "H" && HALOGEN.has(a.sym))) {
    return { ok: true, note: "водород и галоген дают едкий газ" };
  }
  if ((ACTIVE.has(a.sym) && HALOGEN.has(b.sym)) || (ACTIVE.has(b.sym) && HALOGEN.has(a.sym))) {
    const salt = (a.sym === "Na" && b.sym === "Cl") || (a.sym === "Cl" && b.sym === "Na");
    return salt ? { ok: true, out: "salt", note: "натрий и хлор дают соль" } : { ok: true, note: "металл и галоген дают соль" };
  }
  if ((metal(a) && b.sym === "O") || (metal(b) && a.sym === "O")) {
    return a.sym === "Fe" || b.sym === "Fe" ? { ok: true, out: "ore", note: "железо забирает кислород" } : { ok: true, note: "металл покрывается оксидом" };
  }
  if (metal(a) && metal(b)) {
    if (!heat) return refuse("без жара металлы не сливаются");
    if ((a.sym === "Cu" && b.sym === "Sn") || (a.sym === "Sn" && b.sym === "Cu")) {
      return { ok: true, out: "bronze", note: "медь и олово в жаре становятся бронзой" };
    }
    return { ok: true, note: "в жаре металлы сливаются, новых атомов нет" };
  }
  return refuse("эти элементы так не соединяются");
}

export function mixStuff(left, right, heat) {
  const a = pure(left);
  const b = pure(right);
  if (!a || !b) return null;
  return mixElements(a, b, heat);
}

function pure(piece) {
  if (!piece || !piece.bits || !piece.bits.length) return null;
  const top = piece.bits.slice().sort((x, y) => y[1] - x[1])[0];
  return top[1] >= 90 ? top[0] : null;
}

function metal(item) {
  return item.form === "metal" || item.form === "liquid";
}

function pair(a, b, x, y) {
  return (a.sym === x && b.sym === y) || (a.sym === y && b.sym === x);
}

function refuse(note) {
  return { ok: false, note };
}
