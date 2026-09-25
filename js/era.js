// Эпоха — полоса лестницы, а не отдельный счётчик домов.

const ERAS = [
  { at: 0, id: "forage", name: "Собиратели", blurb: "Едят то, что само растёт на острове." },
  { at: 2, id: "hearth", name: "Очаг", blurb: "Камень и огонь: еду берут сподручнее и едят сытнее." },
  { at: 5, id: "camp", name: "Стойбище", blurb: "Охота, слово и жильё держат людей вместе." },
  { at: 8, id: "farm", name: "Село", blurb: "Горшок, скот и поле кормят тех, кто остаётся у дома." },
  { at: 11, id: "write", name: "Грамота", blurb: "Колесо, металл и письмо. Знание переживает рассказчика." },
  { at: 15, id: "science", name: "Наука", blurb: "Печать и общая проверка. Учатся быстрее одной жизни." },
  { at: 17, id: "power", name: "Энергия", blurb: "Пар и ток уже есть. Дальше никто не назначает: решает сытость и число свободных мастеров." },
];

export function eraView(culture) {
  const kept = culture ? culture.kept || 0 : 0;
  let current = 0;
  for (let i = 0; i < ERAS.length; i++) if (kept >= ERAS[i].at) current = i;
  const next = current < ERAS.length - 1 ? ERAS[current + 1] : null;
  const stages = ERAS.map((era, i) => ({
    id: era.id,
    name: era.name,
    blurb: era.blurb,
    state: i < current ? "done" : i === current ? "now" : i === current + 1 ? "next" : "later",
  }));
  const span = next ? next.at - ERAS[current].at : 1;
  const meter = next ? Math.min(1, (kept - ERAS[current].at) / span) : 1;
  const goal = pressureLine(culture, next);
  return {
    eraName: ERAS[current].name,
    eraBlurb: ERAS[current].blurb,
    goalText: goal,
    meter,
    finished: !next,
    stages,
  };
}

function pressureLine(culture, next) {
  if (!culture) return "Люди пока только живут.";
  const found = culture.found || {};
  if ((culture.ache || 0) > 10 && !found["Жилище"]) {
    return "Без крыши неспокойно. Шалаш явится, когда кто-то сам свяжет холод и ветки рядом.";
  }
  if (culture.warm) return `Никто не назначает этап. Ближе всех догадка «${culture.warm.name}».`;
  if (!next) return "Дальше программу не ведёт: что люди поймут, то и будет.";
  return culture.last ? `Уже додумались до «${culture.last}». Дальше — только если сами дойдут.` : "Идеи не выдаются. Их рождает нужда и то, что лежит рядом.";
}
