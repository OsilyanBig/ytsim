import type { Ball, MachineDef, Seg } from "../engine/types";
import { AR, CX, CY, TAU, type World } from "../engine/world";
import {
  NEON,
  P,
  arena,
  defaultTap,
  fmtTime,
  hsl,
  log2i,
  pCap,
  pGravity,
  pSize,
  pSpeed,
  pSpin,
  speedOf,
  splitBall,
} from "./helpers";

// 1 ─────────────────────────────────────────────────────────────
const bounce2: MachineDef = {
  id: "bounce-double",
  num: 1,
  name: "1 Bounce = 2 Balls",
  category: "multiply",
  accent: "#ffcd3c",
  sound: "marimba",
  desc: { en: "Every wall bounce doubles the ball. Race to 1024.", tr: "Her sekme topu ikiye katlar. Hedef 1024." },
  hook: { en: "1 ball → 1024?", tr: "1 top → 1024?" },
  params: [pGravity(700), pSpeed(520), pSize(6), P("target", "Target", "Hedef", 64, 2048, 64, 1024)],
  create(w, p) {
    const target = p.target;
    w.gravity.y = p.gravity;
    w.maxBalls = target;
    w.ballR = p.size;
    const ring = arena(w, "#ffcd3c");
    let bounces = 0;
    w.addBall({ x: CX, y: CY - 60, vx: p.speed * 0.55, vy: -p.speed * 0.4, color: hsl(45) });
    return {
      onRing(b) {
        bounces++;
        if (b.cd <= 0 && w.count < target) {
          const c = splitBall(w, b, w.rand(0.08, 0.22), { color: hsl(45 + log2i(w.count + 1) * 32) });
          b.cd = c ? 0.12 : 0;
          if (c) c.cd = 0.12;
          b.color = hsl(45 + log2i(w.count) * 32);
          w.sound("split", 0.7, log2i(w.count) + 3);
          if (w.count < 300) w.ringFx(b.x, b.y, b.color, 5);
        } else w.sound("hit", 0.25);
        ring.color = b.color;
      },
      onTap: (x, y) => defaultTap(w, x, y),
      hud: () => ({
        main: String(w.count),
        label: w.tl(`balls / ${target}`, `top / ${target}`),
        progress: w.count / target,
        stats: [
          { k: w.tl("BOUNCES", "SEKME"), v: String(bounces) },
          { k: w.tl("TIME", "SÜRE"), v: fmtTime(w.time) },
        ],
        banner: w.count >= target ? w.tl("TARGET HIT!", "HEDEF TAMAM!") : undefined,
      }),
      done: () => w.count >= target,
    };
  },
};

// 2 ─────────────────────────────────────────────────────────────
const wallSplit: MachineDef = {
  id: "wall-hit-split",
  num: 2,
  name: "Wall Hit Split",
  category: "multiply",
  accent: "#3cf0ff",
  sound: "pop",
  desc: { en: "Balls split when they hit the rotating outer wall.", tr: "Dönen dış çembere çarpan toplar ikiye bölünür." },
  hook: { en: "Every hit = split", tr: "Her çarpma = bölünme" },
  params: [pSpeed(380), pSize(6), pCap(600, 1200), P("spread", "Split angle", "Bölünme açısı", 0.1, 1.5, 0.05, 0.5)],
  create(w, p) {
    w.gravity.y = 0;
    w.ballCollide = true;
    w.maxBalls = p.cap;
    w.ballR = p.size;
    w.minSpeed = p.speed * 0.6;
    const ring = w.ring({ R: AR, th: 8, color: "#3cf0ff", omega: 0.6, grip: 0.1 });
    let splits = 0;
    w.addBall({ x: CX, y: CY, vx: p.speed, vy: p.speed * 0.3, color: NEON[0] });
    return {
      onRing(b) {
        if (b.cd > 0 || w.count >= p.cap) return w.sound("tick", 0.2);
        const next = NEON[(NEON.indexOf(b.color) + 1) % NEON.length] ?? NEON[0];
        const c = splitBall(w, b, p.spread / 2, { color: next });
        b.color = next;
        b.cd = 0.35;
        if (c) c.cd = 0.35;
        splits++;
        ring.color = next;
        w.sound("pop", 0.6, splits % 15);
      },
      onTap: (x, y) => defaultTap(w, x, y),
      hud: () => ({
        main: String(w.count),
        label: w.tl("balls", "top"),
        progress: w.count / p.cap,
        stats: [
          { k: w.tl("SPLITS", "BÖLÜNME"), v: String(splits) },
          { k: w.tl("TIME", "SÜRE"), v: fmtTime(w.time) },
        ],
      }),
      done: () => w.count >= p.cap,
    };
  },
};

