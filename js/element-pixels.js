// Пиксель элемента берётся из его образца: цвет, газ, кристалл, жидкость или металл.

import { element } from "./table.js";

export function paintElement(ctx, sym, x, y) {
  const item = element(sym);
  if (!item) return;
  for (let i = 0; i < 16; i++) stamp(ctx, item, item.pixels[i], x + (i % 4), y + Math.floor(i / 4));
}

export function paintMatter(ctx, piece, x, y) {
  if (!piece || piece.state === "gas" || !piece.bits) return;
  const order = piece.bits.slice().sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  const cells = [];
  for (const [sym, pct] of order) {
    const n = Math.round((16 * pct) / 100);
    for (let i = 0; i < n && cells.length < 16; i++) cells.push(sym);
  }
  while (cells.length < 16) cells.push(order[0][0]);
  for (let i = 0; i < 16; i++) {
    const item = element(cells[i]);
    if (!item) continue;
    const mark = item.pixels[i] === "." ? "0" : item.pixels[i];
    stamp(ctx, item, mark, x + (i % 4), y + Math.floor(i / 4));
  }
}

export function matterInk(piece) {
  if (!piece || !piece.bits) return "#6e655c";
  const lead = piece.bits.slice().sort((a, b) => b[1] - a[1])[0];
  const item = element(lead[0]);
  return item ? item.body : "#6e655c";
}

function stamp(ctx, item, mark, x, y) {
  if (mark === ".") return;
  ctx.fillStyle = mark === "1" ? lift(item.body, 0.62) : mark === "2" ? lift(item.body, -0.42) : item.body;
  ctx.fillRect(x, y, 1, 1);
}

function lift(hex, t) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift) => {
    const v = (n >> shift) & 255;
    const next = t > 0 ? v + (255 - v) * t : v * (1 + t);
    return Math.max(0, Math.min(255, Math.round(next)));
  };
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
