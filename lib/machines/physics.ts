import type { MachineDef, MachineInstance, Seg } from "../engine/types";
import { AR, CX, CY, TAU } from "../engine/world";
import { NEON, P, arena, defaultTap, fillBox, fillDisk, fmtTime, hsl, pCount, pGravity, pSize, splitBall } from "./helpers";

// 25 ────────────────────────────────────────────────────────────
const zeroG: MachineDef = {
  id: "zero-g-float",
  num: 25,
  name: "Zero-G Float",
  category: "physics",
  accent: "#3cf0ff",
  sound: "marimba",
  desc: { en: "Weightless balls of every size drift and bounce forever.", tr: "Her boyda top yerçekimsiz ortamda süzülür ve sonsuza dek seker." },
  hook: { en: "Pure calm.", tr: "Saf huzur." },
  params: [pCount(140, 400), P("speed", "Drift speed", "Süzülme hızı", 20, 400, 10, 120), P("trail", "Trails", "İz", 0, 0.9, 0.05, 0.25), P("maxR", "Max size", "Maks boyut", 6, 30, 1, 16)],
  create(w, p) {
    w.gravity.y = 0;
    w.ballCollide = true;
    w.ballE = 1;
    w.maxBalls = 600;
    w.trail = p.trail > 0 ? 1 - p.trail : 0;
    w.bg = ["#06101f", "#030712"];
    arena(w, "#3cf0ff55", 4);
    const pal = ["#8be9fd", "#bd93f9", "#ff79c6", "#50fa7b", "#f1fa8c"];
    for (let i = 0; i < p.count; i++) {
      const a = w.rand(0, TAU);
      const r = w.rand(0, AR - 40);
      const va = w.rand(0, TAU);
      w.addBall({ x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r, vx: Math.cos(va) * p.speed, vy: Math.sin(va) * p.speed, r: w.rand(4, p.maxR), color: pal[i % pal.length] });
    }
    let hits = 0;
    return {
      onBall(a, b, imp) {
        hits++;
        if (imp > 40) w.sound("hit", Math.min(0.5, imp / 400), Math.floor(30 - a.r - b.r / 2) % 15);
      },
      onRing: (b, _r, imp) => w.sound("tick", Math.min(0.3, imp / 600), Math.floor(b.r)),
      onTap: (x, y) => defaultTap(w, x, y),
      hud: () => ({
        main: String(hits),
        label: w.tl("collisions", "çarpışma"),
        stats: [
          { k: w.tl("BALLS", "TOP"), v: String(w.count) },
          { k: "G", v: "0.0" },
          { k: w.tl("TIME", "SÜRE"), v: fmtTime(w.time) },
        ],
      }),
    };
  },
};

