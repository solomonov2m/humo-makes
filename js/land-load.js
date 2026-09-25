// Пластины из папки landshaft. База повторяется, стыки ложатся на границу.

import { METERS_PER_TILE } from "./measure.js";

export const SPAN_M = 9;

const SRC = {
  grass: "landshaft/Unknown-8.png",
  soil: "landshaft/Unknown-5.png",
  gravel: "landshaft/Unknown-2.png",
  sand: "landshaft/Unknown.png",
  grassSoil: "landshaft/Unknown-6.png",
  soilGravel: "landshaft/Unknown-4.png",
  gravelSand: "landshaft/Unknown-3.png",
  sandCut: "landshaft/Unknown-7.png",
};

const BASE = ["grass", "soil", "gravel", "sand"];
const PAIRS = {
  "grass|soil": { id: "grassSoil", left: "grass", right: "soil" },
  "gravel|soil": { id: "soilGravel", left: "soil", right: "gravel" },
  "gravel|sand": { id: "gravelSand", left: "gravel", right: "sand" },
};

const plates = {};
let ready = false;
const cache = new WeakMap();

export function landReady() { return ready; }

export function spanTiles() { return SPAN_M / METERS_PER_TILE; }

export function plate(id) { return plates[id] || null; }

export function photoReach(scale) {
  const px = scale * spanTiles();
  if (px < 14) return 0;
  return Math.min(1, (px - 14) / 26);
}

export function kindPattern(ctx, id) {
  const src = plates[id];
  if (!src) return null;
  let bag = cache.get(ctx);
  if (!bag) {
    bag = {};
    cache.set(ctx, bag);
  }
  if (!bag[id]) {
    const pattern = ctx.createPattern(src, "repeat");
    const fit = spanTiles() / src.width;
    pattern.setTransform(new DOMMatrix().scale(fit, fit));
    bag[id] = pattern;
  }
  return bag[id];
}

export function bridgeOf(a, b) {
  const key = a < b ? `${a}|${b}` : `${b}|${a}`;
  const hit = PAIRS[key];
  if (!hit || !plates[hit.id]) return null;
  return { img: plates[hit.id], left: hit.left, right: hit.right };
}

function boot() {
  const jobs = Object.entries(SRC).map(async ([id, src]) => {
    const img = await loadImage(src);
    if (!img) return;
    plates[id] = BASE.includes(id) ? seamless(img) : img;
  });
  Promise.all(jobs).then(() => {
    ready = BASE.every((id) => plates[id]);
  });
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const SPOTS = [[40, 30], [380, 20], [700, 180], [90, 360], [430, 300], [760, 480], [160, 620], [500, 700], [20, 520], [300, 160]];

function seamless(img) {
  const side = 768;
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const g = canvas.getContext("2d");
  const inset = 0.12;
  g.drawImage(
    img,
    img.width * inset, img.height * inset,
    img.width * (1 - inset * 2), img.height * (1 - inset * 2),
    0, 0, side, side,
  );
  const stamp = disc(img, 460);
  for (const [x, y] of SPOTS) wrap(g, stamp, x, y, side);
  return canvas;
}

function disc(img, size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext("2d");
  const inset = 0.08;
  g.drawImage(
    img,
    img.width * inset, img.height * inset,
    img.width * (1 - inset * 2), img.height * (1 - inset * 2),
    0, 0, size, size,
  );
  g.globalCompositeOperation = "destination-in";
  const mid = size / 2;
  const rad = g.createRadialGradient(mid, mid, size * 0.15, mid, mid, size * 0.5);
  rad.addColorStop(0, "rgba(0,0,0,1)");
  rad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = rad;
  g.fillRect(0, 0, size, size);
  return canvas;
}

function wrap(g, stamp, x, y, side) {
  for (const dx of [0, -side]) {
    for (const dy of [0, -side]) g.drawImage(stamp, x + dx, y + dy);
  }
}

if (typeof Image !== "undefined") boot();
