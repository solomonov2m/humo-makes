// Вклад в открытие даёт только живой поступок, не цифра навыка.

export function deedGain(agent, neighbors, world, culture, step) {
  if (step.mind && agent.mind < step.mind) return 0;
  const seen = neighbors.filter((n) => n.alive);
  const adults = seen.filter((n) => n.isAdult);
  const home = agent.house;
  const housed = home && home.progress >= 1;
  switch (step.deed) {
    case "hearth":
      return agent.activity === "ест" && adults.length ? 1 : 0;
    case "hands":
      return agent.state === "gather" || agent.state === "seek_food" ? 0.4 : 0;
    case "shelter":
      return housed && agent.distanceTo(home) < 2.2 ? 0.5 : 0;
    case "talk":
      return agent.activity && agent.activity.startsWith("учится у") ? 0.45 : 0;
    case "band":
      return agent.state === "hunt" && seen.some((n) => n.state === "hunt" || n.state === "seek_food") ? 0.55 : 0;
    case "clay":
      return agent.state === "build" || agent.drill === "craft" ? 0.35 : 0;
    case "field":
      return agent.state === "farm" ? 0.7 : 0;
    case "herd":
      return agent.state === "herd" || seen.some((n) => n.parents && n.parents.includes(agent.id)) ? 0.4 : 0;
    case "wheel":
      return (culture.paths || 0) >= 8 && (agent.state === "wander" || agent.state === "seek_food") ? 0.22 : 0;
    case "metal":
      return agent.drill === "craft" && housed ? 0.28 : 0;
    case "mark":
      return agent.children > 0 && adults.length >= 2 ? 0.25 : 0;
    case "iron":
      return agent.state === "build" && home && home.kind === "house" ? 0.4 : 0;
    case "gear":
      return agent.state === "build" && peers(adults, agent) ? 0.22 : 0;
    case "press":
      return seen.some((n) => !n.isAdult && (n.known || 0) >= 8) ? 0.3 : 0;
    case "ask":
      return agent.drill && peers(adults, agent) ? 0.22 : 0;
    case "steam":
      return agent.drill === "craft" && housed && peers(adults, agent) ? 0.2 : 0;
    case "spark":
      return agent.drill === "craft" && housed && agent.skills.craft >= 2 && peers(adults, agent) ? 0.18 : 0;
    case "radio":
      return adults.length >= 2 && peers(adults, agent) ? 0.16 : 0;
    case "compute":
      return agent.drill === "craft" && peers(adults, agent) ? 0.16 : 0;
    case "net":
      return 0;
    default:
      return 0;
  }
}

function peers(adults, agent) {
  return adults.some((n) => (n.known || 0) >= agent.known);
}
