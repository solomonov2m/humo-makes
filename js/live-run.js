// Ход острова на сервере: 1 реальная секунда = 1 игровой час. Браузер только читает сводку.

import { writeFileSync } from "node:fs";
import { Simulation } from "./simulation.js";
import { pumpDays } from "./pace.js";

const out = process.argv[2] || "/var/www/make/live.json";
const sim = new Simulation();
sim.clock.setSpeed(2);

function snap() {
  const report = sim.report();
  const lore = report.lore || {};
  const body = JSON.stringify({
    day: report.day,
    hour: Math.floor((sim.clock.progress || 0) * 24),
    population: report.population,
    adults: report.adults,
    children: report.children,
    births: report.births,
    deaths: report.deaths,
    homes: report.homes,
    era: report.eraName,
    blurb: report.eraBlurb,
    ideas: lore.found || [],
    tongue: lore.tongue || "",
    updated: new Date().toISOString(),
  });
  writeFileSync(out, body);
}

function loop() {
  const started = Date.now();
  for (let i = 0; i < 20; i += 1) pumpDays(sim, 0.05);
  snap();
  const wait = Math.max(0, 1000 - (Date.now() - started));
  setTimeout(loop, wait);
}

snap();
loop();