// 3 ─────────────────────────────────────────────────────────────
const spinnerClone: MachineDef = {
  id: "spinner-clone",
  num: 3,
  name: "Spinner Hit Clone",
  category: "multiply",
  accent: "#ff3d7f",
  sound: "synth",
  desc: { en: "A spinning bar clones every ball it smacks.", tr: "Dönen çubuk çarptığı her topu klonlar." },
  hook: { en: "The bar clones everything", tr: "Çubuk her şeyi klonluyor" },
  params: [pGravity(650), pSpin(2.2), pSize(7), pCap(700, 1200)],
  create(w, p) {
    w.gravity.y = p.gravity;
    w.ballCollide = true;
    w.ballE = 0.95;
    w.maxBalls = p.cap;
    w.ballR = p.size;
    arena(w, "#ff3d7f");
    const bar = w.seg({ x1: 0, y1: 0, x2: 0, y2: 0, th: 14, color: "#ffffff" });
    let ang = 0;
    let clones = 0;
    for (let i = 0; i < 3; i++) w.addBall({ x: CX - 100 + i * 100, y: CY - 150, vx: w.rand(-200, 200), vy: 0, color: NEON[i] });
    return {
      step(dt) {
        ang += p.spin * dt;
        w.setBar(bar, CX, CY, ang, 175, -175);
        bar.omega = p.spin;
      },
      onSeg(b, s, imp) {
        if (s !== bar) return;
        if (b.cd <= 0 && imp > 60) {
          const c = splitBall(w, b, 0.35, { color: NEON[(clones + 1) % NEON.length] });
          b.cd = 0.4;
          if (c) {
            c.cd = 0.4;
            clones++;
          }
          w.sound("split", 0.6, clones % 12);
          w.ringFx(b.x, b.y, "#ffffff", 4);
        } else w.sound("hit", Math.min(1, imp / 800));
      },
      onRing: (_b, _r, imp) => w.sound("tick", Math.min(0.5, imp / 1500)),
      onTap: (x, y) => defaultTap(w, x, y),
      hud: () => ({
        main: String(w.count),
        label: w.tl("balls", "top"),
        progress: w.count / p.cap,
        stats: [
          { k: w.tl("CLONES", "KLON"), v: String(clones) },
          { k: "RPM", v: String(Math.round(Math.abs(p.spin) * 9.55)) },
        ],
      }),
      done: () => w.count >= p.cap,
    };
  },
};

// 4 ─────────────────────────────────────────────────────────────
const timerBurst: MachineDef = {
  id: "timer-burst",
  num: 4,
  name: "Timer Burst",
  category: "multiply",
  accent: "#7cff6b",
  sound: "marimba",
  desc: { en: "A new wave of balls bursts from the center on a timer.", tr: "Belirli aralıklarla merkezden yeni top dalgası fırlar." },
  hook: { en: "Every 2s… MORE", tr: "Her 2 saniyede… DAHA FAZLA" },
  params: [
    pGravity(500),
    P("interval", "Interval (s)", "Aralık (sn)", 0.5, 6, 0.25, 2),
    P("wave", "Wave size", "Dalga boyutu", 4, 64, 2, 16),
    pSize(7),
    pCap(800, 1200),
  ],
  create(w, p) {
    w.gravity.y = p.gravity;
    w.ballCollide = true;
    w.ballE = 0.9;
    w.maxBalls = p.cap + 100;
    w.ballR = p.size;
    const ring = arena(w, "#7cff6b");
    let wave = 0;
    let t = 0.6;
    let flush = 0;
    const release = () => {
      wave++;
      const n = p.wave;
      const color = hsl(wave * 47);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + wave * 0.3;
        w.addBall({ x: CX + Math.cos(a) * 12, y: CY + Math.sin(a) * 12, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, color });
      }
      w.ringFx(CX, CY, color, 14, 0.6);
      w.sound("chime", 0.8, wave % 10);
      w.flash = 0.6;
      w.flashColor = color;
    };
    return {
      frame(dt) {
        t -= dt;
        if (t <= 0 && flush <= 0) {
          t = p.interval;
          release();
          if (w.count >= p.cap) {
            flush = 3;
            ring.gaps = [[Math.PI / 2 - 0.5, Math.PI / 2 + 0.5]];
          }
        }
        if (flush > 0) {
          flush -= dt;
          if (flush <= 0) ring.gaps = [];
        }
      },
      onRing: (_b, _r, imp) => w.sound("tick", Math.min(0.4, imp / 1500)),
      onTap: (x, y) => defaultTap(w, x, y),
      hud: () => ({
        main: String(w.count),
        label: w.tl(`balls · wave ${wave}`, `top · dalga ${wave}`),
        progress: Math.max(0, 1 - t / p.interval),
        stats: [
          { k: w.tl("NEXT", "SONRAKİ"), v: `${Math.max(0, t).toFixed(1)}s` },
          { k: w.tl("TOTAL", "TOPLAM"), v: String(w.totalSpawned) },
        ],
        banner: flush > 0 ? w.tl("FLUSH!", "BOŞALT!") : undefined,
      }),
      done: () => wave >= 1 && flush > 0,
    };
  },
};

