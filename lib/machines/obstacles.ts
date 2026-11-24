import type { MachineDef, Seg } from "../engine/types";
import { AR, CX, CY, TAU } from "../engine/world";
import { NEON, P, arena, defaultTap, fillBox, fillDisk, fmtTime, hsl, pCount, pGravity, pSize, pSpin } from "./helpers";

const addMany = (w: import("../engine/world").World, x: number, y: number, n = 10) => {
  for (let i = 0; i < n; i++) {
    const a = w.rand(0, TAU);
    w.addBall({ x: x + Math.cos(a) * 6, y: y + Math.sin(a) * 6, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200 });
  }
  w.ringFx(x, y, "#ffffff", 8);
  w.sound("pop", 0.6);
};

// 11 ────────────────────────────────────────────────────────────
const singleSpinner: MachineDef = {
  id: "single-spinner-sweep",
  num: 11,
  name: "Single Spinner Sweep",
  category: "obstacle",
  accent: "#3cf0ff",
  sound: "tick",
  desc: { en: "One long spinning bar sweeps and squeezes the pile.", tr: "Tek uzun dönen çubuk top yığınını süpürür ve sıkıştırır." },
  hook: { en: "Watch the sweep…", tr: "Süpürmeyi izle…" },
  params: [pCount(260, 600), pSpin(1.4), pGravity(900), pSize(7)],
  create(w, p) {
    w.gravity.y = p.gravity;
    w.ballCollide = true;
    w.ballE = 0.6;
    w.ballR = p.size;
    w.maxBalls = 900;
    arena(w, "#3cf0ff");
    fillDisk(w, p.count, 50, { R: AR - 40 });
    const bar = w.seg({ x1: 0, y1: 0, x2: 0, y2: 0, th: 12, color: "#ffffff" });
    let ang = 0;
    let sweeps = 0;
    let last = 0;
    return {
      step(dt) {
        ang += p.spin * dt;
        w.setBar(bar, CX, CY, ang, AR - 16, -(AR - 16));
        bar.omega = p.spin;
        const s = Math.floor(Math.abs(ang) / Math.PI);
        if (s !== last) {
          last = s;
          sweeps++;
        }
      },
      onSeg: (_b, _s, imp) => w.sound("tick", Math.min(0.5, imp / 900)),
      onTap: (x, y) => addMany(w, x, y),
      hud: () => ({
        main: String(sweeps),
        label: w.tl("sweeps", "süpürme"),
        stats: [
          { k: w.tl("BALLS", "TOP"), v: String(w.count) },
          { k: "RPM", v: String(Math.round(Math.abs(p.spin) * 9.55)) },
          { k: w.tl("TIME", "SÜRE"), v: fmtTime(w.time) },
        ],
      }),
    };
  },
};

// 12 ────────────────────────────────────────────────────────────
const tripleBlade: MachineDef = {
  id: "triple-blade-vortex",
  num: 12,
  name: "Triple Blade Vortex",
  category: "obstacle",
  accent: "#b46bff",
  sound: "marimba",
  desc: { en: "A three-armed propeller churns the balls into a vortex.", tr: "3 kollu pervane topları girdap gibi çevirir." },
  hook: { en: "3 blades. 300 balls.", tr: "3 kol. 300 top." },
  params: [pCount(300, 600), pSpin(-2.2), P("arms", "Arms", "Kol sayısı", 2, 6, 1, 3), pGravity(700), pSize(7)],
  create(w, p) {
    w.gravity.y = p.gravity;
    w.ballCollide = true;
    w.ballE = 0.7;
    w.ballR = p.size;
    w.maxBalls = 900;
    arena(w, "#b46bff");
    fillDisk(w, p.count, 60, { R: AR - 40, colors: ["#b46bff", "#ff3d7f", "#3cf0ff"] });
    const blades: Seg[] = [];
    for (let i = 0; i < p.arms; i++) blades.push(w.seg({ x1: 0, y1: 0, x2: 0, y2: 0, th: 14, color: NEON[i % NEON.length] }));
    w.bumper({ x: CX, y: CY, r: 22, color: "#ffffff" });
    let ang = 0;
    return {
      step(dt) {
        ang += p.spin * dt;
        blades.forEach((s, i) => {
          w.setBar(s, CX, CY, ang + (i / p.arms) * TAU, AR - 30, 16);
          s.omega = p.spin;
        });
      },
      onSeg: (_b, s, imp) => w.sound("hit", Math.min(0.6, imp / 900), blades.indexOf(s) * 2 + 3),
      onTap: (x, y) => addMany(w, x, y),
      hud: () => ({
        main: String(Math.round(Math.abs(p.spin) * 9.55)),
        label: "RPM",
        stats: [
          { k: w.tl("BALLS", "TOP"), v: String(w.count) },
          { k: w.tl("ARMS", "KOL"), v: String(p.arms) },
          { k: w.tl("TIME", "SÜRE"), v: fmtTime(w.time) },
        ],
      }),
    };
  },
};

