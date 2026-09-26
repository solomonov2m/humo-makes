import { Genome } from "./genome.js";
import { findRoute, tread } from "./roads.js";
import { ADULT_DAYS } from "./text.js";
import { fullName, giveName } from "./names.js";
import { layCourse, livable, takeArmful, dwellingWord } from "./housing.js";
import { canReproduce, growPerson, tendBody } from "./life.js";
import { mixBrain, randomBrain, reflect } from "./brain.js";
import { actDeed } from "./deeds.js";
import { choose } from "./intent.js";
import { sealChoice } from "./choice-log.js";
import { blankSkills, practice, remember } from "./skills.js";
import { dayRound, fadePlaces, sharePlaces } from "./haunts.js";
import { mindWorks } from "./ideas.js";
import { crowdLimit, gatherAmount, keepLeftover, roadPace, satiety } from "./civ.js";
import { birthStrike, bloodClose, feedHearth, startBelly, stash, tickBelly } from "./folk.js";
import { ail } from "./press.js";
import { makeBody } from "./body.js";
import { legPace, seatMind, strainLeg } from "./organs.js";
import { fleeRot } from "./rot.js";
import { bootBody, digest, metabolize } from "./metabol.js";
import { senseFeelings } from "./feelings.js";
import { wakeMind } from "./aware.js";
import { wishPast } from "./chart.js";
import { nearCamp } from "./camp.js";
import { bedOf } from "./nerves.js";
import { mineArrive, mineDeposit } from "./mine.js";
import { sailArrive } from "./voyage.js";

let NEXT_ID = 1;

export const STATE = {
  WANDER: "wander",
  SEEK_FOOD: "seek_food",
  SEEK_MATE: "seek_mate",
  BUILD: "build",
  GATHER: "gather",
  REST: "rest",
  FOLLOW: "follow",
  SLEEP: "sleep",
  MINE: "mine",
  SAIL: "sail",
};

const ERRAND = new Set(["seek_water", "seek_food", "hunt", "fish", "carry", "gather", "build", "seek_camp", "mine"]);

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function mindCapFrom(genome) {
  const g = genome.values;
  return clamp(
    36 + g.vision * 30 + g.sociability * 18 + (1 - g.metabolism) * 8 + g.immunity * 8,
    40,
    96,
  );
}

export class Agent {
  constructor(world, { genome, x, y, sex, age = 0, parents = [], skills = null, mind = null, brain = null } = {}) {
    this.id = NEXT_ID++;
    this.genome = genome || Genome.random();
    this.traits = this.genome.derive();
    this.sex = sex || (Math.random() < 0.5 ? "M" : "F");
    giveName(this, null);
    this.name = fullName(this);
    this.age = age;
    this.parents = parents;
    this.partnerId = null;
    this.childrenIds = [];
    this.children = 0;
    this.skills = skills || blankSkills();

    const spot = x !== undefined ? { x, y } : nearCamp(world);
    this.x = spot.x;
    this.y = spot.y;
    this.hearth = { x: spot.x, y: spot.y };

    this.hunger = 18 + Math.random() * 18;
    this.thirst = 12 + Math.random() * 16;
    this.places = [];
    this.drill = null;
    this.tradeWait = 0;
    this.energy = 78 + Math.random() * 18;
    this.alive = true;
    this.state = STATE.WANDER;
    this.target = null;
    this.matingCooldown = 0;
    this.wanderTimer = 0;
    this.wanderDest = null;
    this.house = null;
    this.wood = 0;
    this.pantry = 0;
    this.causeOfDeath = null;
    this.deathCounted = false;
    this.activity = "бродит по острову";
    this.route = null;
    this.routeGoal = "";
    this.routeAge = 0;
    this.routeIndex = 0;
    this.mindCap = mindCapFrom(this.genome);
    this.mind = mind == null ? this.mindFromAge() : mind;
    this.brain = brain || randomBrain();
    this.body = makeBody(this);
    bootBody(this);
    seatMind(this);
    this.pocket = null;
    this.device = null;
    this.felt = {};
    this.idea = "";
  }

