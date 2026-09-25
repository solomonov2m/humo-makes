// Вещества острова. Сами элементы — в таблице из 118.

export { ELEMENTS, element } from "./table.js";

export const STUFF = {
  air: { id: "air", name: "воздух", bits: [["N", 78], ["O", 21]], density: 0.001, hardness: 0, state: "gas", kind: "gas" },
  water: { id: "water", name: "вода", bits: [["H", 11], ["O", 89]], density: 1, hardness: 0, state: "liquid", kind: "liquid" },
  salt: { id: "salt", name: "соль", bits: [["Na", 39], ["Cl", 61]], density: 2.16, hardness: 2.5, state: "solid", kind: "salt" },
  sand: { id: "sand", name: "песок", bits: [["Si", 47], ["O", 53]], density: 1.6, hardness: 7, state: "solid", kind: "silicate" },
  soil: { id: "soil", name: "земля", bits: [["O", 47], ["Si", 28], ["C", 8], ["Al", 8], ["Fe", 5], ["H", 4]], density: 1.35, hardness: 1.4, state: "solid", kind: "silicate" },
  wood: { id: "wood", name: "древесина", bits: [["C", 44], ["O", 50], ["H", 6]], density: 0.62, hardness: 2, state: "solid", kind: "organic" },
  stone: { id: "stone", name: "андезит", bits: [["O", 47], ["Si", 28], ["Al", 8], ["Fe", 5], ["Ca", 4]], density: 2.65, hardness: 6.5, state: "solid", kind: "silicate" },
  ore: { id: "ore", name: "железный песок", bits: [["Fe", 70], ["O", 30]], density: 2.9, hardness: 5.5, state: "solid", kind: "ore" },
  copper: { id: "copper", name: "медная руда", bits: [["Cu", 60], ["O", 25], ["S", 15]], density: 4.1, hardness: 3.5, state: "solid", kind: "ore" },
  tinore: { id: "tinore", name: "оловянная руда", bits: [["Sn", 55], ["O", 45]], density: 4.5, hardness: 4, state: "solid", kind: "ore" },
  clay: { id: "clay", name: "глина", bits: [["O", 50], ["Si", 25], ["Al", 15], ["H", 10]], density: 1.8, hardness: 1, state: "solid", kind: "silicate" },
  ceramic: { id: "ceramic", name: "обожжённая глина", bits: [["O", 56], ["Si", 28], ["Al", 16]], density: 2.2, hardness: 6, state: "solid", kind: "silicate" },
  charcoal: { id: "charcoal", name: "уголь", bits: [["C", 90], ["O", 8], ["H", 2]], density: 0.4, hardness: 1, state: "solid", kind: "carbon" },
  protein: { id: "protein", name: "белок", bits: [["C", 53], ["O", 23], ["N", 16], ["H", 7], ["S", 1]], density: 1.35, hardness: 0, state: "solid", kind: "organic" },
  carb: { id: "carb", name: "углевод", bits: [["C", 40], ["O", 53], ["H", 7]], density: 1.5, hardness: 0, state: "solid", kind: "organic" },
  fat: { id: "fat", name: "жир", bits: [["C", 77], ["H", 12], ["O", 11]], density: 0.9, hardness: 0, state: "solid", kind: "organic" },
  rot: { id: "rot", name: "гниль", bits: [["C", 40], ["O", 40], ["H", 10], ["N", 10]], density: 1.1, hardness: 0, state: "solid", kind: "organic" },
  reek: { id: "reek", name: "вонь", bits: [["N", 22], ["H", 18], ["C", 30], ["O", 30]], density: 0.001, hardness: 0, state: "gas", kind: "gas" },
  bone: { id: "bone", name: "кость", bits: [["Ca", 39], ["P", 18], ["O", 41], ["H", 2]], density: 1.9, hardness: 5, state: "solid", kind: "salt" },
  iron: { id: "iron", name: "железо", bits: [["Fe", 100]], density: 7.87, hardness: 4.5, state: "solid", kind: "metal" },
  cu: { id: "cu", name: "медь", bits: [["Cu", 100]], density: 8.96, hardness: 3, state: "solid", kind: "metal" },
  tin: { id: "tin", name: "олово", bits: [["Sn", 100]], density: 7.31, hardness: 1.5, state: "solid", kind: "metal" },
  bronze: { id: "bronze", name: "бронза", bits: [["Cu", 90], ["Sn", 10]], density: 8.7, hardness: 3.2, state: "solid", kind: "metal" },
  plastic: { id: "plastic", name: "пластмасса", bits: [["C", 86], ["H", 14]], density: 0.95, hardness: 1.2, state: "solid", kind: "polymer" },
};

export function stuff(id) {
  return STUFF[id];
}
