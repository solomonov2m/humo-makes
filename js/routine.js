import { PHASE } from "./clock.js";
import { STATE } from "./states.js";

const THINK_EVERY = 8;

export function followRoutine(agent, world, neighbors, animals, hooks, phase) {
  decide(agent, world, neighbors, animals, phase);
  act(agent, world, animals, hooks);
}

function decide(agent, world, neighbors, animals, phase) {
  if (!agent.alive) return;
  const changed = agent.phaseSeen !== phase;
  agent.phaseSeen = phase;
  agent.thinkIn -= 1;
  const busy = agent.state !== STATE.FORAGE && agent.state !== STATE.WAKE;
  if (!changed && agent.thinkIn > 0 && busy) return;
  agent.thinkIn = THINK_EVERY;

  const home = agent.home(world);
  const homePt = { x: home.x, y: home.y };
  const dying = agent.thirst > 78 || agent.hunger > 88;

  if (phase === PHASE.NIGHT && !dying) {
    agent.state = STATE.SLEEP;
    agent.target = homePt;
    return;
  }
  if (phase === PHASE.DUSK && !dying) {
    agent.state = STATE.SEEK_CAMP;
    agent.target = homePt;
    return;
  }
  if (phase === PHASE.DAWN && !dying) {
    agent.state = STATE.WAKE;
    agent.target = homePt;
    return;
  }

  const roam = 1.4 + (1 - agent.traits.sociability) * 2.8;
  const distHome = Math.hypot(agent.x - home.x, agent.y - home.y);

  if (agent.thirst > 58) {
    const spot = world.nearestDrink(agent.x, agent.y);
    agent.state = STATE.SEEK_WATER;
    agent.target = spot ? { x: spot.x, y: spot.y } : { x: home.shore.x, y: home.shore.y };
    return;
  }
  if (agent.hunger > 52) {
    const prey = nearestAnimal(agent, animals, agent.traits.vision);
    const berry = world.nearestBerry(agent.x, agent.y, agent.traits.vision);
    if (prey && (!berry || agent.distanceTo(prey) < Math.hypot(berry.x - agent.x, berry.y - agent.y))) {
      agent.state = STATE.HUNT;
      agent.target = prey;
      return;
    }
    const bush = berry;
    agent.state = STATE.SEEK_FOOD;
    agent.target = bush ? { x: bush.x, y: bush.y, key: bush.key } : null;
    return;
  }
  if (agent.energy < 22) {
    agent.state = STATE.REST;
    agent.restLeft = 10;
    agent.target = homePt;
    return;
  }
  if (distHome > roam + 0.4) {
    agent.state = STATE.SEEK_CAMP;
    agent.target = homePt;
    return;
  }
  if (agent.isAdult && agent.matingCooldown <= 0 && agent.hunger < 45 && agent.thirst < 45 && agent.energy > 40) {
    const partner = agent.findPartner(neighbors);
    if (partner) {
      agent.state = STATE.SEEK_MATE;
      agent.target = { agent: partner };
      return;
    }
  }
  agent.state = STATE.FORAGE;
  agent.target = null;
}

function act(agent, world, animals, hooks) {
  const home = agent.home(world);
  const homePt = { x: home.x, y: home.y };
  switch (agent.state) {
    case STATE.SEEK_WATER:
      agent.pursue(agent.target, world);
      if (agent.target && agent.distanceTo(agent.target) < 0.65) {
        agent.thirst = Math.max(0, agent.thirst - 55);
        agent.energy = Math.min(100, agent.energy + 6);
        hooks.onDrink(agent);
        agent.state = STATE.SEEK_CAMP;
        agent.target = homePt;
      }
      break;
    case STATE.SEEK_FOOD:
      agent.pursue(agent.target, world);
      if (agent.target && agent.distanceTo(agent.target) < 0.6) {
        const taken = world.consumeBerry(agent.target.key, 2 + agent.traits.strength);
        agent.hunger = Math.max(0, agent.hunger - taken * 6);
        agent.energy = Math.min(100, agent.energy + 4);
        if (taken > 0) hooks.onEat(agent, "ягоды");
        agent.state = STATE.SEEK_CAMP;
        agent.target = homePt;
      }
      break;
    case STATE.HUNT: {
      const prey = agent.target;
      if (!prey || !prey.alive) {
        agent.state = STATE.SEEK_FOOD;
        break;
      }
      agent.pursue(prey, world);
      if (agent.distanceTo(prey) < 0.7) {
        prey.alive = false;
        agent.hunger = Math.max(0, agent.hunger - 38 - agent.traits.strength * 6);
        agent.energy = Math.max(0, agent.energy - 8);
        hooks.onEat(agent, "добычу");
        agent.state = STATE.SEEK_CAMP;
        agent.target = homePt;
      }
      break;
    }
    case STATE.SEEK_MATE: {
      const partner = agent.target?.agent;
      if (!partner || !partner.alive) {
        agent.state = STATE.FORAGE;
        break;
      }
      agent.pursue(partner, world);
      if (agent.distanceTo(partner) < 0.75) agent.tryMate(partner, world, hooks.onBirth);
      break;
    }
    case STATE.REST:
      agent.restLeft -= 1;
      agent.energy = Math.min(100, agent.energy + 1.4);
      agent.pursue(homePt, world, 0.04);
      if (agent.restLeft <= 0 || agent.energy > 55) agent.state = STATE.FORAGE;
      break;
    case STATE.SLEEP:
      if (Math.hypot(agent.x - home.x, agent.y - home.y) > 1.05) {
        agent.pursue(homePt, world, agent.traits.speed * 0.4);
      }
      break;
    case STATE.WAKE:
      wander(agent, world, home, 0.7, agent.traits.speed * 0.25);
      break;
    case STATE.SEEK_CAMP:
      agent.pursue(homePt, world);
      if (Math.hypot(agent.x - home.x, agent.y - home.y) < 1.3) agent.state = STATE.FORAGE;
      break;
    case STATE.FORAGE:
    default:
      wander(agent, world, home, 1.3 + (1 - agent.traits.sociability) * 2.4, agent.traits.speed * 0.55);
      break;
  }
}

function wander(agent, world, home, roam, pace) {
  agent.wanderTimer -= 1;
  const far = agent.wanderDest && Math.hypot(agent.wanderDest.x - home.x, agent.wanderDest.y - home.y) > roam;
  if (!agent.wanderDest || agent.wanderTimer <= 0 || far) {
    agent.wanderDest = world.randomNear(home.x, home.y, roam);
    agent.wanderTimer = 14 + Math.random() * 20;
  }
  agent.pursue(agent.wanderDest, world, pace);
}

function nearestAnimal(self, animals, radius) {
  let best = null;
  let bestDist = radius;
  for (const animal of animals) {
    if (!animal.alive) continue;
    const d = Math.hypot(self.x - animal.x, self.y - animal.y);
    if (d < bestDist) {
      bestDist = d;
      best = animal;
    }
  }
  return best;
}
