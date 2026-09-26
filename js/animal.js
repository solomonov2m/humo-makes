import { TILE, TILE_FOREST, TILE_GRASS, TILE_HILL } from "./world.js";
import { METERS_PER_TILE } from "./measure.js";
import { phaseOf } from "./clock.js";
import { pickBeast } from "./nature.js";
import { hungerAim, liveBeast } from "./beast.js";

const GAIT = { hare: 1.6, bird: 0.9, deer: 1.1, boar: 0.85, wolf: 1.35, goat: 0.8 };

let NEXT_ANIMAL = 1;

export class Animal {
  constructor(world, x, y, kind) {
    this.id = NEXT_ANIMAL++;
    this.kind = kind || pickBeast(world, x, y);
    this.name = this.kind.name;
    this.meat = this.kind.meat;
    this.color = this.kind.color;
    this.x = x;
    this.y = y;
    this.alive = true;
    this.wanderTimer = 0;
    this.dest = null;
    this.fleeing = false;
  }

  step(world) {
    if (!this.alive) return;
    liveBeast(this, world);
  }

  drift(world, hunters, gameSeconds, dayFraction) {
    if (!this.alive || gameSeconds <= 0 || phaseOf(dayFraction) === "night") return;
    const threat = nearest(this, hunters, 6);
    let aim = null;
    let speed = GAIT[this.kind && this.kind.id] || 1;
    if (threat) {
      this.fleeing = true;
      const dx = this.x - threat.x;
      const dy = this.y - threat.y;
      const dist = Math.hypot(dx, dy) || 1;
      aim = { x: this.x + (dx / dist) * 4, y: this.y + (dy / dist) * 4 };
      speed *= 2.2;
    } else {
      this.fleeing = false;
      const food = hungerAim(this, world);
      if (food && fits(world, this, food.x, food.y)) {
        aim = food;
        speed *= 1.25;
      } else aim = this.holdCourse(world, gameSeconds);
    }
    this.stepToward(world, aim, speed * gameSeconds / METERS_PER_TILE);
  }

  holdCourse(world, gameSeconds) {
    this.wanderTimer = (this.wanderTimer || 0) - gameSeconds;
    if (!this.dest || this.wanderTimer <= 0 || !fits(world, this, this.dest.x, this.dest.y)) {
      this.dest = graze(world, this);
      this.wanderTimer = 40 + Math.random() * 90;
    }
    return this.dest;
  }

  stepToward(world, aim, tiles) {
    if (!aim || tiles <= 0) return;
    const dx = aim.x - this.x;
    const dy = aim.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.2) return;
    const step = Math.min(tiles, dist);
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    const ok = this.fleeing ? world.isWalkable(Math.round(nx), Math.round(ny)) : fits(world, this, nx, ny);
    if (ok) {
      this.x = nx;
      this.y = ny;
    } else this.dest = null;
  }

  tryMove(world, nx, ny) {
    const ok = this.fleeing ? world.isWalkable(Math.round(nx), Math.round(ny)) : fits(world, this, nx, ny);
    if (ok) {
      this.x = nx;
      this.y = ny;
    }
  }
}

function fits(world, beast, x, y) {
  const tile = world.tileAt(Math.round(x), Math.round(y));
  const where = beast.kind && beast.kind.where;
  if (where === "forest") return tile === TILE_FOREST;
  if (where === "hill") return tile === TILE_HILL;
  if (where === "grass") return tile === TILE_GRASS;
  return world.isWalkable(Math.round(x), Math.round(y));
}

function graze(world, beast) {
  for (let n = 0; n < 8; n++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 0.8 + Math.random() * 2.2;
    const x = beast.x + Math.cos(ang) * dist;
    const y = beast.y + Math.sin(ang) * dist;
    if (fits(world, beast, x, y)) return { x, y };
  }
  return { x: beast.x, y: beast.y };
}

function nearest(self, list, radius) {
  let best = null, bestDist = radius;
  for (const other of list) {
    const d = Math.hypot(self.x - other.x, self.y - other.y);
    if (d < bestDist) { bestDist = d; best = other; }
  }
  return best;
}

export function spawnAnimals(world, count, kind) {
  const animals = [];
  for (let i = 0; i < count; i++) {
    const spot = world.camp ? world.randomGrassTile() : world.randomLandTile();
    const born = kind || pickBeast(world, spot.x, spot.y);
    animals.push(new Animal(world, spot.x, spot.y, born));
  }
  return animals;
}

export function restockAnimals(world, floor = 10) {
  const left = (world.animals || []).filter((a) => a.alive).length;
  if (left >= floor) return;
  const born = spawnAnimals(world, floor - left);
  world.animals.push(...born);
}

export function drawAnimals(ctx, world) {
  for (const beast of world.animals || []) {
    if (!beast.alive && !(beast.gas > 20)) continue;
    ctx.save();
    if (!beast.alive) ctx.globalAlpha = 0.65;
    const px = beast.x * TILE + TILE / 2;
    const py = beast.y * TILE + TILE / 2;
    const scale = ctx.getTransform().a;
    const body = Math.max(1.6 / METERS_PER_TILE, 11 / Math.max(scale, 1));
    ctx.fillStyle = beast.alive ? (beast.color || "#6a4a32") : "#5c5348";
    ctx.beginPath();
    ctx.ellipse(px - body * 0.15, py, body, body * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + body * 0.7, py - body * 0.15, body * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (const raft of world.rafts || []) {
    const px = raft.x * TILE + TILE / 2;
    const py = raft.y * TILE + TILE / 2;
    const w = 4 / METERS_PER_TILE;
    ctx.strokeStyle = "#8a6238";
    ctx.lineWidth = Math.max(w * 0.08, 0.01);
    ctx.strokeRect(px - w / 2, py - w * 0.15, w, w * 0.3);
  }
}