// 13 ────────────────────────────────────────────────────────────
const counterRings: MachineDef = {
  id: "counter-rotating-rings",
  num: 13,
  name: "Counter-Rotating Rings",
  category: "obstacle",
  accent: "#ffcd3c",
  sound: "marimba",
  desc: { en: "Nested rings spin in opposite directions — escape through the gaps.", tr: "İç içe halkalar ters yönde döner — boşluklardan kaç." },
  hook: { en: "Can they escape?", tr: "Kaçabilecekler mi?" },
  params: [P("rings", "Rings", "Halka sayısı", 2, 6, 1, 4), P("gap", "Gap size", "Boşluk", 0.2, 1.2, 0.05, 0.5), pSpin(0.9), P("rate", "Spawn / sec", "Saniyede top", 1, 20, 1, 5), pSize(6)],
  create(w, p) {
    w.gravity.y = 0;
    w.ballCollide = true;
    w.ballE = 1;
    w.minSpeed = 200;
    w.ballR = p.size;
    w.maxBalls = 500;
    const n = p.rings;
    const rings = [] as ReturnType<typeof w.ring>[];
    for (let i = 0; i < n; i++) {
      const R = 60 + (i * (AR - 70)) / Math.max(1, n - 1);
      rings.push(w.ring({ R, th: 6, color: hsl(45 + i * 50), omega: p.spin * (i % 2 ? -1 : 1) * (1 + i * 0.15), gaps: [[0, p.gap]], rot: w.rand(0, TAU) }));
    }
    const outer = rings[rings.length - 1].R;
    let escaped = 0;
    let t = 0;
    return {
      frame(dt) {
        t -= dt;
        if (t <= 0) {
          t = 1 / p.rate;
          const a = w.rand(0, TAU);
          w.addBall({ x: CX, y: CY, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, color: NEON[w.totalSpawned % NEON.length] });
        }
        for (const b of w.balls) {
          if (!b.dead && (b.x - CX) ** 2 + (b.y - CY) ** 2 > (outer + 12) ** 2) {
            b.dead = true;
            escaped++;
            w.burst(b.x, b.y, b.color, 6, 140);
            w.sound("chime", 0.6, escaped % 10);
          }
        }
      },
      onRing: (_b, r, imp) => w.sound("tick", Math.min(0.3, imp / 1500), rings.indexOf(r)),
      onTap: (x, y) => defaultTap(w, x, y),
      hud: () => ({
        main: String(escaped),
        label: w.tl("escaped", "kaçan"),
        stats: [
          { k: w.tl("INSIDE", "İÇERİDE"), v: String(w.count) },
          { k: w.tl("RINGS", "HALKA"), v: String(n) },
        ],
      }),
      done: () => escaped >= 100,
    };
  },
};