// 26 ────────────────────────────────────────────────────────────
const highG: MachineDef = {
  id: "high-gravity-drop",
  num: 26,
  name: "High-Gravity Drop",
  category: "physics",
  accent: "#ff3d5a",
  sound: "synth",
  desc: { en: "Brutal gravity and springy bounces. Batches slam down onto shelves.", tr: "Sert yerçekimi ve yaylı sekmeler. Top grupları raflara çakılır." },
  hook: { en: "5G drop test", tr: "5G düşüş testi" },
  params: [pGravity(2600, 6000), P("bounce", "Bounciness", "Sekme", 0.3, 1, 0.02, 0.88), P("batch", "Batch size", "Grup boyutu", 5, 80, 5, 30), P("interval", "Drop every (s)", "Bırakma aralığı (sn)", 0.5, 6, 0.25, 2.5), pSize(8)],
  create(w, p) {
    w.gravity.y = p.gravity;
    w.restitution = p.bounce;
    w.ballCollide = true;
    w.ballE = p.bounce;
    w.ballR = p.size;
    w.maxBalls = 700;
    w.maxSpeed = 2600;
    w.seg({ x1: 40, y1: 250, x2: 40, y2: 930, th: 8, color: "#ff3d5a" });
    w.seg({ x1: 500, y1: 250, x2: 500, y2: 930, th: 8, color: "#ff3d5a" });
    const floor = w.seg({ x1: 40, y1: 930, x2: 500, y2: 930, th: 8, color: "#ff3d5a" });
    w.seg({ x1: 40, y1: 480, x2: 220, y2: 540, th: 8, color: "#ffffff" });
    w.seg({ x1: 500, y1: 640, x2: 320, y2: 700, th: 8, color: "#ffffff" });
    for (let i = 0; i < 5; i++) w.bumper({ x: 110 + i * 80, y: 800, r: 10, color: "#ffcd3c" });
    let drops = 0;
    let t = 0.3;
    let open = 0;
    return {
      frame(dt) {
        t -= dt;
        if (t <= 0) {
          t = p.interval;
          drops++;
          const col = hsl(drops * 50);
          for (let i = 0; i < p.batch; i++) w.addBall({ x: w.rand(70, 470), y: w.rand(260, 330), color: col });
          if (w.count >= w.maxBalls - p.batch) {
            open = 2;
            floor.solid = false;
            floor.visible = false;
          }
        }
        if (open > 0) {
          open -= dt;
          if (open <= 0) {
            floor.solid = true;
            floor.visible = true;
          }
        }
      },
      onSeg: (_b, _s, imp) => {
        if (imp > 1500) {
          w.sound("boom", Math.min(1, imp / 4000));
          w.shake = Math.max(w.shake, imp / 600);
        } else w.sound("hit", Math.min(0.5, imp / 2500));
      },
      onBumper: (_b, _p, imp) => w.sound("tick", Math.min(0.6, imp / 2000), 8),
      onTap: (x, y) => w.shockwave(x, y, 1500, 200),
      hud: () => ({
        main: String(Math.round(w.peakImpact)),
        label: w.tl("peak impact", "en sert darbe"),
        stats: [
          { k: "G", v: (p.gravity / 980).toFixed(1) },
          { k: w.tl("DROPS", "BIRAKMA"), v: String(drops) },
          { k: w.tl("BALLS", "TOP"), v: String(w.count) },
        ],
      }),
    };
  },
};

// 27 ────────────────────────────────────────────────────────────
const orbit: MachineDef = {
  id: "orbit-gravity-well",
  num: 27,
  name: "Orbit / Gravity Well",
  category: "physics",
  accent: "#ffcd3c",
  sound: "synth",
  desc: { en: "A central gravity well keeps every ball in orbit, leaving glowing trails.", tr: "Merkezdeki çekim kuyusu topları yörüngede tutar, parlak izler bırakır." },
  hook: { en: "Tiny solar system", tr: "Minik güneş sistemi" },
  params: [pCount(120, 400), P("mass", "Well mass", "Kuyu kütlesi", 0.5, 5, 0.1, 2.5), P("trail", "Trails", "İz", 0, 0.95, 0.05, 0.85), P("ecc", "Eccentricity", "Basıklık", 0, 0.6, 0.02, 0.15), pSize(5)],
  create(w, p) {
    const k = p.mass * 1e7;
    w.gravity.y = 0;
    w.attractor = { x: CX, y: CY, k, soft: 14 };
    w.trail = p.trail > 0 ? 1 - p.trail : 0;
    w.ballR = p.size;
    w.maxBalls = 600;
    w.maxSpeed = 2200;
    w.bg = ["#07060f", "#020106"];
    arena(w, "#ffcd3c33", 3);
    const orbitBall = (x: number, y: number, color?: string) => {
      const dx = x - CX;
      const dy = y - CY;
      const d = Math.hypot(dx, dy) || 1;
      const v = Math.sqrt(k / d) * (1 - p.ecc * w.rng());
      return w.addBall({ x, y, vx: (-dy / d) * v, vy: (dx / d) * v, color });
    };
    for (let i = 0; i < p.count; i++) {
      const a = w.rand(0, TAU);
      const r = w.rand(50, AR - 20);
      orbitBall(CX + Math.cos(a) * r, CY + Math.sin(a) * r, hsl(30 + (r / AR) * 260));
    }
    let eaten = 0;
    let pulse = 0;
    return {
      step() {
        for (const b of w.balls) {
          if (!b.dead && (b.x - CX) ** 2 + (b.y - CY) ** 2 < 20 * 20) {
            b.dead = true;
            eaten++;
            pulse = 1;
            w.sound("chime", 0.5, eaten % 10);
            const a = w.rand(0, TAU);
            const r = w.rand(80, AR - 20);
            orbitBall(CX + Math.cos(a) * r, CY + Math.sin(a) * r, b.color);
          }
        }
      },
      frame(dt) {
        pulse = Math.max(0, pulse - dt * 2);
      },
      onRing: (_b, _r, imp) => w.sound("tick", Math.min(0.3, imp / 1500)),
      drawFront(ctx) {
        const g = ctx.createRadialGradient(CX, CY, 2, CX, CY, 40 + pulse * 20);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.3, "#ffcd3c");
        g.addColorStop(1, "rgba(255,205,60,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(CX, CY, 40 + pulse * 20, 0, TAU);
        ctx.fill();
      },
      onTap(x, y) {
        const b = orbitBall(x, y, NEON[w.totalSpawned % NEON.length]);
        if (b) w.ringFx(x, y, b.color, 6);
      },
      hud: () => ({
        main: String(w.count),
        label: w.tl("in orbit", "yörüngede"),
        stats: [
          { k: w.tl("SWALLOWED", "YUTULAN"), v: String(eaten) },
          { k: w.tl("TIME", "SÜRE"), v: fmtTime(w.time) },
        ],
      }),
    };
  },
};

