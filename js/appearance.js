import { mixHex } from "./color.js";

const SKINS = [
  { c: "#f6d3b4", name: "светлая" },
  { c: "#e7b98a", name: "тёплая" },
  { c: "#c68642", name: "смуглая" },
  { c: "#8d5524", name: "коричневая" },
  { c: "#5c3317", name: "тёмная" },
];

const HAIRS = [
  { c: "#1c140f", name: "чёрные" },
  { c: "#3b2414", name: "тёмные" },
  { c: "#a56b32", name: "русые" },
  { c: "#8a3b16", name: "рыжие" },
];

const EYES = [
  { c: "#6b3a22", name: "карие" },
  { c: "#2f6b3c", name: "зелёные" },
  { c: "#7d868c", name: "серые" },
  { c: "#3d6f9a", name: "голубые" },
];

export function tunicColor(agent) {
  if (!agent.alive) return "#8a8178";
  if (agent.isChild) return "#1f7a43";
  return agent.sex === "M" ? "#2f6fbe" : "#c4517f";
}

function pick(list, t) {
  const i = Math.max(0, Math.min(list.length - 1, Math.floor(t * list.length)));
  return list[i];
}

export function appearance(agent) {
  const g = agent.genome.values;
  const skin = pick(SKINS, g.strength * 0.55 + g.immunity * 0.45);
  const hair = pick(HAIRS, g.lifespan * 0.6 + g.vision * 0.4);
  const eye = pick(EYES, g.vision * 0.7 + g.sociability * 0.3);
  const old = agent.traits.lifespanDays > 0 && agent.age / agent.traits.lifespanDays > 0.72;
  const hairLong = agent.sex === "F" && !agent.isChild && g.sociability > 0.42;
  const beard = agent.sex === "M" && agent.isAdult && g.strength > 0.62;
  return {
    skin: skin.c,
    skinName: skin.name,
    skinShadow: mixHex(skin.c, "#4a2c18", 0.38),
    hair: old ? mixHex(hair.c, "#d9dde2", 0.78) : hair.c,
    hairName: old ? "седые" : hair.name,
    hairLong,
    eye: eye.c,
    eyeName: eye.name,
    beard: beard && !old,
    old,
    sturdy: g.strength > 0.66 ? "крепкое" : g.strength < 0.34 ? "лёгкое" : "обычное",
    smile: (g.sociability - 0.5) * 2,
    faceW: 0.9 + g.strength * 0.2,
    tunic: tunicColor(agent),
  };
}

export function lookSentence(agent) {
  const a = appearance(agent);
  const hairLen = agent.isChild || !a.hairLong ? "короткие" : "длинные";
  const beard = a.beard ? ", есть борода" : "";
  const ageLook = a.old ? ", в волосах седина" : agent.isChild ? ", детские черты" : "";
  const skin = a.skinName.charAt(0).toUpperCase() + a.skinName.slice(1);
  return `${skin} кожа, ${hairLen} ${a.hairName} волосы, ${a.eyeName} глаза${beard}${ageLook}.`;
}