// 14 ────────────────────────────────────────────────────────────
const pendulum: MachineDef = {
  id: "pendulum-crusher",
  num: 14,
  name: "Pendulum Crusher",
  category: "obstacle",
  accent: "#ff8a3c",
  sound: "synth",
  desc: { en: "A heavy pendulum swings through a box full of balls.", tr: "Ağır bir sarkaç top dolu kutunun içinden geçer." },
  hook: { en: "SMASH.", tr: "EZ GEÇ." },
  params: [pCount(260, 500), P("amp", "Swing angle", "Salınım açısı", 0.3, 1.4, 0.05, 1.0), P("freq", "Swing speed", "Salınım hızı", 0.3, 3, 0.05, 1.2), P("bob", "Bob size", "Ağırlık boyutu", 20, 80, 2, 48), pGravity(1000), pSize(7)],
  create(w, p) {
    w.gravity.y = p.gravity;
    w.ballCollide = true;
    w.ballE = 0.6;
    w.ballR = p.size;
    w.maxBalls = 800;
    w.box(40, 260, 500, 930, "#ff8a3c");
    fillBox(w, p.count, 60, 620, 480, 910, 30);
    const px = CX;
    const py = 250;
    const L = 470;
    const rod = w.seg({ x1: px, y1: py, x2: px, y2: py + L, th: 5, color: "#ffffff88", solid: false });
    const bob = w.bumper({ x: px, y: py + L, r: p.bob, color: "#ff8a3c", e: 0.8 });
    let swings = 0;
    let lastSign = 1;
    return {
      step() {
        const t = w.time;
        const a = p.amp * Math.sin(t * p.freq * TAU * 0.5);
        const da = p.amp * Math.cos(t * p.freq * TAU * 0.5) * p.freq * TAU * 0.5;
        bob.x = px + Math.sin(a) * L;
        bob.y = py + Math.cos(a) * L;
        bob.vx = Math.cos(a) * L * da;
        bob.vy = -Math.sin(a) * L * da;
        rod.x2 = bob.x;
        rod.y2 = bob.y;
        const s = Math.sign(a) || 1;
        if (s !== lastSign) {
          lastSign = s;
          swings++;
        }
      },
      onBumper: (_b, _p, imp) => w.sound("hit", Math.min(1, imp / 700), 2),
      onSeg: (_b, _s, imp) => w.sound("tick", Math.min(0.3, imp / 1500)),
      drawFront(ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, TAU);
        ctx.fill();
      },
      onTap: (x, y) => addMany(w, x, y, 8),
      hud: () => ({
        main: String(swings),
        label: w.tl("swings", "salınım"),
        stats: [
          { k: w.tl("BALLS", "TOP"), v: String(w.count) },
          { k: w.tl("PEAK HIT", "EN SERT"), v: String(Math.round(w.peakImpact)) },
        ],
      }),
    };
  },
};