// 28 ────────────────────────────────────────────────────────────
const shock: MachineDef = {
  id: "click-shockwave",
  num: 28,
  name: "Click Shockwave",
  category: "physics",
  accent: "#ffffff",
  sound: "pop",
  desc: { en: "Tap anywhere to blast a shockwave through a box of balls.", tr: "Herhangi bir yere dokun, top dolu kutuda şok dalgası patlat." },
  hook: { en: "Tap = BOOM", tr: "Dokun = BUM" },
  params: [pCount(450, 800), P("power", "Blast power", "Patlama gücü", 200, 3000, 50, 1100), P("radius", "Blast radius", "Patlama yarıçapı", 60, 500, 10, 230), P("auto", "Auto blast (s, 0=off)", "Otomatik patlama (sn, 0=kapalı)", 0, 8, 0.5, 2.5), pGravity(900), pSize(7)],
  create(w, p) {
    w.gravity.y = p.gravity;
    w.ballCollide = true;
    w.ballE = 0.75;
    w.restitution = 0.8;
    w.ballR = p.size;
    w.maxBalls = 1000;
    w.box(30, 250, 510, 935, "#ffffff");
    fillBox(w, p.count, 50, 550, 490, 920, 20);
    w.balls.forEach((b, i) => (b.color = hsl(180 + (i / p.count) * 180)));
    let shocks = 0;
    let t = p.auto;
    const blast = (x: number, y: number) => {
      shocks++;
      w.shockwave(x, y, p.power, p.radius);
      w.ringFx(x, y, hsl(shocks * 60), 20, 0.6);
      w.flash = 0.5;
      w.flashColor = hsl(shocks * 60);
    };
    return {
      frame(dt) {
        if (p.auto > 0) {
          t -= dt;
          if (t <= 0) {
            t = p.auto;
            blast(w.rand(80, 460), w.rand(760, 920));
          }
        }
      },
      onSeg: (_b, _s, imp) => w.sound("tick", Math.min(0.4, imp / 2000)),
      onTap: (x, y) => blast(x, y),
      hud: () => ({
        main: String(shocks),
        label: w.tl("shockwaves", "şok dalgası"),
        stats: [
          { k: w.tl("BALLS", "TOP"), v: String(w.count) },
          { k: w.tl("PEAK", "ZİRVE"), v: String(Math.round(w.peakImpact)) },
        ],
      }),
    };
  },
};

