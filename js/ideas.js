import { feelMatter } from "./body.js";
import { groundMatter, takeSample } from "./matter.js";
import { tryMix } from "./react.js";
import { stuff } from "./elements.js";
import { bite, dryBrine, flexes, lifts } from "./laws.js";
import { applyKnown, graspNote } from "./laws.js";
import { holds } from "./notions.js";
import { christenTool } from "./call.js";

export function mindWorks(agent, world, gameSeconds) {
  if (!agent.studying || !agent.alive || agent.hunger > 70 || agent.thirst > 68) return false;
  agent.museIn = (agent.museIn || 0) - (gameSeconds || 0);
  if (agent.museIn > 0) return false;
  const did = muse(agent, world);
  const mind = agent.mind || 40;
  agent.museIn = Math.max(600, 4800 - mind * 35);
  return did;
}

export function muse(agent, world) {
  if (!agent.alive || agent.hunger > 72 || agent.thirst > 70) return false;
  if (!agent.body) return false;
  const here = groundMatter(world, Math.round(agent.x), Math.round(agent.y));
  const felt = feelMatter(agent, here);
  if (!felt) return false;
  rememberStuff(agent, here);
  const dried = dryBrine(agent.pocket, here);
  if (dried) {
    agent.pocket = dried;
    agent.idea = "вода ушла — соль осталась";
    agent.activity = agent.idea;
    graspNote(agent, world.culture, agent.idea);
    return true;
  }
  if (!agent.pocket) takeSample(agent, world);
  if (agent.pocket && applyKnown(agent, here, world.culture)) return true;
  if (agent.pocket && Math.random() < 0.45) return mixHands(agent, here, world.culture);
  if (Math.random() < 0.55) return shapeTool(agent, here, felt, world.culture);
  agent.activity = `щупает: ${here.name}`;
  agent.body.links += 1;
  return true;
}

function mixHands(agent, here, culture) {
  const heat = holds(agent, "Огонь") || here.id === "charcoal" || (agent.pocket && agent.pocket.id === "charcoal");
  let trial = tryMix(agent.pocket, here, heat);
  if (trial && !trial.ok && heat && agent.pocket.kind === "organic") trial = tryMix(agent.pocket, stuff("air"), true);
  const key = `${agent.pocket.id}+${here.id}`;
  agent.trials = agent.trials || {};
  if (agent.trials[key]) return false;
  agent.trials[key] = trial.note;
  if (trial && trial.note) graspNote(agent, culture, trial.note);
  agent.body.links += 2;
  if (trial.brine) {
    agent.pocket = { ...agent.pocket, brine: true };
    agent.activity = trial.note;
    agent.idea = trial.note;
    return true;
  }
  if (trial.ok && !trial.out) {
    agent.pocket = null;
    agent.activity = trial.note;
    agent.idea = trial.note;
    return true;
  }
  if (trial.ok && trial.out && trial.out !== agent.pocket.id) {
    const next = stuff(trial.out);
    agent.pocket = { ...next, grams: trial.grams || agent.pocket.grams };
    agent.activity = trial.note;
    agent.idea = trial.note;
    return true;
  }
  agent.activity = trial.note;
  agent.idea = trial.note;
  return true;
}

function shapeTool(agent, here, felt, culture) {
  const hand = agent.pocket;
  if (!hand) return false;
  const known = agent.felt || {};
  const edge = hand.hardness > felt.hardness ? hand : null;
  if (!edge) return false;
  const light = known.wood || hand.id === "wood";
  const heft = stuff(light ? "wood" : edge.id) || edge;
  const wide = here.density < 1.7;
  const point = here.hardness > 5;
  const face = wide ? 7 : point ? 2 : 4;
  const shaft = light ? 9 : 4;
  if (!flexes(heft) && shaft >= 6) {
    agent.device = null;
    agent.idea = "твёрдое древко ломается";
    agent.activity = agent.idea;
    graspNote(agent, culture, agent.idea);
    return true;
  }
  if (!point && !lifts(heft, shaft, here).ok) {
    agent.idea = lifts(heft, shaft, here).note;
    agent.activity = agent.idea;
    graspNote(agent, culture, agent.idea);
    return true;
  }
  const worn = bite(edge, here, agent.device);
  if (!worn.cuts) {
    agent.device = null;
    agent.idea = worn.note;
    agent.activity = agent.idea;
    graspNote(agent, culture, agent.idea);
    return true;
  }
  const tool = {
    face,
    shaft,
    edge: edge.id,
    heft: heft.id,
    tone: edge.density,
    bite: here.density,
    keen: worn.keen,
  };
  const same = agent.device && agent.device.face === face && agent.device.edge === hand.id;
  if (same) return false;
  christenTool(agent, tool);
  agent.device = tool;
  agent.body.links += 3;
  agent.idea = silhouette(tool);
  agent.activity = agent.idea;
  return true;
}

function rememberStuff(agent, piece) {
  agent.felt = agent.felt || {};
  if (agent.felt[piece.id]) return;
  agent.felt[piece.id] = { density: piece.density, hardness: piece.hardness };
  agent.body.links += 1;
}

export function silhouette(tool) {
  if (!tool) return "";
  if (tool.face >= 6 && tool.shaft >= 7) return "широкий край на лёгком древке";
  if (tool.face <= 2) return "остриё на короткой рукояти";
  if (tool.shaft >= 7) return "узкое лезвие на древке";
  return "каменный край в ладони";
}

export function ideaLine(agent) {
  const known = agent.felt ? Object.keys(agent.felt).length : 0;
  const idea = agent.idea ? `Своя догадка: ${agent.idea}.` : "Своих догадок пока нет.";
  return `Изучено веществ: ${known}. Связей ${agent.body ? agent.body.links : 0}. ${idea}`;
}