  mindFromAge() {
    const growEnd = Math.max(ADULT_DAYS, this.traits.lifespanDays * 0.22);
    const t = clamp(this.age / growEnd, 0, 1);
    return 16 + (this.mindCap - 16) * t;
  }

  get isAdult() {
    return this.age >= ADULT_DAYS;
  }

  get isChild() {
    return !this.isAdult;
  }

  distanceTo(other) {
    return Math.hypot(this.x - other.x, this.y - other.y);
  }

  livingParent(byId) {
    let best = null;
    let bestD = Infinity;
    for (const id of this.parents) {
      const p = byId.get(id);
      if (!p || !p.alive) continue;
      const d = this.distanceTo(p);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }

  partnerHome(byId) {
    if (!this.partnerId) return null;
    const p = byId.get(this.partnerId);
    if (livable(p?.house)) return p.house;
    return null;
  }

  wantsNewHouse(world, byId) {
    if (!this.isAdult || this.house) return false;
    if (this.partnerHome(byId)) return false;
    return world.countHousesNear(this.x, this.y, 7) < crowdLimit(world.culture);
  }

  findPartner(neighbors, byId) {
    if (this.partnerId) {
      const p = byId.get(this.partnerId);
      if (p && p.alive && p.isAdult && p.matingCooldown <= 0 && p.hunger < 78) return p;
      if (p && p.alive) return null;
    }
    let best = null;
    let bestDist = this.traits.vision;
    for (const other of neighbors) {
      if (other === this || !other.alive || other.sex === this.sex || !other.isAdult) continue;
      if (bloodClose(this, other)) continue;
      if (other.matingCooldown > 0 || other.hunger >= 78) continue;
      if (other.partnerId) {
        const taken = byId.get(other.partnerId);
        if (taken && taken.alive && taken.id !== this.id) continue;
      }
      const d = this.distanceTo(other);
      if (d < bestDist) {
        bestDist = d;
        best = other;
      }
    }
    return best;
  }

  decide(world, neighbors, byId) {
    if (!this.alive) return;
    senseFeelings(this, world);
    wakeMind(this);
    fleeRot(this, world);
    this.drill = null;
    choose(this, world, neighbors, byId);
  }

  step(world, neighbors, onBirth, byId) {
    if (!this.alive) return;
    if (!world.isLand(Math.round(this.x), Math.round(this.y))) {
      this.alive = false;
      this.causeOfDeath = "утонул";
      this.activity = "утонул";
      return;
    }

    this.age += 1;
    const share = Math.max(0, 1 - (this.dayShare || 0));
    if (share > 0.02) metabolize(this, world.day, share, world);
    this.dayShare = 0;
    senseFeelings(this, world);
    wakeMind(this);
    const ease0 = this.feelings.ease;
    if (this.matingCooldown > 0) this.matingCooldown -= 1;
    if (this.nursing > 0) this.nursing -= 1;

    const pain = this.hunger + this.thirst + (100 - this.energy) * 0.25;
    this.decide(world, neighbors, byId);
    this.act(world, neighbors, onBirth, byId);
    const nextPain = this.hunger + this.thirst + (100 - this.energy) * 0.25;
    senseFeelings(this, world);
    wakeMind(this);
    const expected = this.choice ? this.choice.expected : ease0;
    const moved = reflect(this, (this.feelings.ease - expected) + (pain - nextPain) / 80);
    sealChoice(this, moved);
    fadePlaces(this);
    sharePlaces(this, neighbors);
    if (tickBelly(this) && this.alive && !birthStrike(this)) this.tryMate(null, world, onBirth, byId, true);
    feedHearth(this, neighbors);
    if (ail(this)) return;
    tendBody(this, neighbors, byId);
    growPerson(this, neighbors);

    if (this.thirst >= 100) {
      this.alive = false;
      this.causeOfDeath = "жажда";
      this.activity = "умер от жажды";
      return;
    }
    if (this.hunger >= 100) {
      this.alive = false;
      const protein = this.body && this.body.limit < 0.12;
      this.causeOfDeath = protein ? "нехватка белка" : "голод";
      this.activity = protein ? "умер без белка" : "умер от голода";
    }
  }

  act(world, neighbors, onBirth, byId) {
    if (this.state === "carry") {
      this.pursue(this.house, world);
      feedHearth(this, neighbors);
      return;
    }
    if (actDeed(this, world)) return;
    switch (this.state) {
      case STATE.SEEK_FOOD:
        this.pursue(this.target, world);
        if (this.target && this.distanceTo(this.target) < 0.7) {
          const taken = world.consumeFood(this.target.key, gatherAmount(this));
          if (taken > 0) {
            const before = this.hunger;
            digest(this, "berry", taken / 5);
            const fed = before - this.hunger;
            keepLeftover(this, world.culture, fed, before);
            this.energy = Math.min(100, this.energy + taken * 0.45);
            practice(this, "food", 0.22);
            remember(this, "food", this.target.x, this.target.y);
            this.activity = "ест";
          }
        }
        break;

      case STATE.SEEK_MATE: {
        const partner = this.target;
        if (!partner || !partner.alive) {
          this.state = STATE.WANDER;
          break;
        }
        this.pursue(partner, world);
        if (this.distanceTo(partner) < 0.85) this.tryMate(partner, world, onBirth, byId);
        break;
      }

      case STATE.GATHER:
        this.pursue(this.target, world);
        if (this.target && this.distanceTo(this.target) < 0.7) takeArmful(this, world);
        break;

      case STATE.BUILD:
        if (!this.house) break;
        this.pursue(this.house, world);
        if (this.distanceTo(this.house) < 0.95 && layCourse(this)) practice(this, "craft", 0.08);
        break;

      case STATE.REST:
        if (!this.house) break;
        this.pursue(this.house, world);
        if (this.distanceTo(this.house) < 1.15) {
          this.energy = Math.min(100, this.energy + 0.55);
          const word = dwellingWord(this.house);
          this.activity = `отдыхает: ${word}`;
        }
        break;

      case STATE.SLEEP: {
        const bed = this.bed || bedOf(this, world);
        if (!bed) break;
        this.bed = bed;
        this.pursue(bed, world);
        if (this.distanceTo(bed) < 1.15) {
          this.activity = "спит";
          this.target = null;
          this.slept = true;
        }
        break;
      }

      case STATE.MINE:
        this.pursue(this.target, world);
        mineArrive(this, world);
        if (mineDeposit(this, world)) practice(this, "craft", 0.1);
        break;

      case STATE.SAIL:
        if (!this.raft) this.pursue(this.target, world);
        sailArrive(this, world);
        break;

      case STATE.FOLLOW: {
        const parent = this.target;
        if (!parent || !parent.alive) {
          this.state = STATE.WANDER;
          break;
        }
        this.pursue(parent, world);
        break;
      }

      case STATE.WANDER:
      default:
        this.wander(world);
        break;
    }
  }

  pursue(target, world) {
    if (!target) return;
    let aim = target;
    if (this.state === "seek_mate" && target.id) {
      if (!this.meet || this.meet.who !== target.id) {
        this.meet = { who: target.id, x: (this.x + target.x) / 2, y: (this.y + target.y) / 2 };
      }
      aim = this.meet;
    } else this.meet = null;
    const dist = Math.hypot(aim.x - this.x, aim.y - this.y);
    if (dist < 1.25 && world.feetDry(this.x, this.y, aim.x, aim.y)) {
      this.walkToward(aim.x, aim.y, world);
      return;
    }
    const goal = `${Math.round(aim.x)},${Math.round(aim.y)}`;
    if (this.routeGoal !== goal || this.route == null) {
      this.route = findRoute(world, this.x, this.y, aim.x, aim.y) || [];
      this.routeGoal = goal;
      this.routeAge = 0;
      this.routeIndex = 0;
    }
    this.routeAge += this.stepBudget ?? 0;
    let guard = 0;
    while ((this.stepBudget ?? 0) > 0.0001 && this.route && guard < 16) {
      while (this.routeIndex < this.route.length - 1) {
        const hop = this.route[this.routeIndex];
        if (Math.hypot(hop.x - this.x, hop.y - this.y) < 0.6) this.routeIndex += 1;
        else break;
      }
      if (this.route.length < 2) this.walkToward(aim.x, aim.y, world);
      else {
        const wp = this.route[Math.min(this.routeIndex, this.route.length - 1)];
        this.walkToward(wp.x, wp.y, world);
      }
      guard += 1;
    }
  }

  walkToward(tx, ty, world) {
    const budget = this.stepBudget ?? 0;
    if (budget <= 0) return;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const pace = roadPace(this, world, this.x, this.y) * legPace(this);
    const step = Math.min(budget * pace, dist);
    this.stepBudget = Math.max(0, budget - step / Math.max(pace, 0.01));
    const beforeX = this.x;
    const beforeY = this.y;
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    if (world.feetDry(this.x, this.y, nx, ny)) {
      this.x = nx;
      this.y = ny;
    } else {
      strainLeg(this, true);
      wishPast(world, beforeX, beforeY, nx, ny);
      this.wanderDest = null;
      this.route = null;
      this.stepBudget = 0;
      return;
    }
    const moved = Math.hypot(this.x - beforeX, this.y - beforeY);
    if (moved > 0.01 && ERRAND.has(this.state)) tread(world, this.x, this.y, moved * 0.12);
  }

  wander(world, gameSeconds = 0, dayFraction = 0.4) {
    const spot = dayRound(this, world, dayFraction);
    const same = this.wanderDest
      && Math.round(this.wanderDest.x) === Math.round(spot.x)
      && Math.round(this.wanderDest.y) === Math.round(spot.y);
    if (!same) {
      this.wanderDest = spot;
      this.route = null;
    }
    if (this.distanceTo(spot) < 1.05) {
      if (!spot.home && mindWorks(this, world, gameSeconds)) return;
      this.activity = spot.home ? "у очага" : "думает, чем заняться";
      return;
    }
    this.activity = spot.home ? "идёт домой" : "идёт работать";
    this.pursue(spot, world);
  }

  formFamily(partner, byId) {
    const mine = this.partnerId ? byId.get(this.partnerId) : null;
    const theirs = partner.partnerId ? byId.get(partner.partnerId) : null;
    const mineFree = !mine || !mine.alive || mine.id === partner.id;
    const theirFree = !theirs || !theirs.alive || theirs.id === this.id;
    if (mineFree && theirFree) {
      this.partnerId = partner.id;
      partner.partnerId = this.id;
    }
  }

  tryMate(partner, world, onBirth, byId, due) {
    if (!due) {
      this.matingCooldown = 28;
      partner.matingCooldown = 28;
      this.formFamily(partner, byId);
      if (!canReproduce(this) || !canReproduce(partner)) return;
      const chance = (this.traits.fertility + partner.traits.fertility) / 2;
      if (Math.random() >= chance) return;
      const woman = this.sex === "F" ? this : partner;
      const man = woman === this ? partner : this;
      startBelly(woman, man);
      return;
    }
    const fatherId = this.belly.fatherId;
    const father = byId.get(fatherId);
    this.belly = null;
    this.nursing = 16;
    const childGenome = father ? Genome.crossover(this.genome, father.genome) : Genome.crossover(this.genome, this.genome);
    let cx = this.x + (Math.random() - 0.5) * 0.8;
    let cy = this.y + (Math.random() - 0.5) * 0.8;
    if (!world.isLand(Math.round(cx), Math.round(cy))) {
      cx = this.x;
      cy = this.y;
    }
    const child = new Agent(world, {
      genome: childGenome,
      x: cx,
      y: cy,
      age: 0,
      parents: father ? [this.id, father.id] : [this.id],
      brain: father ? mixBrain(this.brain, father.brain) : this.brain,
    });
    this.childrenIds.push(child.id);
    if (father) {
      father.childrenIds.push(child.id);
      father.children = father.childrenIds.length;
    }
    this.children = this.childrenIds.length;
    if (father && father.given) {
      giveName(child, father);
      child.name = fullName(child);
    }
    onBirth(child);
  }
}
