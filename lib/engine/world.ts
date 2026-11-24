import type {
  Ball,
  Bumper,
  Lang,
  MachineInstance,
  Particle,
  Ring,
  Seg,
  SoundEvent,
  SoundKind,
} from "./types";

export const W = 540;
export const H = 960;
export const TAU = Math.PI * 2;

/** Default arena placement (below HUD band) */
export const CX = 270;
export const CY = 590;
export const AR = 238;

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function normAngle(a: number) {
  a %= TAU;
  return a < 0 ? a + TAU : a;
}

export function angleIn(a: number, a0: number, a1: number) {
  a = normAngle(a);
  a0 = normAngle(a0);
  a1 = normAngle(a1);
  return a0 <= a1 ? a >= a0 && a <= a1 : a >= a0 || a <= a1;
}

export interface BallOpts {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  r?: number;
  color?: string;
  tag?: number;
  hp?: number;
  cd?: number;
  mask?: number;
}

export class World {
  balls: Ball[] = [];
  segs: Seg[] = [];
  bumpers: Bumper[] = [];
  rings: Ring[] = [];
  particles: Particle[] = [];
  sounds: SoundEvent[] = [];

  gravity = { x: 0, y: 900 };
  wind = { x: 0, y: 0 };
  attractor: { x: number; y: number; k: number; soft: number } | null = null;
  damping = 0;
  restitution = 1;
  ballE = 0.92;
  ballCollide = false;
  maxBalls = 1000;
  maxSpeed = 1500;
  minSpeed = 0;
  ballR = 7;
  /** 0 = clear every frame, else alpha used to fade previous frame (motion trails) */
  trail = 0;
  bg: [string, string] = ["#0b0b1a", "#05050c"];
  palette: string[] = ["#ff3d7f", "#ffcd3c", "#3cf0ff", "#7cff6b", "#b46bff", "#ff8a3c"];
  lang: Lang = "en";
  shake = 0;
  flash = 0;
  flashColor = "#ffffff";

  time = 0;
  nextId = 1;
  rng: () => number;
  m: MachineInstance | null = null;
  totalSpawned = 0;
  peakImpact = 0;

  // spatial grid buffers
  private head = new Int32Array(0);
  private next = new Int32Array(0);

  constructor(seed = 1) {
    this.rng = mulberry32(seed);
  }

  get count() {
    return this.balls.length;
  }

