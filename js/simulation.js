import { World } from "./world.js";
import { Agent } from "./agent.js";
import { skillBand, SKILL_KEYS } from "./skills.js";
import { spawnAnimals } from "./animal.js";
import { Genome } from "./genome.js";
import { ADULT_DAYS } from "./text.js";
import { Clock } from "./clock.js";
import { countRoads, decayWear } from "./roads.js";
import { houseTechKnown, prepareWood, regrowWood, tallyDwellings } from "./housing.js";
import { advanceLore, freshCulture, loreView } from "./lore.js";
import { eraView } from "./era.js";
import { canHerd, tendFields } from "./civ.js";
import { cropCensus, growFields } from "./farm.js";
import { breedAnimals, leanWinter } from "./press.js";
import { emerge } from "./emerge.js";
import { seedGround } from "./nature.js";
import { resetLineages } from "./names.js";
import { muse } from "./ideas.js";
import { practiceContact } from "./contact.js";
import { layRot } from "./rot.js";
import { weave } from "./weave.js";
import { pressChart } from "./chart.js";

const START_POPULATION = 100;

export class Simulation {
  constructor() {
    this.clock = new Clock();
    this.bank = 0;
    this.day = 0;
    this.births = 0;
    this.deaths = 0;
    this.reset();
  }
  reset() {
    const speedIndex = this.clock ? this.clock.speedIndex : 0;
    resetLineages();
    this.world = new World();
    this.agents = [];
    this.day = 0;
    this.births = 0;
    this.deaths = 0;
    this.bank = 0;
    this.clock = new Clock();
    this.clock.setSpeed(speedIndex);
    this.culture = freshCulture();
    this.world.culture = this.culture;
    prepareWood(this.world);
    seedGround(this.world);
    this.world.animals = spawnAnimals(this.world, 22);
    this.world.rafts = [];
    this.genesisGenomes = Array.from({ length: START_POPULATION }, () => Genome.random());
    for (let i = 0; i < START_POPULATION; i++) {
      const genome = this.genesisGenomes[i];
      const life = genome.derive().lifespanDays;
      const span = Math.max(30, life - ADULT_DAYS - 20);
      const age = ADULT_DAYS + Math.floor(Math.random() * span * 0.42);
      this.agents.push(new Agent(this.world, { genome, age }));
    }
    const byId = new Map(this.agents.map((agent) => [agent.id, agent]));
    for (const agent of this.agents) agent.decide(this.world, this.neighborsOf(agent, agent.traits.vision), byId);
  }

  neighborsOf(agent, radius) {
    const list = [];
    for (const other of this.agents) {
      if (other === agent || !other.alive) continue;
      if (agent.distanceTo(other) <= radius) list.push(other);
    }
    return list;
  }

  tick() {
    this.day += 1;
    this.world.day = this.day;
    this.world.regrowFood();
    pressChart(this.world);
    leanWinter(this.world, this.day);
    tendFields(this.world);
    growFields(this.world);
    breedAnimals(this.world, canHerd(this.culture) ? 16 : 10);
    const hunters = this.agents.filter((a) => a.alive && a.state === "hunt");
    for (const beast of this.world.animals) beast.step(this.world, hunters, "day");
    regrowWood(this.world);
    decayWear(this.world);
    const worn = countRoads(this.world);
    this.culture.paths = worn.trails + worn.roads;
    this.culture.warm = null;
    layRot(this.agents, this.world);
    weave(this.world, this.agents);
    const byId = new Map(this.agents.map((a) => [a.id, a]));
    const born = [];

    for (const agent of this.agents) {
      if (!agent.alive) continue;
      const neighbors = this.neighborsOf(agent, agent.traits.vision);
      agent.step(this.world, neighbors, (child) => born.push(child), byId);
      if (agent.alive && agent.state === "wander" && agent.hunger < 55 && Math.random() < 0.04) muse(agent, this.world);
      if (agent.alive && agent.state === "wander" && agent.hunger < 62 && Math.random() < 0.08) practiceContact(agent, this.world);
      advanceLore(agent, neighbors, this.culture, this.world);
    }
    emerge(this.culture, this.agents, this.world);

    for (const agent of this.agents) {
      if (!agent.alive && !agent.deathCounted) {
        this.deaths += 1;
        agent.deathCounted = true;
      }
    }

    if (born.length) {
      this.agents.push(...born);
      this.births += born.length;
    }

    if (this.agents.length > 4000) {
      this.agents = this.agents.filter((a) => a.alive);
    }
  }

  report() {
    const byId = new Map(this.agents.map((a) => [a.id, a]));
    const alive = this.agents.filter((a) => a.alive);
    const adults = alive.filter((a) => a.isAdult);
    const children = alive.length - adults.length;
    const males = alive.filter((a) => a.sex === "M").length;
    const built = tallyDwellings(this.world.houses);
    const homes = built.homes;
    const building = built.building;

    let families = 0;
    for (const a of alive) {
      if (!a.partnerId || a.id > a.partnerId) continue;
      const p = byId.get(a.partnerId);
      if (p && p.alive) families += 1;
    }

    let masters = 0;
    let learners = 0;
    for (const a of alive) {
      let good = false;
      let learning = false;
      for (const key of SKILL_KEYS) {
        const band = skillBand(a.skills[key]);
        if (band === "good" || band === "master") good = true;
        if (band === "learn" || band === "got") learning = true;
      }
      if (good) masters += 1;
      else if (learning) learners += 1;
    }

    const mind = alive.length
      ? alive.reduce((s, a) => s + a.mind, 0) / alive.length
      : 0;

    const era = eraView(this.culture);

    return {
      day: this.day,
      population: alive.length,
      adults: adults.length,
      children,
      males,
      females: alive.length - males,
      births: this.births,
      deaths: this.deaths,
      homes,
      shelters: built.shelters,
      cottages: built.houses,
      housingTech: houseTechKnown(this.culture),
      building,
      roads: countRoads(this.world),
      families,
      masters,
      learners,
      mind,
      eraName: era.eraName,
      eraBlurb: era.eraBlurb,
      goalText: era.goalText,
      meter: era.meter,
      finished: era.finished,
      stages: era.stages,
      lore: loreView(this.culture),
      arts: this.culture.arts || [],
      crops: cropCensus(this.world),
    };
  }
}
