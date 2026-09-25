import { TILE_FOREST, TILE_GRASS, TILE_HILL, TILE_SAND } from "./world.js";
import { stageTitle } from "./life.js";

export const YEAR_DAYS = 10;
export const ADULT_YEARS = 14;
export const ADULT_DAYS = ADULT_YEARS * YEAR_DAYS;

const MALE = ["Артём", "Мирон", "Лев", "Глеб", "Ян", "Тим", "Марк", "Егор", "Олег", "Савва", "Илья", "Роман", "Кирилл", "Денис", "Павел", "Фёдор", "Степан", "Матвей", "Борис", "Никита", "Лука", "Пётр", "Антон", "Гриша"];
const FEMALE = ["Мира", "Лея", "Ника", "Ася", "Вера", "Соня", "Кира", "Ева", "Ада", "Лия", "Майя", "Зоя", "Инга", "Тая", "Нора", "Рита", "Аня", "Оля", "Катя", "Даша", "Поля", "Тома", "Нина", "Яна"];

export function personName(id, sex) {
  const list = sex === "F" ? FEMALE : MALE;
  return list[Math.abs(id) % list.length];
}

export function ru(n, one, few, many) {
  const n10 = n % 10;
  const n100 = n % 100;
  const word = n10 === 1 && n100 !== 11 ? one
    : n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14) ? few
      : many;
  return `${n} ${word}`;
}

export function cap(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatAge(days) {
  const years = Math.floor(days / YEAR_DAYS);
  const rest = days % YEAR_DAYS;
  if (years <= 0) return `меньше года (${ru(rest, "день", "дня", "дней")})`;
  if (rest === 0) return ru(years, "год", "года", "лет");
  return `${ru(years, "год", "года", "лет")} и ${rest} дн.`;
}

export function ageParts(days) {
  const years = Math.floor(days / YEAR_DAYS);
  if (years < 1) {
    return { num: days, unit: days === 1 ? "день" : "дней" };
  }
  const n10 = years % 10;
  const n100 = years % 100;
  const unit = n10 === 1 && n100 !== 11 ? "год"
    : n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14) ? "года"
      : "лет";
  return { num: years, unit };
}

export function stageName(agent) {
  return stageTitle(agent);
}

export function sexName(agent) {
  if (agent.isChild) return "ребёнок";
  return agent.sex === "F" ? "женщина" : "мужчина";
}

export const SKILL_META = {
  food: { title: "Еда", can: "собирать еду" },
  water: { title: "Вода", can: "находить воду" },
  hunt: { title: "Охота", can: "охотиться" },
  fish: { title: "Рыба", can: "ловить рыбу" },
  farm: { title: "Земледелие", can: "возделывать землю" },
  craft: { title: "Ремесло", can: "строить своими руками" },
  raft: { title: "Плот", can: "вязать плот" },
  places: { title: "Знакомые места", can: "помнить, где что было" },
};

export const SKILL_ORDER = ["food", "water", "hunt", "fish", "farm", "craft", "raft", "places"];

const BAND_LABEL = {
  none: "ещё нет",
  learn: "развивает",
  got: "получен",
  good: "хорошо",
  master: "мастер",
};

export function bandLabel(band) {
  return BAND_LABEL[band] || band;
}

export function activeSkill(agent) {
  if (!agent.alive) return null;
  if (agent.drill) return agent.drill;
  if (agent.state === "seek_food") return "food";
  if (agent.state === "seek_water") return "water";
  if (agent.state === "hunt") return "hunt";
  if (agent.state === "fish") return "fish";
  if (agent.state === "farm") return "farm";
  if (agent.state === "build" || agent.state === "gather") return "craft";
  if (agent.state === "raft") return "raft";
  return null;
}

export function mindWord(agent) {
  const n = agent.mind;
  const f = agent.sex === "F";
  if (n < 30) return f ? "наивная" : "наивный";
  if (n < 45) return f ? "любопытная" : "любопытный";
  if (n < 58) return f ? "смышлёная" : "смышлёный";
  if (n < 72) return f ? "острая" : "острый";
  return f ? "мудрая" : "мудрый";
}

export function mindSentence(agent) {
  const g = agent.genome.values;
  const word = mindWord(agent);
  let why = "соображает в бытовых делах";
  if (g.vision >= g.sociability && g.vision > 0.55) why = "хорошо замечает, что происходит вокруг";
  else if (g.sociability > 0.55) why = "легко понимает других людей";
  const growing = agent.isChild ? " Ум ещё растёт вместе с возрастом." : "";
  return `${cap(word)}: ${why}.${growing}`;
}

export const GENE_META = {
  speed: ["Скорость", "как быстро ходит"],
  vision: ["Восприятие", "как далеко видит еду и людей"],
  metabolism: ["Затраты тела", "выше — быстрее голодает"],
  fertility: ["Плодовитость", "шанс ребёнка при встрече"],
  lifespan: ["Долголетие", "как тело держит годы, не дата смерти"],
  strength: ["Сила", "сколько еды приносит за раз"],
  immunity: ["Иммунитет", "как стойко переносит голод"],
  sociability: ["Общительность", "тяга к людям и к паре"],
};

export function directionPhrase(world, x, y) {
  const dx = x - world.cols / 2;
  const dy = y - world.rows / 2;
  if (Math.abs(dx) < 4 && Math.abs(dy) < 3) return "центр острова";
  const v = Math.abs(dy) >= 3 ? (dy < 0 ? "север" : "юг") : "";
  const h = Math.abs(dx) >= 4 ? (dx < 0 ? "запад" : "восток") : "";
  const combo = {
    северозапад: "северо-запад острова",
    северовосток: "северо-восток острова",
    югозапад: "юго-запад острова",
    юговосток: "юго-восток острова",
  };
  if (v && h) return combo[v + h];
  if (v) return `${v} острова`;
  return `${h} острова`;
}

export function placePhrase(world, x, y) {
  const tile = world.tileAt(Math.round(x), Math.round(y));
  const ground = {
    [TILE_SAND]: "на берегу",
    [TILE_GRASS]: "на поляне",
    [TILE_FOREST]: "в лесу",
    [TILE_HILL]: "на холме",
  }[tile] || "на острове";
  return `${ground}, ${directionPhrase(world, x, y)}`;
}

export function clothHint(agent) {
  if (!agent.alive) return "На карте фигура погасла.";
  if (agent.isChild) return "На карте это зелёная фигура ребёнка.";
  if (agent.sex === "M") return "На карте это синяя фигура.";
  return "На карте это розовая фигура.";
}

export function houseStage(progress) {
  if (progress >= 1) return "готовый дом";
  if (progress < 0.2) return "площадка";
  if (progress < 0.45) return "каркас";
  if (progress < 0.75) return "стены";
  return "крыша";
}

export function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  }[c]));
}
