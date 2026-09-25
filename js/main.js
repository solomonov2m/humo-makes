import { Simulation } from "./simulation.js";
import { drawActivities, drawAgents, drawFocus, drawTalk, drawWorld, findAgentAt, findHouseAt, viewDetail, ZOOM_LABEL } from "./render.js";
import { createStage } from "./stage.js";
import { mountPanel } from "./panel.js";
import { mountChronicle } from "./dashboard.js";
import { mountHud } from "./hud.js";
import { pumpDays } from "./pace.js";
import { zoomForPerson } from "./scale.js";
import { aimZoom } from "./zoom-aim.js";
import { findThing } from "./thing.js";
import { placeTag } from "./thing-view.js";
import { mountPlaces } from "./place-nav.js";
import { watchIsland } from "./island-line.js";
import { drawTrips } from "./trip-draw.js";
import { drawEyes, forgetEyes } from "./eyes-draw.js";
import { phaseOf } from "./clock.js";

const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");
const stageEl = document.getElementById("stage");
const thingTag = document.getElementById("thingTag");
const tagTitle = document.getElementById("tagTitle");
const tagNeed = document.getElementById("tagNeed");
const eyes = document.getElementById("eyes");

const stage = createStage(canvas, stageEl);
let sim = new Simulation();
let paused = false;
let selected = null;
let picked = null;
let hovered = null;
let uiTick = 0;
let last = performance.now();

const chronicle = mountChronicle({
  getSim: () => sim,
  button: document.getElementById("btnChronicle"),
});

const places = mountPlaces(document.getElementById("hamletList"), {
  stage,
  getWorld: () => sim.world,
  getAgents: () => sim.agents,
});

function choose(agent) {
  selected = agent;
  picked = null;
  hud.watch(agent);
}

const hud = mountHud({
  getSim: () => sim,
  getSelected: () => selected,
  getPicked: () => picked,
  onPick(id) {
    const found = sim.agents.find((agent) => agent.id === id);
    if (found) choose(found);
  },
});

const panel = mountPanel({
  onPause() {
    paused = !paused;
    panel.setPaused(paused);
  },
  onReset() {
    sim = new Simulation();
    selected = null;
    picked = null;
    hovered = null;
    forgetEyes();
    stage.sizeCanvas();
    stage.center(sim.world);
    places.clear();
    hud.clear();
  },
  onSpeed(index) { sim.clock.setSpeed(index); },
  onZoomIn() {
    const fresh = !selected;
    if (!selected) selected = sim.agents.find((agent) => agent.alive) || null;
    aimZoom(stage, canvas, sim.world, selected, 1);
    if (fresh) hud.watch(selected);
  },
  onZoomOut() { aimZoom(stage, canvas, sim.world, selected, -1); },
});

function frame(now) {
  const dt = Math.max(0, (now - last) / 1000);
  last = now;
  if (!paused) pumpDays(sim, dt);
  stage.drift(sim.world, dt);
  const dpr = canvas.width / Math.max(1, canvas.getBoundingClientRect().width);
  const m = stage.metrics(sim.world);
  const fit = m.scale / Math.max(stage.camera.zoom, 1e-6);
  const detail = viewDetail(stage.camera.zoom, fit);
  const project = (wx, wy) => ({ x: wx * m.scale + m.ox, y: wy * m.scale + m.oy });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(m.scale, 0, 0, m.scale, m.ox, m.oy);
  drawWorld(ctx, sim.world);
  if (detail !== "map") drawFocus(ctx, selected);
  if (!sim.clock.preset.watch) drawTrips(ctx, sim.agents);
  drawAgents(ctx, sim.agents, selected, hovered, detail, sim.world);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (detail === "act" || detail === "talk") drawActivities(ctx, sim.agents, selected, project, dpr, canvas.width, canvas.height);
  if (detail === "talk") drawTalk(ctx, sim.agents, selected, project, now, dpr, canvas.width, canvas.height, stage.camera, sim.culture);
  placeTag({ tag: thingTag, tagTitle, tagNeed }, picked, canvas, m);
  if (selected && selected.alive && !eyes.hidden) {
    drawEyes(eyes, selected, sim.world, now, phaseOf(sim.clock.progress));
    hud.setDoing(selected.activity || "живёт");
  }
  panel.setZoom(ZOOM_LABEL[detail], stage.camera.zoom, stage.minZoom, stage.maxZoom);
  panel.setDay(sim.day, sim.clock.progress);
  uiTick += 1;
  if (paused || uiTick % 8 === 0) {
    if (selected && !sim.agents.includes(selected)) selected = null;
    hud.paint();
    places.paint(sim.world, sim.agents);
  }
  chronicle.paint();
  requestAnimationFrame(frame);
}

stage.bind({
  getWorld: () => sim.world,
  onHover(point, reach) {
    hovered = findAgentAt(sim.agents, point.x, point.y, reach);
    return Boolean(hovered || findThing(sim.world, sim.agents, point.x, point.y, reach));
  },
  onPick(point) {
    const reach = 22 / stage.metrics(sim.world).scale;
    const thing = findThing(sim.world, sim.agents, point.x, point.y, reach);
    const found = findAgentAt(sim.agents, point.x, point.y, reach);
    const held = thing && (thing.kind === "tool" || thing.kind === "pocket");
    const personD = found ? Math.hypot(found.x + 0.5 - point.x, found.y + 0.5 - point.y) : Infinity;
    if (held && thing.near <= personD) {
      picked = thing;
      selected = null;
    } else if (found) {
      selected = found;
      picked = null;
    } else if (thing) {
      picked = thing;
      selected = null;
    } else {
      const house = findHouseAt(sim.world, point.x, point.y, reach);
      picked = null;
      selected = house ? sim.agents.find((agent) => agent.id === house.ownerId) || null : null;
    }
    hud.watch(selected);
  },
  onFocus(point) {
    const metrics = stage.metrics(sim.world);
    const agent = findAgentAt(sim.agents, point.x, point.y, 28 / metrics.scale);
    if (!agent) return;
    selected = agent;
    picked = null;
    const fitNow = metrics.scale / Math.max(stage.camera.zoom, 1e-6);
    stage.lookAt(sim.world, agent.x + 0.5, agent.y + 0.5, Math.max(stage.camera.zoom, zoomForPerson(fitNow)));
    hud.watch(agent);
  },
});

panel.markSpeed(sim.clock.speedIndex);
watchIsland(document.getElementById("islandLine"));
stage.center(sim.world);
places.paint(sim.world, sim.agents);
stage.sizeCanvas();
requestAnimationFrame(frame);
