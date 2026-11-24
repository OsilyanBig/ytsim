import { H, TAU, W, normAngle, type World } from "./world";
import type { Ball, Hud, Ring } from "./types";

const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

export interface RenderMeta {
  name: string;
  num: number;
  accent: string;
  hook: string;
  showHud: boolean;
  showHook: boolean;
}

function solidArcs(r: Ring): [number, number][] {
  if (!r.gaps.length) return [[0, TAU]];
  const gaps = r.gaps
    .map(([a, b]) => [normAngle(a), normAngle(b)] as [number, number])
    .flatMap(([a, b]) => (a <= b ? [[a, b] as [number, number]] : [[a, TAU] as [number, number], [0, b] as [number, number]]))
    .sort((p, q) => p[0] - q[0]);
  const out: [number, number][] = [];
  let cur = 0;
  for (const [a, b] of gaps) {
    if (a > cur) out.push([cur, a]);
    cur = Math.max(cur, b);
  }
  if (cur < TAU) out.push([cur, TAU]);
  return out;
}

function drawRing(ctx: CanvasRenderingContext2D, r: Ring) {
  ctx.lineCap = "round";
  if (r.bricks) {
    const n = r.bricks.n;
    const step = TAU / n;
    for (let i = 0; i < n; i++) {
      const hp = r.bricks.hp[i];
      if (hp <= 0) continue;
      const k = hp / r.bricks.max;
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = 0.25 + 0.75 * k;
      ctx.lineWidth = r.th;
      ctx.beginPath();
      ctx.arc(r.cx, r.cy, r.R, r.rot + i * step + 0.02, r.rot + (i + 1) * step - 0.02);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    return;
  }
  ctx.strokeStyle = r.color;
  ctx.lineWidth = r.th;
  if (r.hit > 0) {
    ctx.shadowColor = r.color;
    ctx.shadowBlur = 14 * r.hit;
  }
  for (const [a, b] of solidArcs(r)) {
    ctx.beginPath();
    ctx.arc(r.cx, r.cy, r.R, r.rot + a, r.rot + b);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function drawBalls(ctx: CanvasRenderingContext2D, balls: Ball[]) {
  const groups = new Map<string, Ball[]>();
  for (const b of balls) {
    let g = groups.get(b.color);
    if (!g) groups.set(b.color, (g = []));
    g.push(b);
  }
  for (const [color, list] of groups) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const b of list) {
      ctx.moveTo(b.x + b.r, b.y);
      ctx.arc(b.x, b.y, b.r, 0, TAU);
    }
    ctx.fill();
  }
  if (balls.length < 600) {
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.beginPath();
    for (const b of balls) {
      if (b.r < 3) continue;
      const hr = b.r * 0.35;
      ctx.moveTo(b.x - b.r * 0.3 + hr, b.y - b.r * 0.3);
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, hr, 0, TAU);
    }
    ctx.fill();
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHud(ctx: CanvasRenderingContext2D, hud: Hud, meta: RenderMeta) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  // badge
  ctx.font = `700 15px ${FONT}`;
  const title = `#${String(meta.num).padStart(2, "0")}  ${meta.name.toUpperCase()}`;
  const tw = ctx.measureText(title).width + 28;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(ctx, W / 2 - tw / 2, 26, tw, 28, 14);
  ctx.fill();
  ctx.fillStyle = meta.accent;
  ctx.fillText(title, W / 2, 45);

  // main counter
  ctx.font = `900 76px ${FONT}`;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = meta.accent;
  ctx.shadowBlur = 24;
  ctx.fillText(hud.main, W / 2, 134);
  ctx.shadowBlur = 0;
  ctx.font = `800 15px ${FONT}`;
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillText(hud.label.toUpperCase(), W / 2, 158);

  let y = 172;
  if (hud.progress !== undefined) {
    const bw = 300;
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    roundRect(ctx, W / 2 - bw / 2, y, bw, 10, 5);
    ctx.fill();
    ctx.fillStyle = meta.accent;
    roundRect(ctx, W / 2 - bw / 2, y, Math.max(10, bw * Math.min(1, hud.progress)), 10, 5);
    ctx.fill();
    y += 22;
  }
  if (hud.bars && hud.bars.length) {
    const bw = 360;
    const tot = hud.bars.reduce((s, b) => s + b.value, 0) || 1;
    let x = W / 2 - bw / 2;
    ctx.save();
    roundRect(ctx, x, y, bw, 12, 6);
    ctx.clip();
    for (const b of hud.bars) {
      const w = (b.value / tot) * bw;
      ctx.fillStyle = b.color;
      ctx.fillRect(x, y, w + 0.5, 12);
      x += w;
    }
    ctx.restore();
    y += 24;
  }
  if (hud.stats && hud.stats.length) {
    ctx.font = `700 14px ${FONT}`;
    const parts = hud.stats;
    const gap = 16;
    const widths = parts.map((s) => ctx.measureText(`${s.k} ${s.v}`).width);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
    let x = W / 2 - total / 2;
    ctx.textAlign = "left";
    parts.forEach((s, i) => {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText(s.k, x, y + 12);
      const kw = ctx.measureText(s.k + " ").width;
      ctx.fillStyle = s.color ?? "#ffffff";
      ctx.fillText(s.v, x + kw, y + 12);
      x += widths[i] + gap;
    });
    ctx.textAlign = "center";
  }
  if (hud.banner) {
    ctx.font = `900 34px ${FONT}`;
    ctx.fillStyle = meta.accent;
    ctx.shadowColor = meta.accent;
    ctx.shadowBlur = 20;
    ctx.fillText(hud.banner, W / 2, 900);
    ctx.shadowBlur = 0;
  }
}

export function render(ctx: CanvasRenderingContext2D, w: World, scale: number, meta: RenderMeta) {
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  if (w.trail > 0) {
    ctx.fillStyle = w.bg[1];
    ctx.globalAlpha = w.trail;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, w.bg[0]);
    g.addColorStop(1, w.bg[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.save();
  if (w.shake > 0) ctx.translate((w.rng() - 0.5) * w.shake, (w.rng() - 0.5) * w.shake);

  w.m?.drawBack?.(ctx);

  for (const r of w.rings) if (r.visible) drawRing(ctx, r);

  ctx.lineCap = "round";
  for (const s of w.segs) {
    if (!s.visible) continue;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.th;
    if (s.hit > 0) {
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 16 * s.hit;
    }
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2, s.y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  for (const p of w.bumpers) {
    if (!p.visible) continue;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = 0.18 + 0.5 * p.hit;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 4 + p.hit * 6, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, TAU);
    ctx.fill();
  }

  drawBalls(ctx, w.balls);

  for (const p of w.particles) {
    const k = p.life / p.max;
    ctx.globalAlpha = Math.max(0, k);
    if (p.kind === "ring") {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3 * k + 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + (1 - k) * p.r * 5, 0, TAU);
      ctx.stroke();
    } else if (p.kind === "text") {
      ctx.fillStyle = p.color;
      ctx.font = `900 ${p.r}px ${FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(p.text ?? "", p.x, p.y);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  w.m?.drawFront?.(ctx);
  ctx.restore();

  if (w.flash > 0) {
    ctx.fillStyle = w.flashColor;
    ctx.globalAlpha = w.flash * 0.25;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  if (meta.showHud && w.m) {
    if (w.trail > 0) {
      // keep HUD band crisp when trails are on
      ctx.fillStyle = w.bg[0];
      ctx.fillRect(0, 0, W, 230);
    }
    drawHud(ctx, w.m.hud(), meta);
  }

  if (meta.showHook && w.time < 3.2 && meta.hook) {
    const k = Math.min(1, (3.2 - w.time) / 0.5);
    ctx.globalAlpha = k;
    ctx.font = `900 30px ${FONT}`;
    ctx.textAlign = "center";
    const tw = Math.min(W - 40, ctx.measureText(meta.hook).width + 40);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    roundRect(ctx, W / 2 - tw / 2, 862, tw, 52, 16);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(meta.hook, W / 2, 899, W - 60);
    ctx.globalAlpha = 1;
  }
}
