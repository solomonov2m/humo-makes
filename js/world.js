import { MAP_SCALE } from "./map-span.js";
import { plotGap } from "./civ.js";
import { knownAt, openFirstChart } from "./chart.js";
import { paintMap } from "./map-gen.js";
import { nearCamp, pickCamp } from "./camp.js";
import { foodNear } from "./food-near.js";

export const TILE = 1;
export const COLS = 48 * MAP_SCALE;
export const ROWS = 32 * MAP_SCALE;

export const TILE_DEEP = 0;
export const TILE_WATER = 1;
export const TILE_SHALLOW = 2;
export const TILE_SAND = 3;
export const TILE_GRASS = 4;
export const TILE_FOREST = 5;
export const TILE_HILL = 6;
export const TILE_FRESH = 7;

export class World {
  constructor(seed = Math.random() * 1000) {
    this.seed = Math.floor(Number(seed)) || 1;
    this.generatorVersion = 0;
    this.cols = COLS;
    this.rows = ROWS;
    this.tiles = new Uint8Array(COLS * ROWS);
    this.wear = new Float32Array(COLS * ROWS);
    this.food = new Map();
    this.houses = [];
    this.generateIsland();
    openFirstChart(this);
    this.scatterFood();
  }

  idx(x, y) { return y * this.cols + x; }

  inBounds(x, y) { return x >= 0 && y >= 0 && x < this.cols && y < this.rows; }

  tileAt(x, y) {
    if (!this.inBounds(x, y)) return TILE_DEEP;
    return this.tiles[this.idx(x, y)];
  }

  isLand(x, y) {
    const t = this.tileAt(x, y);
    return t === TILE_SAND || t === TILE_GRASS || t === TILE_FOREST || t === TILE_HILL;
  }

  isWalkable(x, y) { return this.isLand(x, y) && knownAt(this, x, y); }

  feetDry(x0, y0, x1, y1) {
    const span = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.ceil(span * 2));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = Math.round(x0 + (x1 - x0) * t);
      const y = Math.round(y0 + (y1 - y0) * t);
      if (!this.isWalkable(x, y)) return false;
    }
    return true;
  }

  isGrass(x, y) {
    return this.tileAt(x, y) === TILE_GRASS;
  }

  generateIsland() {
    paintMap(this);
  }

  touchesWater(x, y) {
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of near) {
      const t = this.tileAt(x + dx, y + dy);
      if (t === TILE_DEEP || t === TILE_WATER || t === TILE_SHALLOW) return true;
    }
    return false;
  }

  scatterFood() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const t = this.tileAt(x, y);
        if ((t === TILE_GRASS || t === TILE_FOREST) && Math.random() < 0.03) {
          this.food.set(`${x},${y}`, { amount: 10 + Math.random() * 8, cap: 18 });
        }
      }
    }
    const camp = pickCamp(this);
    for (let y = camp.y - 6; y <= camp.y + 6; y++) {
      for (let x = camp.x - 6; x <= camp.x + 6; x++) {
        if (!this.isGrass(x, y) || Math.random() > 0.45) continue;
        this.food.set(`${x},${y}`, { amount: 12 + Math.random() * 6, cap: 18 });
      }
    }
  }

  nearestFood(x, y, vision) {
    return foodNear(this, x, y, vision);
  }

  consumeFood(key, amount) {
    const spot = this.food.get(key);
    if (!spot) return 0;
    const taken = Math.min(spot.amount, amount);
    spot.amount -= taken;
    return taken;
  }

  canBuild(x, y) {
    if (!this.isGrass(x, y) || !knownAt(this, x, y)) return false;
    if (this.food.has(`${x},${y}`)) return false;
    if ((this.fields || []).some((f) => f.x === x && f.y === y)) return false;
    for (const h of this.houses) {
      if (Math.hypot(h.x - x, h.y - y) < plotGap(this.culture)) return false;
    }
    return true;
  }

  countHousesNear(x, y, radius) {
    let n = 0;
    for (const h of this.houses) {
      if (Math.hypot(h.x - x, h.y - y) <= radius) n += 1;
    }
    return n;
  }

  findHouseSite(ax, ay) {
    if (this.houses.length >= 36 * (this.charts || 1)) return null;
    const r = 6;
    let best = null;
    let bestD = Infinity;
    const x0 = Math.round(ax);
    const y0 = Math.round(ay);
    for (let y = y0 - r; y <= y0 + r; y++) {
      for (let x = x0 - r; x <= x0 + r; x++) {
        if (!this.canBuild(x, y)) continue;
        const d = Math.hypot(x - ax, y - ay);
        if (d <= r && d < bestD) {
          bestD = d;
          best = { x, y };
        }
      }
    }
    return best;
  }

  addHouse(x, y, ownerId) {
    const house = { x, y, ownerId, progress: 0, pieces: [], mass: 0 };
    this.houses.push(house);
    return house;
  }

  randomLandTile() {
    for (let tries = 0; tries < 700; tries++) {
      const x = Math.floor(Math.random() * this.cols);
      const y = Math.floor(Math.random() * this.rows);
      if (this.isWalkable(x, y)) return { x, y };
    }
    return { x: Math.floor(this.cols / 2), y: Math.floor(this.rows / 2) };
  }

  randomGrassTile() {
    return nearCamp(this);
  }
}
