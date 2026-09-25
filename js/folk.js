// Родство, вынашивание, добыча домой, роль у очага.

import { remember, SKILL_KEYS } from "./skills.js";
import { digest } from "./metabol.js";

export function bloodClose(a, b) {
  if (!a || !b) return false;
  if (a.parents && a.parents.includes(b.id)) return true;
  if (b.parents && b.parents.includes(a.id)) return true;
  if (a.parents && b.parents && a.parents.some((id) => b.parents.includes(id))) return true;
  return false;
}

export function startBelly(woman, man) {
  if (woman.belly) return;
  woman.belly = { left: 20, fatherId: man.id };
  woman.activity = "носит ребёнка";
}

export function tickBelly(agent) {
  if (!agent.belly) return false;
  agent.belly.left -= 1;
  agent.hunger = Math.min(100, agent.hunger + 0.15);
  if (agent.belly.left > 0) {
    agent.activity = "носит ребёнка";
    return false;
  }
  return true;
}

export function birthStrike(agent) {
  const thin = agent.body && agent.body.limit < 0.22 ? 0.07 : 0;
  const risk = 0.03 + thin + (1 - (agent.traits.immunity || 0.5)) * 0.05;
  if (Math.random() >= risk) return false;
  agent.alive = false;
  agent.causeOfDeath = "роды";
  agent.activity = "умерла в родах";
  agent.belly = null;
  return true;
}

export function stash(agent, amount) {
  if (!agent.house || amount < 8) return;
  agent.basket = Math.min(40, (agent.basket || 0) + amount * 0.45);
  agent.haul = true;
}

export function wantHaul(agent) {
  return agent.haul && agent.basket >= 4 && agent.house && agent.distanceTo(agent.house) > 1.1;
}

export function feedHearth(agent, neighbors) {
  if (!agent.house || agent.distanceTo(agent.house) > 1.3) return false;
  if ((agent.basket || 0) < 1) {
    agent.haul = false;
    return false;
  }
  let fed = false;
  for (const other of neighbors) {
    if (!other.alive || other === agent || other.hunger < 28) continue;
    if (!kinHome(agent, other)) continue;
    const bite = Math.min(agent.basket, 8, other.hunger);
    digest(other, agent.basketKind || "meat", bite / 10);
    agent.basket -= bite;
    fed = true;
    if (agent.basket < 1) break;
  }
  agent.activity = fed ? "кормит своих у дома" : "принёс добычу домой";
  agent.haul = agent.basket >= 4;
  return true;
}

function kinHome(agent, other) {
  if (other.parents && other.parents.includes(agent.id)) return true;
  if (agent.partnerId === other.id) return true;
  if (agent.parents && other.parents && agent.parents.some((id) => other.parents.includes(id))) return true;
  return false;
}

export function bestCraft(agent) {
  let key = null;
  let best = 0.4;
  for (const name of SKILL_KEYS) {
    if (name === "places") continue;
    if ((agent.skills[name] || 0) > best) {
      best = agent.skills[name];
      key = name;
    }
  }
  return key;
}

export function elderWear(agent, stage) {
  if (stage !== "elder") return;
  const keep = bestCraft(agent);
  for (const name of SKILL_KEYS) {
    if (name === keep || name === "places") continue;
    agent.skills[name] = Math.max(0, (agent.skills[name] || 0) - 0.01);
  }
  if (keep) agent.drill = keep;
}

export function showGround(agent, parent) {
  const spots = parent.places || [];
  if (!spots.length) return;
  let best = spots[0];
  for (const spot of spots) if ((spot.worth || 0) > (best.worth || 0)) best = spot;
  remember(agent, best.kind, best.x, best.y, 0.85);
}