// 5 ─────────────────────────────────────────────────────────────
const sizeDecay: MachineDef = {
  id: "size-decay-split",
  num: 5,
  name: "Size Decay Split",
  category: "multiply",
  accent: "#b46bff",
  sound: "pop",
  desc: { en: "Each split makes balls smaller and faster.", tr: "Her bölünmede toplar küçülür ve hızlanır." },
  hook: { en: "Smaller… and faster", tr: "Küçülüyor… ve hızlanıyor" },
  params: [
    pGravity(350),
    P("startR", "Start size", "Başlangıç boyutu", 20, 80, 2, 54),
    P("shrink", "Shrink factor", "Küçülme oranı", 0.55, 0.9, 0.01, 0.78),
    P("boost", "Speed boost", "Hız artışı", 1, 1.3, 0.01, 1.08),
    pCap(900, 1500),
  ],
  create(w, p) {
    w.gravity.y = p.gravity;
    w.ballCollide = true;
    w.ballE = 0.96;
    w.maxBalls = p.cap;
    w.maxSpeed = 1300;
    arena(w, "#b46bff");
    let minR = p.startR;
    let gen = 0;
    w.addBall({ x: CX, y: CY - 40, vx: 260, vy: -120, r: p.startR, color: hsl(270), tag: 0 });
    return {
      onRing(b) {
        if (b.cd > 0 || b.r * p.shrink < 2.5 || w.count >= p.cap) return w.sound("tick", 0.25);
        b.r *= p.shrink;
        b.vx *= p.boost;
        b.vy *= p.boost;
        b.tag++;
        gen = Math.max(gen, b.tag);
        minR = Math.min(minR, b.r);
        b.color = hsl(270 + b.tag * 28);
        const sp = speedOf(b) || 1;
        // offset perpendicular to velocity so the twins do not overlap
        const ox = (-b.vy / sp) * b.r;
        const oy = (b.vx / sp) * b.r;
        const c = splitBall(w, b, 0.3, { x: b.x - ox, y: b.y - oy });
        b.x += ox;
        b.y += oy;
        b.cd = 0.25;
        if (c) c.cd = 0.25;
        w.sound("pop", 0.7, 12 - Math.min(11, b.tag));
        w.burst(b.x, b.y, b.color, 4, 120);
      },
      onTap: (x, y) => defaultTap(w, x, y),
      hud: () => ({
        main: String(w.count),
        label: w.tl("balls", "top"),
        progress: w.count / p.cap,
        stats: [
          { k: w.tl("GEN", "NESİL"), v: String(gen) },
          { k: w.tl("SIZE", "BOYUT"), v: `${minR.toFixed(1)}px` },
        ],
      }),
      done: () => w.count >= p.cap || minR * p.shrink < 2.5,
    };
  },
};

