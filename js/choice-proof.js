// Прогон трёх жителей: одинаковое тело, разное состояние, разный ход.

import { World } from "./world.js";
import { Agent } from "./agent.js";
import { Genome } from "./genome.js";
import { ensureNerve } from "./nerves.js";
import { choiceLine } from "./choice-log.js";

export function proveChoices() {
  const world = new World(7);
  const spot = grass(world);
  world.food = new Map();
  world.animals = [];
  world.food.set(`${spot.x + 1},${spot.y}`, { amount: 14, cap: 18 });
  const genome = Genome.random();
  const hungry = person(world, genome, spot, 4200, 0);
  const tired = person(world, genome, { x: spot.x + 8, y: spot.y }, 9000, 3);
  const scared = person(world, genome, { x: spot.x + 16, y: spot.y }, 6100, 6);
  hungry.body.store.glucose = 0.05;
  hungry.body.store.fat = 0.4;
  hungry.energy = 70;
  const wolf = { alive: true, x: scared.x + 0.6, y: scared.y, kind: { id: "wolf", name: "волк" } };
  world.animals = [wolf];
  const nerve = ensureNerve(tired);
  nerve.pressure = 0.96;
  nerve.urge = 0.94;
  nerve.awakeHours = 19;
  tired.energy = 12;
  for (const agent of [hungry, tired, scared]) agent.decide(world, [], new Map());
  const first = [hungry, tired, scared].map((agent) => agent.choice.chosen);
  const slept = first.every((act) => act === "sleep");
  const firstLines = [hungry, tired, scared].map(choiceLine);
  const before = hungry.choice.chosen;
  swapInsides(hungry, tired);
  wolf.x = 0;
  wolf.y = 0;
  hungry.decide(world, [], new Map());
  tired.decide(world, [], new Map());
  const changed = hungry.choice.chosen !== before && tired.choice.chosen !== first[1];
  return {
    ok: !slept && changed && new Set(first).size > 1,
    first,
    after: [hungry.choice.chosen, tired.choice.chosen, scared.choice.chosen],
    lines: firstLines.concat([hungry, tired, scared].map(choiceLine)),
  };
}

function person(world, genome, spot, age, salt) {
  for (let i = 0; i < salt; i++) Math.random();
  const agent = new Agent(world, { genome, x: spot.x, y: spot.y, age });
  ensureNerve(agent);
  agent.nerve.pressure = 0.12 + salt * 0.02;
  agent.nerve.urge = 0.1;
  return agent;
}

function swapInsides(a, b) {
  const store = a.body.store;
  a.body.store = b.body.store;
  b.body.store = store;
  const nerve = a.nerve;
  a.nerve = b.nerve;
  b.nerve = nerve;
  const energy = a.energy;
  a.energy = b.energy;
  b.energy = energy;
}

function grass(world) {
  for (let y = 2; y < world.rows - 2; y++) {
    for (let x = 2; x < world.cols - 2; x++) {
      if (world.isGrass(x, y)) return { x, y };
    }
  }
  return { x: 4, y: 4 };
}

const isMain = typeof process !== "undefined" && process.argv[1] && process.argv[1].includes("choice-proof");
if (isMain) {
  const report = proveChoices();
  console.log(JSON.stringify({ ok: report.ok, first: report.first, after: report.after }, null, 2));
  for (const line of report.lines) console.log(line);
  if (!report.ok) process.exitCode = 1;
}