// 15 ────────────────────────────────────────────────────────────
const rotatingCross: MachineDef = {
  id: "rotating-cross",
  num: 15,
  name: "Rotating Cross",
  category: "obstacle",
  accent: "#7cff6b",
  sound: "tick",
  desc: { en: "A plus-shaped rotor spins while the side gaps narrow.", tr: "Artı şeklindeki rotor döner, yan boşluklar daralır." },
  hook: { en: "The gaps are closing…", tr: "Boşluklar daralıyor…" },
  params: [pCount(220, 500), pSpin(1.2), P("narrow", "Narrowing speed", "Daralma hızı", 0, 5, 0.25, 1.5), pGravity(800), pSize(7)],
  create(w, p) {
    w.gravity.y = p.gravity;
    w.ballCollide = true;
    w.ballE = 0.7;
    w.ballR = p.size;
    w.maxBalls = 800;
    arena(w, "#7cff6b");
    fillDisk(w, p.count, 40, { R: AR - 40, colors: ["#7cff6b", "#3cf0ff", "#ffcd3c"] });
    const arms = [0, 1, 2, 3].map((i) => w.seg({ x1: 0, y1: 0, x2: 0, y2: 0, th: 14, color: i % 2 ? "#ffffff" : "#7cff6b" }));
    let ang = 0;
    let gap = 70;
    let speed = p.spin;
    return {
      step(dt) {
        speed = p.spin * (1 + 0.5 * Math.sin(w.time * 0.4));
        ang += speed * dt;
        gap = Math.max(16, 70 - w.time * p.narrow);
        arms.forEach((s, i) => {
          w.setBar(s, CX, CY, ang + (i * Math.PI) / 2, AR - 3 - gap, 0);
          s.omega = speed;
        });
      },
      onSeg: (_b, _s, imp) => w.sound("tick", Math.min(0.5, imp / 900)),
      onTap: (x, y) => addMany(w, x, y),
      hud: () => ({
        main: `${Math.round(gap)}px`,
        label: w.tl("gap", "boşluk"),
        progress: 1 - (gap - 16) / 54,
        stats: [
          { k: w.tl("BALLS", "TOP"), v: String(w.count) },
          { k: "RPM", v: String(Math.round(Math.abs(speed) * 9.55)) },
        ],
      }),
      done: () => gap <= 16,
    };
  },
};

// 16 ────────────────────────────────────────────────────────────
const pinball: MachineDef = {
  id: "pinball-bumper-field",
  num: 16,
  name: "Pinball Bumper Field",
  category: "obstacle",
  accent: "#ff3d7f",
  sound: "synth",
  desc: { en: "Static and moving bumpers kick balls around for points.", tr: "Sabit ve hareketli tamponlar topları puan için fırlatır." },
  hook: { en: "Score 10,000?", tr: "10.000 puan?" },
  params: [pCount(40, 200), P("boost", "Bumper kick", "Tampon itişi", 0, 600, 20, 220), pGravity(900), pSize(7)],
  create(w, p) {
    w.gravity.y = p.gravity;
    w.ballCollide = true;
    w.ballE = 0.9;
    w.ballR = p.size;
    w.maxBalls = 400;
    w.seg({ x1: 30, y1: 250, x2: 30, y2: 960, th: 6, color: "#ff3d7f" });
    w.seg({ x1: 510, y1: 250, x2: 510, y2: 960, th: 6, color: "#ff3d7f" });
    w.seg({ x1: 30, y1: 250, x2: 510, y2: 250, th: 6, color: "#ff3d7f" });
    w.seg({ x1: 30, y1: 820, x2: 200, y2: 900, th: 8, color: "#ffffff" });
    w.seg({ x1: 510, y1: 820, x2: 340, y2: 900, th: 8, color: "#ffffff" });
    const cols = ["#ff3d7f", "#ffcd3c", "#3cf0ff", "#7cff6b"];
    for (let row = 0; row < 4; row++) {
      const k = row % 2 ? 4 : 5;
      for (let i = 0; i < k; i++) {
        const x = (k === 5 ? 90 : 135) + i * 90;
        w.bumper({ x, y: 360 + row * 110, r: 20, boost: p.boost, color: cols[row], tag: "b", e: 0.9 });
      }
    }
    const movers = [w.bumper({ x: CX, y: 310, r: 16, boost: p.boost, color: "#ffffff", tag: "m" }), w.bumper({ x: CX, y: 780, r: 26, boost: p.boost, color: "#b46bff", tag: "m" })];
    let score = 0;
    for (let i = 0; i < p.count; i++) w.addBall({ x: w.rand(60, 480), y: w.rand(260, 330), vx: w.rand(-100, 100), color: NEON[i % NEON.length] });
    return {
      step() {
        const t = w.time;
        movers[0].x = CX + Math.sin(t * 1.6) * 200;
        movers[0].vx = Math.cos(t * 1.6) * 320;
        movers[1].x = CX + Math.sin(t * 0.9 + 1) * 140;
        movers[1].vx = Math.cos(t * 0.9 + 1) * 126;
      },
      onBumper(b, bp) {
        const pts = bp.tag === "m" ? 5 : 1;
        score += pts;
        w.sound("hit", 0.6, score % 12);
        if (w.particles.length < 120) w.textFx(bp.x, bp.y - bp.r - 4, `+${pts}`, bp.color);
      },
      onExit(b) {
        w.addBall({ x: w.rand(60, 480), y: 270, vx: w.rand(-100, 100), color: b.color });
      },
      onTap: (x, y) => addMany(w, x, y, 5),
      hud: () => ({
        main: score.toLocaleString("en-US"),
        label: w.tl("score", "puan"),
        progress: Math.min(1, score / 10000),
        stats: [
          { k: w.tl("BALLS", "TOP"), v: String(w.count) },
          { k: w.tl("TIME", "SÜRE"), v: fmtTime(w.time) },
        ],
      }),
      done: () => score >= 10000,
    };
  },
};