// 6 ─────────────────────────────────────────────────────────────
const gravityFlip: MachineDef = {
  id: "gravity-flip-duplicator",
  num: 6,
  name: "Gravity Flip Duplicator",
  category: "multiply",
  accent: "#ff8a3c",
  sound: "synth",
  desc: { en: "Gravity rotates 90° on a timer and every ball duplicates.", tr: "Yerçekimi düzenli olarak 90° döner, her dönüşte toplar çoğalır." },
  hook: { en: "Gravity flips = x2", tr: "Yerçekimi döner = x2" },
  params: [pGravity(900), P("interval", "Flip every (s)", "Dönüş aralığı (sn)", 0.8, 6, 0.1, 2.4), pSize(6), pCap(1024, 2048)],
  create(w, p) {
    w.maxBalls = p.cap;
    w.ballR = p.size;
    const ring = arena(w, "#ff8a3c");
    let dir = 0;
    let flips = 0;
    let t = p.interval;
    const apply = () => {
      const a = Math.PI / 2 + dir * (Math.PI / 2);
      w.gravity.x = Math.cos(a) * p.gravity;
      w.gravity.y = Math.sin(a) * p.gravity;
    };
    apply();
    w.addBall({ x: CX, y: CY, vx: 200, vy: 0, color: hsl(25) });
    return {
      frame(dt) {
        t -= dt;
        if (t <= 0) {
          t = p.interval;
          dir = (dir + 1) % 4;
          flips++;
          apply();
          const n = w.count;
          const color = hsl(25 + flips * 40);
          for (let i = 0; i < n; i++) {
            const b = w.balls[i];
            b.color = color;
            const c = w.cloneBall(b, w.rand(-0.6, 0.6), { color });
            if (c) {
              c.vx *= w.rand(0.7, 1.1);
              c.vy *= w.rand(0.7, 1.1);
            }
          }
          ring.color = color;
          w.flash = 1;
          w.flashColor = color;
          w.sound("boom", 0.6);
          w.sound("chime", 0.8, flips % 10);
        }
      },
      onRing: (_b, _r, imp) => w.sound("tick", Math.min(0.35, imp / 2000)),
      drawFront(ctx) {
        const a = Math.atan2(w.gravity.y, w.gravity.x);
        ctx.save();
        ctx.translate(CX, CY);
        ctx.rotate(a);
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(40, 0);
        ctx.lineTo(-10, -22);
        ctx.lineTo(-10, 22);
        ctx.fill();
        ctx.restore();
      },
      onTap: (x, y) => defaultTap(w, x, y),
      hud: () => ({
        main: String(w.count),
        label: w.tl("balls", "top"),
        progress: w.count / p.cap,
        stats: [
          { k: w.tl("FLIPS", "DÖNÜŞ"), v: String(flips) },
          { k: w.tl("NEXT", "SONRAKİ"), v: `${t.toFixed(1)}s` },
        ],
      }),
      done: () => w.count >= p.cap,
    };
  },
};

