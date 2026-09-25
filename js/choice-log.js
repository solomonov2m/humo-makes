// Журнал одного хода: что увидел, что отверг, чем кончилось тело.

const NAME = {
  drink: "пить",
  eat: "есть",
  hunt: "охота",
  fish: "рыба",
  rest: "отдых",
  build: "укрытие",
  mate: "пара",
  wander: "ход",
  sleep: "сон",
  flee: "бегство",
  carry: "ноша",
  nurse: "кормление",
};

export function choiceName(act) {
  return NAME[act] || act;
}

export function openChoice(agent, note) {
  agent.choice = {
    seen: note.seen,
    body: note.body,
    options: note.options,
    chosen: note.chosen,
    why: note.why,
    expected: note.expected,
    before: snap(agent),
    after: null,
    moved: 0,
  };
}

export function sealChoice(agent, moved) {
  const note = agent.choice;
  if (!note) return;
  note.after = snap(agent);
  note.moved = moved || 0;
}

export function choiceLine(agent) {
  const note = agent.choice;
  if (!note) return "Ход ещё не выбран.";
  const rejected = note.options
    .filter((row) => row.act !== note.chosen)
    .slice(0, 3)
    .map((row) => `${choiceName(row.act)} ${row.score.toFixed(2)}`)
    .join(", ");
  const after = note.after ? ` После: голод ${note.after.hunger}, жажда ${note.after.thirst}.` : "";
  const weights = note.moved ? ` Веса сдвинулись на ${note.moved.toFixed(3)}.` : "";
  return `Увидел: ${note.seen}. Тело: ${note.body}. Взял «${choiceName(note.chosen)}» (${note.why}). Отверг: ${rejected || "нечего"}.${after}${weights}`;
}

function snap(agent) {
  const store = agent.body && agent.body.store;
  return {
    hunger: Math.round(agent.hunger),
    thirst: Math.round(agent.thirst),
    energy: Math.round(agent.energy),
    glucose: store ? Number(store.glucose.toFixed(2)) : 0,
    water: store ? Number(store.water.toFixed(2)) : 0,
  };
}