// 17 ────────────────────────────────────────────────────────────
const oneWay: MachineDef = {
  id: "one-way-flap-gate",
  num: 17,
  name: "One-Way Flap Gate",
  category: "obstacle",
  accent: "#3cf0ff",
  sound: "tick",
  desc: { en: "Flaps only open left → right. Everything ends up on one side.", tr: "Kapaklar yalnızca soldan sağa açılır. Her şey bir tarafta birikir." },
  hook: { en: "No way back.", tr: "Geri dönüş yok." },
  params: [pCount(200, 500), P("flaps", "Flaps", "Kapak sayısı", 1, 5, 1, 3), P("flapH", "Flap height", "Kapak boyu", 20, 80, 2, 40), pGravity(0, 1500), pSize(7)],
  create(w, p) {
    w.gravity.y = p.gravity;
    w.ballCollide = true;
    w.ballE = 1;
    w.minSpeed = p.gravity > 0 ? 0 : 180;
    w.ballR = p.size;
    w.maxBalls = 800;
    arena(w, "#3cf0ff");
    const top = CY - AR - 10;
    const bot = CY + AR + 10;
    const n = p.flaps;
    const span = bot - top;
    const flapY: number[] = [];
    let y = top;
    const flaps: Seg[] = [];
    for (let i = 0; i < n; i++) {
      const cy = top + (span * (i + 1)) / (n + 1);
      w.seg({ x1: CX, y1: y, x2: CX, y2: cy - p.flapH / 2, th: 8, color: "#ffffff" });
      flaps.push(w.seg({ x1: CX, y1: cy - p.flapH / 2, x2: CX, y2: cy + p.flapH / 2, th: 6, color: "#ffcd3c", oneWay: { nx: 1, ny: 0 } }));
      flapY.push(cy);
      y = cy + p.flapH / 2;
    }
    w.seg({ x1: CX, y1: y, x2: CX, y2: bot, th: 8, color: "#ffffff" });
    for (let i = 0; i < p.count; i++) {
      const a = w.rand(Math.PI / 2 + 0.1, Math.PI * 1.5 - 0.1);
      const r = w.rand(30, AR - 30);
      const va = w.rand(0, TAU);
      w.addBall({ x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r, vx: Math.cos(va) * 220, vy: Math.sin(va) * 220, color: "#ff3d7f" });
    }
    const swing = flaps.map(() => 0);
    let L = 0;
    let R = 0;
    return {
      step() {
        for (const b of w.balls) {
          if (b.px < CX && b.x >= CX) {
            b.color = "#3cf0ff";
            let bi = 0;
            for (let i = 1; i < flapY.length; i++) if (Math.abs(flapY[i] - b.y) < Math.abs(flapY[bi] - b.y)) bi = i;
            swing[bi] = 1;
            w.sound("tick", 0.5, bi * 3 + 5);
          }
        }
      },
      frame(dt) {
        L = 0;
        R = 0;
        for (const b of w.balls) b.x < CX ? L++ : R++;
        flaps.forEach((f, i) => {
          swing[i] = Math.max(0, swing[i] - dt * 5);
          const cy = flapY[i];
          const a = swing[i] * 1.0;
          f.x2 = CX + Math.sin(a) * p.flapH;
          f.y2 = cy - p.flapH / 2 + Math.cos(a) * p.flapH;
          f.x1 = CX;
          f.y1 = cy - p.flapH / 2;
        });
      },
      onSeg: (_b, _s, imp) => w.sound("hit", Math.min(0.2, imp / 2000)),
      onTap: (x, y) => addMany(w, x, y, 5),
      hud: () => ({
        main: `${L} : ${R}`,
        label: w.tl("left : right", "sol : sağ"),
        bars: [
          { color: "#ff3d7f", value: L },
          { color: "#3cf0ff", value: R },
        ],
      }),
      done: () => L === 0,
    };
  },
};