// 29 ────────────────────────────────────────────────────────────
const wind: MachineDef = {
  id: "wind-breeze-stream",
  num: 29,
  name: "Wind / Breeze Stream",
  category: "physics",
  accent: "#7cff6b",
  sound: "tick",
  desc: { en: "Shifting wind currents sweep the balls side to side and up.", tr: "Değişken rüzgar akımları topları sağa sola ve yukarı savurur." },
  hook: { en: "Feel the breeze", tr: "Esintiyi hisset" },
  params: [pCount(320, 700), P("wind", "Wind strength", "Rüzgar gücü", 0, 3000, 50, 1300), P("freq", "Shift speed", "Değişim hızı", 0.05, 2, 0.05, 0.35), P("gust", "Updraft gusts", "Yukarı esinti", 0, 4000, 100, 2200), pGravity(800), pSize(6)],
  create(w, p) {
    w.gravity.y = p.gravity;
    w.ballCollide = true;
    w.ballE = 0.8;
    w.ballR = p.size;
    w.maxBalls = 1000;
    w.box(30, 250, 510, 935, "#7cff6b");
    fillBox(w, p.count, 50, 600, 490, 920, 20);
    w.balls.forEach((b, i) => (b.color = hsl(90 + (i % 5) * 30, 90, 60)));
    const streaks = Array.from({ length: 40 }, () => ({ x: w.rand(30, 510), y: w.rand(260, 930), l: w.rand(20, 60) }));
    let gust = 0;
    let gustT = 3;
    return {
      step() {
        w.wind.x = Math.sin(w.time * p.freq * TAU) * p.wind;
        w.wind.y = -gust;
      },
      frame(dt) {
        gustT -= dt;
        if (gustT <= 0) {
          gustT = w.rand(3, 6);
          gust = p.gust;
          w.sound("boom", 0.3);
        }
        gust = Math.max(0, gust - dt * p.gust * 1.5);
        for (const s of streaks) {
          s.x += (w.wind.x * 0.25 + 30) * dt;
          s.y += w.wind.y * 0.1 * dt;
          if (s.x > 520) s.x = 20;
          if (s.x < 20) s.x = 520;
          if (s.y < 260) s.y = 930;
          if (s.y > 930) s.y = 260;
        }
      },
      drawBack(ctx) {
        ctx.strokeStyle = "rgba(124,255,107,0.18)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        const dir = Math.sign(w.wind.x) || 1;
        for (const s of streaks) {
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - dir * s.l * Math.min(1, Math.abs(w.wind.x) / 600 + 0.2), s.y + gust * 0.01);
        }
        ctx.stroke();
      },
      onSeg: (_b, _s, imp) => w.sound("tick", Math.min(0.3, imp / 2000)),
      onTap(x, y) {
        gust = p.gust;
        w.ringFx(x, y, "#7cff6b", 20);
      },
      hud: () => ({
        main: `${Math.round(Math.abs(w.wind.x) / 10)}`,
        label: w.tl(`wind ${w.wind.x >= 0 ? "→" : "←"} km/h`, `rüzgar ${w.wind.x >= 0 ? "→" : "←"} km/s`),
        progress: Math.abs(w.wind.x) / Math.max(1, p.wind),
        stats: [
          { k: w.tl("UPDRAFT", "YUKARI"), v: String(Math.round(gust / 10)) },
          { k: w.tl("BALLS", "TOP"), v: String(w.count) },
        ],
      }),
    };
  },
};

