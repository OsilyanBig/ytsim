import type { Category, MachineDef, Params } from "../engine/types";
import { multiplyMachines } from "./multiply";
import { obstacleMachines } from "./obstacles";
import { raceMachines } from "./race";
import { physicsMachines } from "./physics";

/** Central machine registry — add a MachineDef to any category file and it shows up everywhere. */
export const MACHINES: MachineDef[] = [...multiplyMachines, ...obstacleMachines, ...raceMachines, ...physicsMachines].sort(
  (a, b) => a.num - b.num,
);

export const CATEGORIES: { id: Category; en: string; tr: string }[] = [
  { id: "multiply", en: "Multiply & Double", tr: "Çoğalma & Katlanma" },
  { id: "obstacle", en: "Spinners & Barriers", tr: "Pervane & Engeller" },
  { id: "race", en: "Color Race & Overflow", tr: "Renk Yarışı & Taşma" },
  { id: "physics", en: "Gravity & Interaction", tr: "Yerçekimi & Etkileşim" },
];

export function getMachine(id: string | null | undefined): MachineDef | undefined {
  return MACHINES.find((m) => m.id === id);
}

export function defaultParams(m: MachineDef): Params {
  const p: Params = {};
  for (const d of m.params) p[d.key] = d.def;
  return p;
}
