import type { Ball, ParamDef } from "../engine/types";
import { AR, CX, CY, TAU, type World } from "../engine/world";

export const P = (key: string, en: string, tr: string, min: number, max: number, step: number, def: number): ParamDef => ({
  key,
  label: { en, tr },
  min,
  max,
  step,
  def,
});

// Shared param definitions
export const pGravity = (def = 900, max = 3000) => P("gravity", "Gravity", "Yerçekimi", 0, max, 50, def);
export const pSpeed = (def = 500) => P("speed", "Ball speed", "Top hızı", 100, 1400, 25, def);
export const pSize = (def = 7) => P("size", "Ball size", "Top boyutu", 2, 18, 1, def);
export const pCount = (def = 200, max = 600) => P("count", "Ball count", "Top sayısı", 10, max, 10, def);
export const pCap = (def = 800, max = 1500) => P("cap", "Max balls", "Maks. top", 50, max, 50, def);
export const pSpin = (def = 1.6) => P("spin", "Rotation speed", "Dönüş hızı", -6, 6, 0.1, def);

export const NEON = ["#ff3d7f", "#ffcd3c", "#3cf0ff", "#7cff6b", "#b46bff", "#ff8a3c"];
export const TEAM = ["#ff3d5a", "#3c9bff", "#ffd23c", "#3cff8a", "#c25cff", "#ff8a3c"];

export const hsl = (h: number, s = 95, l = 60) => `hsl(${Math.round(((h % 360) + 360) % 360)},${s}%,${l}%)`;

export function arena(w: World, color = "#ffffff", th = 6) {
  return w.ring({ R: AR, th, color, tag: "arena" });
}

export function randInDisk(w: World, R = AR - 30, cx = CX, cy = CY) {
  const a = w.rand(0, TAU);
  const r = Math.sqrt(w.rng()) * R;
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
}

export function fillDisk(w: World, n: number, speed: number, opts: { R?: number; r?: number; colors?: string[]; tag?: (i: number) => number } = {}) {
  const colors = opts.colors ?? w.palette;
  for (let i = 0; i < n; i++) {
    const p = randInDisk(w, opts.R ?? AR - 30);
    const a = w.rand(0, TAU);
    const sp = speed * w.rand(0.5, 1);
    w.addBall({
      x: p.x,
      y: p.y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: opts.r,
      color: colors[i % colors.length],
      tag: opts.tag ? opts.tag(i) : i % colors.length,
    });
  }
}

export function fillBox(w: World, n: number, x0: number, y0: number, x1: number, y1: number, speed = 100, r?: number) {
  for (let i = 0; i < n; i++) {
    const a = w.rand(0, TAU);
    w.addBall({
      x: w.rand(x0, x1),
      y: w.rand(y0, y1),
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      r,
      color: w.palette[i % w.palette.length],
    });
  }
}

export function defaultTap(w: World, x: number, y: number) {
  const a = w.rand(0, TAU);
  const b = w.addBall({ x, y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300 });
  if (b) {
    w.ringFx(x, y, b.color, 8);
    w.sound("pop", 0.6);
  }
}

export function speedOf(b: Ball) {
  return Math.hypot(b.vx, b.vy);
}

export function fmtTime(t: number) {
  const s = Math.floor(t);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export const log2i = (n: number) => Math.floor(Math.log2(Math.max(1, n)));

/** split a ball into two (rotate velocity of original, clone with opposite rotation) */
export function splitBall(w: World, b: Ball, spread: number, extra: Partial<Parameters<World["addBall"]>[0]> = {}) {
  const c = w.cloneBall(b, -spread, extra);
  if (!c) return null;
  w.rotateVel(b, spread);
  return c;
}