// 7 ─────────────────────────────────────────────────────────────
interface Gate {
  y: number;
  x: number;
  wdt: number;
  mult: number;
  speed: number;
  color: string;
  hit: number;
}
const gateMultiplier: MachineDef = {
  id: "gate-multiplier",
  num: 7,
  name: "Gate Multiplier",
  category: "multiply",
  accent: "#7cff6b",
  sound: "tick",
  desc: { en: "Balls dropping through moving x2 / x3 gates multiply.", tr: "Hareketli x2 / x3 kapılarından geçen toplar çoğalır." },
  hook: { en: "x2 … x3 … x2 = ?", tr: "x2 … x3 … x2 = ?" },
  params: [pGravity(800), P("rate", "Drops / sec", "Saniyede bırakma", 1, 20, 1, 4), P("gateSpeed", "Gate speed", "Kapı hızı", 0, 400, 10, 140), pSize(6), pCap(900, 1500)],
  create(w, p) {
    w.gravity.y = p.gravity;
    w.ballCollide = true;
    w.ballE = 0.7;
    w.restitution = 0.7;
    w.maxBalls = p.cap;
    w.ballR = p.size;
    const L = 40;
    const R = 500;
    w.seg({ x1: L, y1: 250, x2: L, y2: 960, th: 6, color: "#7cff6b" });
    w.seg({ x1: R, y1: 250, x2: R, y2: 960, th: 6, color: "#7cff6b" });
    const gates: Gate[] = [
      { y: 410, x: 120, wdt: 150, mult: 2, speed: p.gateSpeed, color: "#3cf0ff", hit: 0 },
      { y: 590, x: 300, wdt: 130, mult: 3, speed: -p.gateSpeed * 1.3, color: "#ff3d7f", hit: 0 },
      { y: 770, x: 200, wdt: 160, mult: 2, speed: p.gateSpeed * 0.8, color: "#ffcd3c", hit: 0 },
    ];
    // pegs between gates
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 6; i++) {
        w.bumper({ x: 80 + i * 76 + (row % 2) * 38, y: 330 + row * 180, r: 5, color: "#ffffff55" });
      }
    }
    let collected = 0;
    let dropT = 0;
    let dropX = CX;
    let dropV = 160;
    const drop = () => {
      const b = w.addBall({ x: dropX, y: 260, vx: w.rand(-30, 30), vy: 50, color: "#ffffff" });
      if (b) w.sound("tick", 0.2);
    };
    return {
      step(dt) {
        for (const g of gates) {
          g.x += g.speed * dt;
          if (g.x < L + 6) {
            g.x = L + 6;
            g.speed = Math.abs(g.speed);
          }
          if (g.x + g.wdt > R - 6) {
            g.x = R - 6 - g.wdt;
            g.speed = -Math.abs(g.speed);
          }
        }
        const n = w.balls.length;
        for (let i = 0; i < n; i++) {
          const b = w.balls[i];
          for (let gi = 0; gi < gates.length; gi++) {
            const g = gates[gi];
            const bit = 1 << gi;
            if (b.mask & bit) continue;
            if (b.py < g.y && b.y >= g.y && b.x >= g.x && b.x <= g.x + g.wdt) {
              b.mask |= bit;
              b.color = g.color;
              g.hit = 1;
              for (let k = 1; k < g.mult; k++) {
                w.addBall({ x: b.x + w.rand(-4, 4), y: b.y + 2, vx: b.vx + w.rand(-120, 120), vy: b.vy, color: g.color, mask: b.mask });
              }
              w.sound("split", 0.35, gi * 3 + (w.count % 5));
            }
          }
        }
      },
      frame(dt) {
        dropX += dropV * dt;
        if (dropX < 80 || dropX > 460) dropV = -dropV;
        dropT -= dt;
        if (dropT <= 0) {
          dropT = 1 / p.rate;
          drop();
        }
        for (const g of gates) g.hit = Math.max(0, g.hit - dt * 4);
      },
      onExit() {
        collected++;
      },
      onTap(x) {
        dropX = Math.max(60, Math.min(480, x));
        for (let i = 0; i < 5; i++) w.addBall({ x: dropX + w.rand(-10, 10), y: 262, vy: 50, color: "#ffffff" });
      },
      drawBack(ctx) {
        ctx.font = "900 20px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "center";
        for (const g of gates) {
          ctx.fillStyle = g.color;
          ctx.globalAlpha = 0.25 + g.hit * 0.5;
          ctx.fillRect(g.x, g.y - 9, g.wdt, 18);
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#0b0b1a";
          ctx.fillText(`x${g.mult}`, g.x + g.wdt / 2, g.y + 7);
          ctx.strokeStyle = g.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(g.x, g.y - 9, g.wdt, 18);
        }
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(dropX - 14, 244);
        ctx.lineTo(dropX + 14, 244);
        ctx.lineTo(dropX, 258);
        ctx.fill();
      },
      hud: () => ({
        main: String(collected + w.count),
        label: w.tl("balls total", "toplam top"),
        progress: w.count / p.cap,
        stats: [
          { k: w.tl("ON SCREEN", "EKRANDA"), v: String(w.count) },
          { k: w.tl("COLLECTED", "TOPLANAN"), v: String(collected) },
        ],
      }),
      done: () => collected + w.count >= 1000,
    };
  },
};

