import { TILE } from "./world.js";
import { groundMatter } from "./matter.js";
import { hitHeld } from "./tool-draw.js";
import { nearestKeyed } from "./spot-near.js";

const CROPS = ["репа", "ячмень", "пшеница"];

const USE = {
  wood: "ветки на жильё и рукоять",
  stone: "скалу откалывают, металл внутри неё не лежит",
  flint: "острый край",
  ore: "чёрный песок, железо из него плавят",
  copper: "мягкий металл в жаре",
  tinore: "металл, который течёт раньше меди",
  clay: "копают в берегу реки",
  coal: "жар сильнее костра",
  sand: "сыпучее с берега",
  salt: "то, что остаётся, когда вода уходит",
  soil: "земля под ноги и под сев",
  water: "пить",
};

export function findThing(world, agents, px, py, reach = 0.4) {
  const held = hitHeld(agents, px, py, reach);
  if (held) return held;
  const house = nearestHouse(world, px, py);
  if (house) return house;
  const field = nearestList(world.fields, px, py, (spot) => fieldCard(spot), 16);
  if (field) return field;
  const beast = nearestBeast(world, px, py);
  if (beast) return beast;
  const pile = nearestKeyed(world.stuff, px, py, (spot) => pileCard(spot));
  if (pile) return pile;
  const food = nearestKeyed(world.food, px, py, () => ({ title: "ягоды", call: "", need: "есть, когда голодно", maker: "" }));
  if (food) return food;
  const wood = nearestKeyed(world.wood, px, py, () => ({ title: "ветки", call: "", need: USE.wood, maker: "" }));
  if (wood) return wood;
  const raft = nearestRaft(world, px, py);
  if (raft) return raft;
  return groundCard(world, px, py);
}

function nearestHouse(world, px, py) {
  let best = null;
  let bestD = 18;
  for (const house of world.houses || []) {
    const cx = house.x * TILE + TILE / 2;
    const cy = house.y * TILE + TILE / 2;
    const d = Math.hypot(cx - px, cy - py);
    if (d >= bestD) continue;
    bestD = d;
    const word = house.pieces && house.pieces.length ? `${house.pieces.length} кусков` : "площадка";
    best = {
      title: word,
      call: house.maker || "",
      need: house.need || (house.progress >= 1 ? "жить под крышей" : "достроить крышу"),
      maker: house.maker || "",
      makerId: house.makerId || house.ownerId,
      x: cx,
      y: cy,
      kind: "house",
    };
  }
  return best;
}

function fieldCard(field) {
  return {
    title: field.call || CROPS[field.crop] || CROPS[0],
    call: field.maker || "",
    need: field.ripe ? "уже можно есть" : (field.need || "дикая еда у жилья кончается"),
    maker: field.maker || "",
    makerId: field.makerId || field.ownerId,
    kind: "field",
  };
}

function pileCard(pile) {
  return {
    title: pile.name,
    call: "",
    need: USE[pile.id] || "лежит в земле",
    maker: "",
    kind: "pile",
  };
}

function nearestBeast(world, px, py) {
  let best = null;
  let bestD = 12;
  for (const beast of world.animals || []) {
    if (!beast.alive) continue;
    const cx = beast.x * TILE + TILE / 2;
    const cy = beast.y * TILE + TILE / 2;
    const d = Math.hypot(cx - px, cy - py);
    if (d >= bestD) continue;
    bestD = d;
    best = { title: beast.name, call: "", need: "мясо, если ягод мало", maker: "", x: cx, y: cy, kind: "beast" };
  }
  return best;
}

function nearestRaft(world, px, py) {
  let best = null;
  let bestD = 14;
  for (const raft of world.rafts || []) {
    const cx = raft.x * TILE + 8;
    const cy = raft.y * TILE + 10;
    const d = Math.hypot(cx - px, cy - py);
    if (d >= bestD) continue;
    bestD = d;
    best = {
      title: raft.call || "плот",
      call: raft.maker || "",
      need: raft.need || "дерево держится на воде, камень тонет",
      maker: raft.maker || "",
      makerId: raft.makerId,
      x: cx,
      y: cy,
      kind: "raft",
    };
  }
  return best;
}

function nearestList(list, px, py, card, reach) {
  let best = null;
  let bestD = reach;
  for (const spot of list || []) {
    const cx = spot.x * TILE + TILE / 2;
    const cy = spot.y * TILE + TILE / 2;
    const d = Math.hypot(cx - px, cy - py);
    if (d >= bestD) continue;
    bestD = d;
    best = card(spot);
    best.x = cx;
    best.y = cy;
  }
  return best;
}

function groundCard(world, px, py) {
  const piece = groundMatter(world, Math.round(px / TILE), Math.round(py / TILE));
  if (!piece || piece.id === "air" || piece.id === "soil") return null;
  return {
    title: piece.name,
    call: "",
    need: USE[piece.id] || "лежит под ногами",
    maker: "",
    x: px,
    y: py,
    kind: "ground",
  };
}
