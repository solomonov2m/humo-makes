// Сезон задаёт воздух. Болезнь берёт возраст и голод тела, не календарную приписку.

export function seasonName(day) {
  const part = Math.floor((day % 40) / 10);
  return ["весна", "лето", "осень", "зима"][part];
}

export function ail(agent) {
  const span = agent.traits.lifespanDays || 200;
  const late = agent.age / span;
  if (late < 0.72 && agent.hunger < 82) return false;
  let chance = late > 0.72 ? (late - 0.72) * 0.015 : 0;
  if (agent.hunger > 82) chance += 0.008;
  chance *= 1.25 - (agent.traits.immunity || 0.5);
  if (Math.random() >= chance) return false;
  agent.alive = false;
  const worn = agent.hunger <= 82;
  agent.causeOfDeath = worn ? "старость" : "истощение";
  agent.activity = worn ? "тело не выдержало" : "ослабел от голода";
  return true;
}
