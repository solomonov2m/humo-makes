// Кусок ложится туда, куда дошли руки. Держится он, только если опора тянет его вес.

const COVER_MASS = 9;

export function freshStack(x, y, ownerId) {
  return { x, y, ownerId, pieces: [], mass: 0, progress: 0, need: "холодно" };
}

export function coverOf(stack) {
  if (!stack || !stack.pieces) return 0;
  let shade = 0;
  for (const piece of stack.pieces) {
    if (!piece.held) continue;
    shade += (piece.grams || 0) * warmth(piece.id);
  }
  return Math.min(1, shade / COVER_MASS);
}

export function layPiece(stack, agent) {
  const pocket = agent.pocket;
  if (!stack || !pocket || pocket.grams <= 0) return false;
  const spot = seat(stack, agent, pocket);
  stack.pieces.push(spot);
  stack.mass = (stack.mass || 0) + pocket.grams;
  stack.progress = coverOf(stack);
  agent.pocket = null;
  agent.wood = 0;
  agent.activity = spot.held
    ? `положил ${pocket.name}, кусок держится`
    : `положил ${pocket.name}, кусок съехал`;
  return true;
}

export function stackLine(stack) {
  if (!stack || !stack.pieces || !stack.pieces.length) return "площадка без кусков";
  const names = {};
  let slipped = 0;
  for (const piece of stack.pieces) {
    names[piece.name || piece.id] = (names[piece.name || piece.id] || 0) + 1;
    if (!piece.held) slipped += 1;
  }
  const body = Object.entries(names).map(([name, n]) => `${n} ${name}`).join(", ");
  return slipped ? `${body}, съехало ${slipped}` : body;
}

function seat(stack, agent, pocket) {
  let dx = clamp(agent.x - stack.x, -0.45, 0.45);
  let dy = clamp(agent.y - stack.y, -0.45, 0.45);
  const under = supportAt(stack, dx, dy);
  let held = !under || bears(under, pocket);
  if (!held) {
    dx = clamp(dx + 0.22, -0.55, 0.55);
    dy = clamp(dy + 0.16, -0.55, 0.55);
    held = false;
  }
  return { id: pocket.id, name: pocket.name, grams: pocket.grams, density: pocket.density, hardness: pocket.hardness, dx, dy, held };
}

function supportAt(stack, dx, dy) {
  let best = null;
  let bestD = 0.12;
  for (const piece of stack.pieces) {
    if (!piece.held) continue;
    const d = Math.hypot((piece.dx || 0) - dx, (piece.dy || 0) - dy);
    if (d < bestD) {
      bestD = d;
      best = piece;
    }
  }
  return best;
}

function bears(under, above) {
  const loose = under.id === "sand" || under.id === "soil" || under.id === "salt";
  const load = (above.grams || 0) * (above.density || 1);
  if (loose) return load < 1.1;
  return (under.hardness || 0) + (under.grams || 0) >= load * 0.35;
}

function warmth(id) {
  if (id === "wood" || id === "charcoal") return 1;
  if (id === "clay") return 0.55;
  if (id === "soil") return 0.4;
  return 0.25;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
