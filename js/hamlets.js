// Дома, стоящие рядом, складываются в одно поселение.

const LINK = 9;

function familyOf(house) {
  const parts = String(house.maker || "").trim().split(/\s+/);
  return parts[parts.length - 1] || "без имени";
}

function groupsOf(houses) {
  const parent = houses.map((_, i) => i);
  const find = (i) => {
    while (parent[i] !== i) i = parent[i];
    return i;
  };
  const join = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };
  for (let i = 0; i < houses.length; i++) {
    for (let j = i + 1; j < houses.length; j++) {
      const a = houses[i];
      const b = houses[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) <= LINK) join(i, j);
    }
  }
  const bags = new Map();
  houses.forEach((house, i) => {
    const root = find(i);
    if (!bags.has(root)) bags.set(root, []);
    bags.get(root).push(house);
  });
  return [...bags.values()];
}

function dwellers(agents, houses) {
  let sx = 0;
  let sy = 0;
  for (const house of houses) {
    sx += house.x;
    sy += house.y;
  }
  const cx = sx / houses.length;
  const cy = sy / houses.length;
  let far = 0;
  for (const house of houses) far = Math.max(far, Math.hypot(house.x - cx, house.y - cy));
  const reach = far + 6;
  return agents.filter((agent) => agent.alive && Math.hypot(agent.x - cx, agent.y - cy) <= reach).length;
}

export function listHamlets(world, agents) {
  const houses = world.houses || [];
  if (!houses.length) return [];
  const hamlets = groupsOf(houses).map((group) => {
    const oldest = group.reduce((best, house) => (
      houses.indexOf(house) < houses.indexOf(best) ? house : best
    ));
    let sx = 0;
    let sy = 0;
    for (const house of group) {
      sx += house.x;
      sy += house.y;
    }
    const ready = group.filter((house) => house.progress >= 1).length;
    return {
      key: `${oldest.x},${oldest.y}`,
      family: familyOf(oldest),
      x: sx / group.length,
      y: sy / group.length,
      homes: group.length,
      ready,
      people: dwellers(agents, group),
    };
  });
  const seen = new Map();
  for (const hamlet of hamlets) seen.set(hamlet.family, (seen.get(hamlet.family) || 0) + 1);
  for (const hamlet of hamlets) {
    hamlet.title = seen.get(hamlet.family) > 1
      ? `${hamlet.family}, ${Math.round(hamlet.x)}`
      : hamlet.family;
  }
  hamlets.sort((a, b) => b.people - a.people || b.homes - a.homes);
  return hamlets;
}