// 18 ────────────────────────────────────────────────────────────
const core: MachineDef = {
  id: "expanding-core",
  num: 18,
  name: "Expanding / Contracting Core",
  category: "obstacle",
  accent: "#ff3d7f",
  sound: "synth",
  desc: { en: "The core inflates and deflates, compressing every ball against the wall.", tr: "Çekirdek büyüyüp küçülerek topları duvara sıkıştırır." },
  hook: { en: "Breathe in… SQUEEZE", tr: "Nefes al… SIKIŞTIR" },
  params: [pCount(320, 600), P("min", "Min radius", "Min yarıçap", 10, 100, 5, 30), P("max", "Max radius", "Maks yarıçap", 80, 200, 5, 165), P("freq", "Pulse speed", "Nabız hızı", 0.1, 2, 0.05, 0.45), pSize(7)],
  create(w, p) {
    w.gravity.y = 0;
    w.ballCollide = true;
    w.ballE = 0.85;
    w.damping = 0.15;
    w.ballR = p.size;
    w.maxBalls = 800;
    arena(w, "#ff3d7f");
    const c = w.bumper({ x: CX, y: CY, r: p.min, color: "#ff3d7f", e: 0.6 });
    fillDisk(w, p.count, 80, { R: AR - 30, colors: ["#ff3d7f", "#ffcd3c", "#ffffff"] });
    for (const b of w.balls) {
      const d = Math.hypot(b.x - CX, b.y - CY);
      if (d < p.min + 20) b.x += p.min + 30;
    }
    let pulses = 0;
    let last = 0;
    return {
      step() {
        const ph = w.time * p.freq * TAU;
        const k = 0.5 - 0.5 * Math.cos(ph);
        c.r = p.min + (p.max - p.min) * k;
        c.rv = (p.max - p.min) * 0.5 * Math.sin(ph) * p.freq * TAU;
        c.color = hsl(330 + k * 60);
        const n = Math.floor(ph / TAU);
        if (n !== last) {
          last = n;
          pulses++;
          w.sound("boom", 0.4);
        }
      },
      onBumper: (_b, _p, imp) => w.sound("hit", Math.min(0.5, imp / 800), 4),
      onTap: (x, y) => addMany(w, x, y, 6),
      hud: () => ({
        main: `${Math.round((100 * (c.r - p.min)) / (p.max - p.min))}%`,
        label: w.tl("core size", "çekirdek"),
        progress: (c.r - p.min) / (p.max - p.min),
        stats: [
          { k: w.tl("PULSES", "NABIZ"), v: String(pulses) },
          { k: w.tl("BALLS", "TOP"), v: String(w.count) },
        ],
      }),
    };
  },
};

export const obstacleMachines: MachineDef[] = [singleSpinner, tripleBlade, counterRings, pendulum, rotatingCross, pinball, oneWay, core];