  rand(a = 0, b = 1) {
    return a + (b - a) * this.rng();
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.rng() * arr.length) % arr.length];
  }

  tl(en: string, tr: string) {
    return this.lang === "tr" ? tr : en;
  }

  addBall(o: BallOpts): Ball | null {
    if (this.balls.length >= this.maxBalls) return null;
    const b: Ball = {
      id: this.nextId++,
      x: o.x,
      y: o.y,
      px: o.x,
      py: o.y,
      vx: o.vx ?? 0,
      vy: o.vy ?? 0,
      r: o.r ?? this.ballR,
      color: o.color ?? this.palette[(this.nextId - 1) % this.palette.length],
      cd: o.cd ?? 0,
      hp: o.hp ?? 1,
      tag: o.tag ?? 0,
      mask: o.mask ?? 0,
      age: 0,
      dead: false,
    };
    this.balls.push(b);
    this.totalSpawned++;
    return b;
  }

  /** clone a ball with its velocity rotated by `ang` */
  cloneBall(b: Ball, ang: number, extra: Partial<BallOpts> = {}): Ball | null {
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    return this.addBall({
      x: b.x,
      y: b.y,
      vx: b.vx * c - b.vy * s,
      vy: b.vx * s + b.vy * c,
      r: b.r,
      color: b.color,
      tag: b.tag,
      mask: b.mask,
      cd: b.cd,
      hp: b.hp,
      ...extra,
    });
  }

  rotateVel(b: Ball, ang: number) {
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const vx = b.vx * c - b.vy * s;
    b.vy = b.vx * s + b.vy * c;
    b.vx = vx;
  }

  ring(o: Partial<Ring> & { R: number }): Ring {
    const r: Ring = {
      cx: CX,
      cy: CY,
      th: 6,
      rot: 0,
      omega: 0,
      gaps: [],
      bricks: null,
      e: 1,
      color: "#ffffff",
      tag: "",
      hit: 0,
      visible: true,
      grip: 0,
      ...o,
    };
    this.rings.push(r);
    return r;
  }

  seg(o: Partial<Seg> & { x1: number; y1: number; x2: number; y2: number }): Seg {
    const s: Seg = {
      th: 8,
      cx: (o.x1 + o.x2) / 2,
      cy: (o.y1 + o.y2) / 2,
      omega: 0,
      vx: 0,
      vy: 0,
      e: 1,
      color: "#ffffff",
      oneWay: null,
      tag: "",
      visible: true,
      hit: 0,
      solid: true,
      ...o,
    };
    this.segs.push(s);
    return s;
  }

  /** rotating bar through pivot with half-length `len` */
  setBar(s: Seg, cx: number, cy: number, ang: number, len: number, inner = 0) {
    const c = Math.cos(ang);
    const sn = Math.sin(ang);
    s.x1 = cx + c * inner;
    s.y1 = cy + sn * inner;
    s.x2 = cx + c * len;
    s.y2 = cy + sn * len;
    s.cx = cx;
    s.cy = cy;
  }

  bumper(o: Partial<Bumper> & { x: number; y: number; r: number }): Bumper {
    const b: Bumper = {
      vx: 0,
      vy: 0,
      rv: 0,
      boost: 0,
      e: 1,
      color: "#ffffff",
      tag: "",
      hit: 0,
      visible: true,
      solid: true,
      ...o,
    };
    this.bumpers.push(b);
    return b;
  }

  box(x0: number, y0: number, x1: number, y1: number, color = "#ffffff", th = 8) {
    return [
      this.seg({ x1: x0, y1: y0, x2: x1, y2: y0, th, color, tag: "wall" }),
      this.seg({ x1: x1, y1: y0, x2: x1, y2: y1, th, color, tag: "wall" }),
      this.seg({ x1: x1, y1: y1, x2: x0, y2: y1, th, color, tag: "wall" }),
      this.seg({ x1: x0, y1: y1, x2: x0, y2: y0, th, color, tag: "wall" }),
    ];
  }

  sound(kind: SoundKind, vol: number, pitch = -1) {
    if (this.sounds.length > 64) return;
    this.sounds.push({ kind, vol: Math.max(0, Math.min(1, vol)), pitch });
  }

  burst(x: number, y: number, color: string, n = 6, speed = 160) {
    if (this.particles.length > 400) n = 1;
    for (let i = 0; i < n; i++) {
      const a = this.rng() * TAU;
      const sp = speed * (0.4 + this.rng() * 0.8);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.5,
        max: 0.5,
        r: 2 + this.rng() * 2,
        color,
        kind: "dot",
      });
    }
  }

  ringFx(x: number, y: number, color: string, r = 10, life = 0.35) {
    if (this.particles.length > 500) return;
    this.particles.push({ x, y, vx: 0, vy: 0, life, max: life, r, color, kind: "ring" });
  }

  textFx(x: number, y: number, text: string, color = "#ffffff") {
    if (this.particles.length > 500) return;
    this.particles.push({ x, y, vx: 0, vy: -60, life: 0.8, max: 0.8, r: 18, color, kind: "text", text });
  }

  shockwave(x: number, y: number, power: number, radius: number) {
    for (const b of this.balls) {
      const dx = b.x - x;
      const dy = b.y - y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > radius) continue;
      const f = power * (1 - d / radius);
      b.vx += (dx / d) * f;
      b.vy += (dy / d) * f;
    }
    this.ringFx(x, y, "#ffffff", radius * 0.15, 0.5);
    this.shake = Math.max(this.shake, 6);
    this.sound("boom", 0.9);
  }

  // ---------------------------------------------------------------- physics
  step(dt: number) {
    const m = this.m;
    this.time += dt;
    m?.step?.(dt);

    const gx = this.gravity.x + this.wind.x;
    const gy = this.gravity.y + this.wind.y;
    const damp = this.damping > 0 ? Math.max(0, 1 - this.damping * dt) : 1;
    const maxV = this.maxSpeed;
    const att = this.attractor;

    for (const b of this.balls) {
      b.px = b.x;
      b.py = b.y;
      b.vx += gx * dt;
      b.vy += gy * dt;
      if (att) {
        const dx = att.x - b.x;
        const dy = att.y - b.y;
        const d2 = dx * dx + dy * dy + att.soft * att.soft;
        const inv = att.k / (d2 * Math.sqrt(d2));
        b.vx += dx * inv * dt;
        b.vy += dy * inv * dt;
      }
      if (damp !== 1) {
        b.vx *= damp;
        b.vy *= damp;
      }
      const sp2 = b.vx * b.vx + b.vy * b.vy;
      if (sp2 > maxV * maxV) {
        const k = maxV / Math.sqrt(sp2);
        b.vx *= k;
        b.vy *= k;
      } else if (this.minSpeed > 0 && sp2 < this.minSpeed * this.minSpeed && sp2 > 1e-6) {
        const k = this.minSpeed / Math.sqrt(sp2);
        b.vx *= k;
        b.vy *= k;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.cd > 0) b.cd -= dt;
      b.age += dt;
    }

    for (const r of this.rings) r.rot += r.omega * dt;

    if (this.ballCollide) this.collideBalls();

    // iterate over a snapshot length so that spawned balls are skipped this step
    const n = this.balls.length;
    for (let i = 0; i < n; i++) {
      const b = this.balls[i];
      if (b.dead) continue;
      for (const s of this.segs) if (s.solid) this.collideSeg(b, s);
      for (const p of this.bumpers) if (p.solid) this.collideBumper(b, p);
      // rings last: containment wins over pushes from bars / bumpers
      for (const r of this.rings) this.collideRing(b, r);
      if (b.y > H + 120 || b.y < -400 || b.x < -200 || b.x > W + 200) {
        b.dead = true;
        m?.onExit?.(b);
      }
    }
  }

  private collideRing(b: Ball, r: Ring) {
    const dx = b.x - r.cx;
    const dy = b.y - r.cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    const half = r.th / 2;
    if (d < 1e-6) return;
    const pdx0 = b.px - r.cx;
    const pdy0 = b.py - r.cy;
    const wasInside = pdx0 * pdx0 + pdy0 * pdy0 < r.R * r.R;
    // arena rings hard-contain balls that were inside last step (prevents leaks under heavy pressure)
    const forced = r.tag === "arena" && wasInside && d > r.R;
    if (!forced && Math.abs(d - r.R) > b.r + half) return;
    const local = normAngle(Math.atan2(dy, dx) - r.rot);
    let brick = -1;
    let open = false;
    if (r.bricks) {
      brick = Math.floor(local / (TAU / r.bricks.n)) % r.bricks.n;
      if (r.bricks.hp[brick] <= 0) open = true;
    }
    if (!open) {
      for (const g of r.gaps) {
        if (angleIn(local, g[0], g[1])) {
          open = true;
          // end-caps: collide with the gap edges as small circles
          const aw = Math.asin(Math.min(1, b.r / r.R));
          if (!angleIn(local - aw, g[0], g[1]) || !angleIn(local + aw, g[0], g[1])) {
            const edge =
              Math.abs(normAngle(local - g[0])) < Math.abs(normAngle(g[1] - local)) ? g[0] : g[1];
            const ea = edge + r.rot;
            const ex = r.cx + Math.cos(ea) * r.R;
            const ey = r.cy + Math.sin(ea) * r.R;
            this.collidePoint(b, ex, ey, half, r.e);
          }
          break;
        }
      }
    }
    if (open) return;
    const pdx = b.px - r.cx;
    const pdy = b.py - r.cy;
    const inside = pdx * pdx + pdy * pdy < r.R * r.R;
    const nx = dx / d;
    const ny = dy / d;
    const target = inside ? r.R - half - b.r : r.R + half + b.r;
    b.x = r.cx + nx * target;
    b.y = r.cy + ny * target;
    const Nx = inside ? -nx : nx;
    const Ny = inside ? -ny : ny;
    // rotating surface velocity
    const svx = -r.omega * (b.y - r.cy);
    const svy = r.omega * (b.x - r.cx);
    const rvx = b.vx - svx;
    const rvy = b.vy - svy;
    const vn = rvx * Nx + rvy * Ny;
    if (vn < 0) {
      b.vx -= (1 + r.e * this.restitution) * vn * Nx;
      b.vy -= (1 + r.e * this.restitution) * vn * Ny;
      if (r.grip > 0) {
        const tx = -Ny;
        const ty = Nx;
        const vt = rvx * tx + rvy * ty;
        b.vx -= vt * r.grip * tx;
        b.vy -= vt * r.grip * ty;
      }
      const imp = -vn;
      if (imp > this.peakImpact) this.peakImpact = imp;
      r.hit = 1;
      this.m?.onRing?.(b, r, imp, brick);
    }
  }

  private collidePoint(b: Ball, x: number, y: number, pr: number, e: number) {
    const dx = b.x - x;
    const dy = b.y - y;
    const rad = b.r + pr;
    const d2 = dx * dx + dy * dy;
    if (d2 >= rad * rad || d2 < 1e-9) return;
    const d = Math.sqrt(d2);
    const nx = dx / d;
    const ny = dy / d;
    b.x = x + nx * rad;
    b.y = y + ny * rad;
    const vn = b.vx * nx + b.vy * ny;
    if (vn < 0) {
      b.vx -= (1 + e) * vn * nx;
      b.vy -= (1 + e) * vn * ny;
    }
  }

  private collideSeg(b: Ball, s: Seg) {
    const ex = s.x2 - s.x1;
    const ey = s.y2 - s.y1;
    const len2 = ex * ex + ey * ey;
    if (len2 < 1e-6) return;
    let t = ((b.x - s.x1) * ex + (b.y - s.y1) * ey) / len2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const qx = s.x1 + ex * t;
    const qy = s.y1 + ey * t;
    const dx = b.x - qx;
    const dy = b.y - qy;
    const rad = b.r + s.th / 2;
    const d2 = dx * dx + dy * dy;
    if (d2 >= rad * rad) return;
    if (s.oneWay && b.vx * s.oneWay.nx + b.vy * s.oneWay.ny > 0) return;
    let Nx: number;
    let Ny: number;
    if (t > 0 && t < 1) {
      const len = Math.sqrt(len2);
      const px = -ey / len;
      const py = ex / len;
      // side from previous position (prevents tunneling)
      const side = (b.px - s.x1) * px + (b.py - s.y1) * py;
      const cur = dx * px + dy * py;
      const sgn = Math.abs(side) > 1e-6 ? Math.sign(side) : Math.sign(cur) || 1;
      Nx = px * sgn;
      Ny = py * sgn;
    } else {
      const d = Math.sqrt(d2) || 1;
      Nx = dx / d;
      Ny = dy / d;
    }
    b.x = qx + Nx * rad;
    b.y = qy + Ny * rad;
    const svx = s.vx - s.omega * (qy - s.cy);
    const svy = s.vy + s.omega * (qx - s.cx);
    const rvx = b.vx - svx;
    const rvy = b.vy - svy;
    const vn = rvx * Nx + rvy * Ny;
    if (vn < 0) {
      const k = 1 + s.e * this.restitution;
      b.vx -= k * vn * Nx;
      b.vy -= k * vn * Ny;
      const imp = -vn;
      if (imp > this.peakImpact) this.peakImpact = imp;
      s.hit = 1;
      this.m?.onSeg?.(b, s, imp);
    }
  }

  private collideBumper(b: Ball, p: Bumper) {
    const dx = b.x - p.x;
    const dy = b.y - p.y;
    const rad = b.r + p.r;
    const d2 = dx * dx + dy * dy;
    if (d2 >= rad * rad) return;
    const d = Math.sqrt(d2) || 1;
    const nx = dx / d;
    const ny = dy / d;
    b.x = p.x + nx * rad;
    b.y = p.y + ny * rad;
    const svx = p.vx + nx * p.rv;
    const svy = p.vy + ny * p.rv;
    const rvx = b.vx - svx;
    const rvy = b.vy - svy;
    const vn = rvx * nx + rvy * ny;
    if (vn < 0) {
      const k = 1 + p.e * this.restitution;
      b.vx -= k * vn * nx;
      b.vy -= k * vn * ny;
      if (p.boost) {
        b.vx += nx * p.boost;
        b.vy += ny * p.boost;
      }
      p.hit = 1;
      const imp = -vn;
      if (imp > this.peakImpact) this.peakImpact = imp;
      this.m?.onBumper?.(b, p, imp);
    }
  }

  private collideBalls() {
    const balls = this.balls;
    const n = balls.length;
    if (n < 2) return;
    let maxR = 4;
    for (let i = 0; i < n; i++) if (balls[i].r > maxR) maxR = balls[i].r;
    const cs = Math.max(12, maxR * 2);
    const x0 = -200;
    const y0 = -400;
    const cols = Math.ceil((W + 400) / cs);
    const rows = Math.ceil((H + 600) / cs);
    const cells = cols * rows;
    if (this.head.length < cells) this.head = new Int32Array(cells);
    if (this.next.length < n) this.next = new Int32Array(Math.max(n, 256) * 2);
    const head = this.head;
    const next = this.next;
    head.fill(-1, 0, cells);
    const cellOf = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      const b = balls[i];
      let cx = Math.floor((b.x - x0) / cs);
      let cy = Math.floor((b.y - y0) / cs);
      cx = cx < 0 ? 0 : cx >= cols ? cols - 1 : cx;
      cy = cy < 0 ? 0 : cy >= rows ? rows - 1 : cy;
      const c = cx + cy * cols;
      cellOf[i] = c;
      next[i] = head[c];
      head[c] = i;
    }
    const e = this.ballE;
    const m = this.m;
    for (let i = 0; i < n; i++) {
      const a = balls[i];
      if (a.dead) continue;
      const c = cellOf[i];
      const cx = c % cols;
      const cy = (c - cx) / cols;
      for (let oy = -1; oy <= 1; oy++) {
        const yy = cy + oy;
        if (yy < 0 || yy >= rows) continue;
        for (let ox = -1; ox <= 1; ox++) {
          const xx = cx + ox;
          if (xx < 0 || xx >= cols) continue;
          let j = head[xx + yy * cols];
          while (j !== -1) {
            if (j > i) {
              const b = balls[j];
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const rr = a.r + b.r;
              const d2 = dx * dx + dy * dy;
              if (d2 < rr * rr && d2 > 1e-9 && !b.dead) {
                const d = Math.sqrt(d2);
                const nx = dx / d;
                const ny = dy / d;
                const ma = a.r * a.r;
                const mb = b.r * b.r;
                const tot = ma + mb;
                const ov = rr - d;
                a.x -= nx * ov * (mb / tot);
                a.y -= ny * ov * (mb / tot);
                b.x += nx * ov * (ma / tot);
                b.y += ny * ov * (ma / tot);
                const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
                if (rv < 0) {
                  const jimp = (-(1 + e) * rv) / (1 / ma + 1 / mb);
                  a.vx -= (jimp / ma) * nx;
                  a.vy -= (jimp / ma) * ny;
                  b.vx += (jimp / mb) * nx;
                  b.vy += (jimp / mb) * ny;
                  m?.onBall?.(a, b, -rv);
                }
              }
            }
            j = next[j];
          }
        }
      }
    }
  }

  /** once per frame: cleanup + particles */
  frame(dt: number) {
    if (this.balls.some((b) => b.dead)) this.balls = this.balls.filter((b) => !b.dead);
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === "dot") p.vy += 300 * dt;
    }
    if (this.particles.length) this.particles = this.particles.filter((p) => p.life > 0);
    for (const s of this.segs) s.hit = Math.max(0, s.hit - dt * 4);
    for (const r of this.rings) r.hit = Math.max(0, r.hit - dt * 4);
    for (const p of this.bumpers) p.hit = Math.max(0, p.hit - dt * 4);
    this.shake = Math.max(0, this.shake - dt * 30);
    this.flash = Math.max(0, this.flash - dt * 3);
    this.m?.frame?.(dt);
  }
}