// 8 ─────────────────────────────────────────────────────────────
const colorChain: MachineDef = {
  id: "color-chain-clone",
  num: 8,
  name: "Color Chain Clone",
  category: "multiply",
  accent: "#3cf0ff",
  sound: "marimba",
  desc: { en: "Two balls of the same color collide → a new one is born.", tr: "Aynı renkteki iki top çarpışınca yeni bir top doğar." },
  hook: { en: "Same color = new ball", tr: "Aynı renk = yeni top" },
  params: [pSpeed(220), pSize(8), P("colors", "Colors", "Renk sayısı", 2, 6, 1, 4), pCap(600, 1000)],
  create(w, p) {
    w.gravity.y = 0;
    w.ballCollide = true;
    w.ballE = 1;
    w.minSpeed = p.speed * 0.5;
    w.maxBalls = p.cap;
    w.ballR = p.size;
    arena(w, "#3cf0ff");
    const colors = NEON.slice(0, p.colors);
    const counts = () => colors.map((c) => w.balls.reduce((s, b) => s + (b.color === c ? 1 : 0), 0));
    let births = 0;
    for (let i = 0; i < colors.length * 3; i++) {
      const a = w.rand(0, TAU);
      const r = w.rand(0, AR - 40);
      const va = w.rand(0, TAU);
      w.addBall({ x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r, vx: Math.cos(va) * p.speed, vy: Math.sin(va) * p.speed, color: colors[i % colors.length], cd: 0.5 });
    }
    let cache = counts();
    return {
      frame() {
        cache = counts();
      },
      onBall(a, b) {
        if (a.color !== b.color || a.cd > 0 || b.cd > 0) return w.sound("tick", 0.15);
        a.cd = 1.2;
        b.cd = 1.2;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        let nx = mx - (dy / d) * a.r * 2;
        let ny = my + (dx / d) * a.r * 2;
        if ((nx - CX) ** 2 + (ny - CY) ** 2 > (AR - a.r - 6) ** 2) {
          nx = mx;
          ny = my;
        }
        const c = w.addBall({ x: nx, y: ny, vx: (-dy / d) * p.speed, vy: (dx / d) * p.speed, color: a.color, cd: 1.2 });
        if (c) {
          births++;
          w.ringFx(c.x, c.y, c.color, 6);
          w.sound("chime", 0.5, colors.indexOf(a.color) * 2 + (births % 3));
        }
      },
      onTap: (x, y) => defaultTap(w, x, y),
      hud: () => ({
        main: String(w.count),
        label: w.tl("balls", "top"),
        bars: colors.map((c, i) => ({ color: c, value: cache[i] })),
        stats: colors.map((c, i) => ({ k: "●", v: String(cache[i]), color: c })),
      }),
      done: () => w.count >= p.cap,
    };
  },
};