// 30 ────────────────────────────────────────────────────────────
const chaos: MachineDef = {
  id: "chaos-mix",
  num: 30,
  name: "Chaos Mix (Randomizer)",
  category: "physics",
  accent: "#b46bff",
  sound: "synth",
  desc: { en: "Random arena, gravity, spinners, bumpers and rules. Reset = new scenario.", tr: "Rastgele arena, yerçekimi, pervane, tampon ve kurallar. Sıfırla = yeni senaryo." },
  hook: { en: "Random scenario #?", tr: "Rastgele senaryo #?" },
  params: [P("reroll", "Auto reroll (s, 0=off)", "Otomatik yenile (sn, 0=kapalı)", 0, 30, 1, 0), pSize(7)],
  create(w, p) {
    w.ballR = p.size;
    let seed = 0;
    let rule = "";
    let spinners: { s: Seg; w: number; a: number; len: number; cx: number; cy: number }[] = [];
    let splitOnWall = false;
    let cloneOnBumper = false;
    let t = p.reroll;
    const build = () => {
      seed = Math.floor(w.rng() * 9000) + 1000;
      w.balls = [];
      w.segs = [];
      w.rings = [];
      w.bumpers = [];
      w.attractor = null;
      w.time = 0;
      w.peakImpact = 0;
      const hue = w.rand(0, 360);
      w.palette = [0, 40, 80, 160, 220].map((o) => hsl(hue + o));
      w.bg = [hsl(hue + 200, 40, 7), hsl(hue + 200, 40, 3)];
      const box = w.rng() < 0.35;
      const g = w.rng() < 0.2 ? 0 : w.rand(300, 1600);
      const ga = w.rng() < 0.8 ? Math.PI / 2 : w.rand(0, TAU);
      w.gravity.x = Math.cos(ga) * g;
      w.gravity.y = Math.sin(ga) * g;
      w.ballCollide = w.rng() < 0.75;
      w.ballE = w.rand(0.6, 1);
      w.minSpeed = g === 0 ? 150 : 0;
      w.maxBalls = 900;
      const accent = w.palette[0];
      if (box) w.box(40, 260, 500, 930, accent);
      else {
        const r = arena(w, accent);
        if (w.rng() < 0.3) r.omega = w.rand(-1, 1);
        if (w.rng() < 0.3) {
          const a = w.rand(0, TAU);
          w.ring({ R: AR * w.rand(0.4, 0.7), th: 6, color: w.palette[2], omega: w.rand(-2, 2), gaps: [[a, a + w.rand(0.4, 1.2)]] });
        }
      }
      spinners = [];
      const ns = Math.floor(w.rand(0, 3.99));
      for (let i = 0; i < ns; i++) {
        const cx = ns === 1 ? CX : CX + w.rand(-110, 110);
        const cy = ns === 1 ? CY : CY + w.rand(-150, 150);
        spinners.push({ s: w.seg({ x1: 0, y1: 0, x2: 0, y2: 0, th: 10, color: w.palette[1 + (i % 3)] }), w: w.rand(-3, 3), a: w.rand(0, TAU), len: w.rand(60, 160), cx, cy });
      }
      const nb = Math.floor(w.rand(0, 7));
      for (let i = 0; i < nb; i++) {
        const q = { x: CX + w.rand(-160, 160), y: CY + w.rand(-180, 180) };
        w.bumper({ x: q.x, y: q.y, r: w.rand(10, 26), boost: w.rand(0, 300), color: w.palette[4] });
      }
      if (!box && w.rng() < 0.2) {
        w.attractor = { x: CX, y: CY, k: w.rand(1e6, 8e6), soft: 30 };
        w.gravity.x = w.gravity.y = 0;
      }
      splitOnWall = w.rng() < 0.4;
      cloneOnBumper = !splitOnWall && nb > 0 && w.rng() < 0.6;
      rule = splitOnWall ? w.tl("WALL = SPLIT", "DUVAR = BÖLÜN") : cloneOnBumper ? w.tl("BUMPER = CLONE", "TAMPON = KLON") : w.tl("PURE PHYSICS", "SAF FİZİK");
      const count = splitOnWall ? 2 : Math.floor(w.rand(40, 260));
      if (box) fillBox(w, count, 60, 280, 480, 600, 200);
      else fillDisk(w, count, 300, { R: AR - 50 });
      w.flash = 1;
      w.flashColor = accent;
      w.sound("chime", 0.8, 5);
    };
    build();
    const inst: MachineInstance = {
      step(dt) {
        for (const sp of spinners) {
          sp.a += sp.w * dt;
          w.setBar(sp.s, sp.cx, sp.cy, sp.a, sp.len, -sp.len);
          sp.s.omega = sp.w;
        }
      },
      frame(dt) {
        if (p.reroll > 0) {
          t -= dt;
          if (t <= 0) {
            t = p.reroll;
            build();
          }
        }
      },
      onRing(b) {
        if (splitOnWall && b.cd <= 0) {
          const c = splitBall(w, b, 0.2);
          b.cd = 0.15;
          if (c) c.cd = 0.15;
          w.sound("split", 0.6, Math.floor(Math.log2(w.count + 1)));
        } else w.sound("hit", 0.2);
      },
      onSeg(b) {
        if (splitOnWall && b.cd <= 0) {
          const c = splitBall(w, b, 0.2);
          b.cd = 0.15;
          if (c) c.cd = 0.15;
          w.sound("split", 0.6, Math.floor(Math.log2(w.count + 1)));
        } else w.sound("tick", 0.2);
      },
      onBumper(b) {
        if (cloneOnBumper && b.cd <= 0) {
          const c = splitBall(w, b, 0.5);
          b.cd = 0.3;
          if (c) c.cd = 0.3;
        }
        w.sound("hit", 0.4, w.count % 10);
      },
      onTap: (x, y) => w.shockwave(x, y, 900, 200),
      hud: () => ({
        main: `#${seed}`,
        label: rule,
        stats: [
          { k: w.tl("BALLS", "TOP"), v: String(w.count) },
          { k: "G", v: (Math.hypot(w.gravity.x, w.gravity.y) / 980).toFixed(1) },
          { k: w.tl("TIME", "SÜRE"), v: fmtTime(w.time) },
        ],
      }),
    };
    return inst;
  },
};

export const physicsMachines: MachineDef[] = [zeroG, highG, orbit, shock, wind, chaos];
