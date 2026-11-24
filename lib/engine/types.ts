export type Lang = "en" | "tr";
export type SoundStyle = "marimba" | "pop" | "tick" | "synth";
export type SoundKind = "hit" | "split" | "pop" | "tick" | "boom" | "chime";
export type Category = "multiply" | "obstacle" | "race" | "physics";

export interface Ball {
  id: number;
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  /** cooldown in seconds (split / clone protection) */
  cd: number;
  hp: number;
  /** free integer used by machines (team, generation, ...) */
  tag: number;
  /** bitmask used by machines (gates passed, ...) */
  mask: number;
  age: number;
  dead: boolean;
}

export interface Seg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  th: number;
  /** rotation pivot + angular velocity (for surface velocity) */
  cx: number;
  cy: number;
  omega: number;
  /** linear velocity of the whole segment */
  vx: number;
  vy: number;
  e: number;
  color: string;
  /** if set, balls moving along this direction pass through */
  oneWay: { nx: number; ny: number } | null;
  tag: string;
  visible: boolean;
  hit: number;
  solid: boolean;
}

export interface Bumper {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  /** radial growth velocity (px/s) */
  rv: number;
  /** extra outward kick on contact */
  boost: number;
  e: number;
  color: string;
  tag: string;
  hit: number;
  visible: boolean;
  solid: boolean;
}

export interface Ring {
  cx: number;
  cy: number;
  R: number;
  th: number;
  rot: number;
  omega: number;
  /** gaps in local angle (radians, 0..2PI) */
  gaps: [number, number][];
  bricks: { n: number; hp: number[]; max: number } | null;
  e: number;
  color: string;
  tag: string;
  hit: number;
  visible: boolean;
  /** tangential grip with rotating surface (0..1) */
  grip: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  r: number;
  color: string;
  kind: "ring" | "dot" | "text";
  text?: string;
}

export interface SoundEvent {
  kind: SoundKind;
  vol: number;
  pitch: number;
}

export interface HudStat {
  k: string;
  v: string;
  color?: string;
}

export interface Hud {
  main: string;
  label: string;
  progress?: number;
  stats?: HudStat[];
  banner?: string;
  bars?: { color: string; value: number }[];
}

export interface MachineInstance {
  /** called every physics sub-step, before integration */
  step?(dt: number): void;
  /** called once per rendered frame */
  frame?(dt: number): void;
  onRing?(b: Ball, ring: Ring, impact: number, brick: number): void;
  onSeg?(b: Ball, seg: Seg, impact: number): void;
  onBumper?(b: Ball, bump: Bumper, impact: number): void;
  onBall?(a: Ball, b: Ball, impact: number): void;
  onExit?(b: Ball): void;
  onTap?(x: number, y: number): void;
  drawBack?(ctx: CanvasRenderingContext2D): void;
  drawFront?(ctx: CanvasRenderingContext2D): void;
  hud(): Hud;
  done?(): boolean;
}

export interface ParamDef {
  key: string;
  label: { en: string; tr: string };
  min: number;
  max: number;
  step: number;
  def: number;
}

export type Params = Record<string, number>;

export interface MachineDef {
  id: string;
  num: number;
  name: string;
  category: Category;
  desc: { en: string; tr: string };
  hook: { en: string; tr: string };
  sound: SoundStyle;
  accent: string;
  params: ParamDef[];
  create(w: import("./world").World, p: Params): MachineInstance;
}
