// Навык растёт только от сделанного дела. Ребёнок рождается пустым.

export const SKILL_KEYS = ["food", "water", "hunt", "fish", "farm", "craft", "raft", "places"];

export function skillBand(level) {
  if (level < 0.35) return "none";
  if (level < 1.7) return "learn";
  if (level < 3.1) return "got";
  if (level < 4.3) return "good";
  return "master";
}

export function blankSkills() {
  const skills = {};
  for (const key of SKILL_KEYS) skills[key] = 0;
  return skills;
}

export function practice(agent, key, amount) {
  if (agent.skills[key] == null) return;
  agent.skills[key] = Math.min(5, agent.skills[key] + amount);
  agent.drill = key;
}

export function remember(agent, kind, x, y, gain = 1) {
  if (!agent.places) agent.places = [];
  const rx = Math.round(x);
  const ry = Math.round(y);
  const key = `${kind}:${rx},${ry}`;
  const found = agent.places.find((p) => p.key === key);
  if (found) {
    found.worth = Math.min(6, (found.worth || 1) + gain);
    return;
  }
  agent.places.push({ key, kind, x: rx, y: ry, worth: gain });
  if (agent.places.length > 14) agent.places.shift();
  if (gain >= 1) practice(agent, "places", 0.07);
}

export function recall(agent, kind) {
  if (!agent.places) return null;
  let best = null;
  let bestScore = Infinity;
  for (const spot of agent.places) {
    if (kind && spot.kind !== kind) continue;
    const dist = Math.hypot(spot.x - agent.x, spot.y - agent.y);
    const score = dist / (0.35 + (spot.worth || 1));
    if (score < bestScore) {
      bestScore = score;
      best = spot;
    }
  }
  return best;
}