// 9 ─────────────────────────────────────────────────────────────
const cornerRicochet: MachineDef = {
  id: "corner-ricochet-boost",
  num: 9,
  name: "Corner Ricochet Boost",
  category: "multiply",
  accent: "#ff3d7f",
  sound: "synth",
  desc: { en: "Balls that ricochet off sharp corners split and speed up.", tr: "Keskin köşelerden seken toplar bölünür ve hızlanır." },
  hook: { en: "Hit the corner = split", tr: "Köşeye vur = bölün" },
  params: [P("sides", "Corners", "Köşe sayısı", 3, 6, 1, 3), pSpin(0.5), pGravity(250), pSize(6), pCap(800, 1400)],
  create(w, p) {
    w.gravity.y = p.gravity;
    w.ballCollide = false;
    w.maxBalls = p.cap;
    w.ballR = p.size;
    w.minSpeed = 250;
    w.ring({ R: AR + 6, th: 2, color: "#ffffff22" });
    const n = p.sides;
    const R = AR;
    const walls: Seg[] = [];
    for (let i = 0; i < n; i++) walls.push(w.seg({ x1: 0, y1: 0, x2: 0, y2: 0, th: 8, color: "#ff3d7f" }));
    let rot = -Math.PI / 2;
    const verts: { x: number; y: number }[] = [];
    let corner = 0;
    const update = () => {
      verts.length = 0;
      for (let i = 0; i < n; i++) {
        const a = rot + (i / n) * TAU;
        verts.push({ x: CX + Math.cos(a) * R, y: CY + Math.sin(a) * R });
      }
      walls.forEach((s, i) => {
        const a = verts[i];
        const b = verts[(i + 1) % n];
        s.x1 = a.x;
        s.y1 = a.y;
        s.x2 = b.x;
        s.y2 = b.y;
        s.cx = CX;
        s.cy = CY;
        s.omega = p.spin;
      });
    };
    update();
    w.addBall({ x: CX, y: CY + 20, vx: 300, vy: -250, color: hsl(330) });
    w.addBall({ x: CX, y: CY - 20, vx: -300, vy: 250, color: hsl(200) });
    return {
      step(dt) {
        rot += p.spin * dt;
        update();
      },
      onSeg(b) {
        let near = false;
        for (const v of verts) if ((v.x - b.x) ** 2 + (v.y - b.y) ** 2 < 70 * 70) near = true;
        if (near && b.cd <= 0 && w.count < p.cap) {
          corner++;
          b.vx *= 1.05;
          b.vy *= 1.05;
          const col = hsl(330 + corner * 23);
          const c = splitBall(w, b, 0.4, { color: col });
          b.color = col;
          b.cd = 0.3;
          if (c) c.cd = 0.3;
          w.ringFx(b.x, b.y, col, 8);
          w.sound("split", 0.8, corner % 12);
        } else w.sound("hit", 0.2);
      },
      drawBack(ctx) {
        for (const v of verts) {
          ctx.fillStyle = "#ff3d7f";
          ctx.globalAlpha = 0.18;
          ctx.beginPath();
          ctx.arc(v.x, v.y, 70, 0, TAU);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      },
      onTap: (x, y) => defaultTap(w, x, y),
      hud: () => ({
        main: String(w.count),
        label: w.tl("balls", "top"),
        progress: w.count / p.cap,
        stats: [{ k: w.tl("CORNER HITS", "KÖŞE VURUŞU"), v: String(corner) }],
      }),
      done: () => w.count >= p.cap,
    };
  },
};

// 10 ────────────────────────────────────────────────────────────
const targetCap: MachineDef = {
  id: "target-cap-frenzy",
  num: 10,
  name: "Target Cap Frenzy",
  category: "multiply",
  accent: "#ff3d5a",
  sound: "pop",
  desc: { en: "Rapid doubling until the threshold — then the arena bursts open.", tr: "Eşiğe kadar hızlı çoğalma, sonra arena patlayıp taşar." },
  hook: { en: "What happens at 600?", tr: "600'de ne olacak?" },
  params: [P("threshold", "Threshold", "Eşik", 100, 1500, 50, 600), pGravity(600), pSpeed(500), pSize(5)],
  create(w, p) {
    w.gravity.y = p.gravity;
    w.maxBalls = p.threshold;
    w.ballR = p.size;
    const ring = arena(w, "#ffffff");
    let phase = 0; // 0 grow, 1 overflow, 2 done
    let open = 0;
    let spilled = 0;
    w.addBall({ x: CX, y: CY, vx: p.speed * 0.6, vy: -p.speed * 0.5, color: "#ffffff" });
    return {
      onRing(b) {
        if (phase === 0 && b.cd <= 0) {
          const k = w.count / p.threshold;
          const col = hsl(200 - k * 200, 95, 60);
          const c = splitBall(w, b, w.rand(0.1, 0.3), { color: col });
          b.cd = 0.06;
          if (c) c.cd = 0.06;
          ring.color = col;
          w.sound("pop", 0.5, log2i(w.count) + 2);
          if (w.count >= p.threshold) {
            phase = 1;
            w.flash = 1;
            w.flashColor = "#ff3d5a";
            w.shake = 12;
            w.sound("boom", 1);
            w.gravity.y = p.gravity * 1.8;
          }
        } else w.sound("tick", 0.15);
      },
      frame(dt) {
        if (phase === 1) {
          open = Math.min(Math.PI * 0.9, open + dt * 0.6);
          ring.gaps = [[Math.PI / 2 - open, Math.PI / 2 + open]];
          ring.color = "#ff3d5a";
          if (w.count === 0) phase = 2;
        }
      },
      onExit() {
        spilled++;
        if (spilled % 8 === 0) w.sound("tick", 0.3);
      },
      onTap: (x, y) => w.shockwave(x, y, 500, 200),
      hud: () => ({
        main: phase === 0 ? String(w.count) : String(spilled),
        label: phase === 0 ? w.tl(`balls / ${p.threshold}`, `top / ${p.threshold}`) : w.tl("spilled", "taşan"),
        progress: phase === 0 ? w.count / p.threshold : spilled / p.threshold,
        stats: [{ k: w.tl("PHASE", "AŞAMA"), v: phase === 0 ? w.tl("GROW", "ÇOĞALMA") : phase === 1 ? w.tl("OVERFLOW", "TAŞMA") : w.tl("EMPTY", "BOŞ"), color: phase ? "#ff3d5a" : "#7cff6b" }],
        banner: phase === 1 ? w.tl("OVERFLOW!", "TAŞIYOR!") : undefined,
      }),
      done: () => phase === 2,
    };
  },
};

export const multiplyMachines: MachineDef[] = [
  bounce2,
  wallSplit,
  spinnerClone,
  timerBurst,
  sizeDecay,
  gravityFlip,
  gateMultiplier,
  colorChain,
  cornerRicochet,
  targetCap,
];

