import type { MachineDef, Seg } from "../engine/types";
import { AR, CX, CY, TAU, type World } from "../engine/world";
import { NEON, P, TEAM, arena, defaultTap, fillDisk, fmtTime, hsl, pCount, pGravity, pSize, pSpeed, speedOf } from "./helpers";

const countBy = (w: World, colors: string[]) => colors.map((c) => w.balls.reduce((s, b) => s + (b.color === c ? 1 : 0), 0));

// 19 ────────────────────────────────────────────────────────────
const colorBattle: MachineDef = {
  id: "color-battle-arena",
  num: 19,
  name: "Color Battle Arena",
  category: "race",
  accent: "#ff3d5a",
  sound: "pop",
  desc: { en: "Teams collide and lose HP; every kill spawns a reinforcement.", tr: "Takımlar çarpışıp can kaybeder; her eleme takıma yeni top kazandırır." },
  hook: { en: "Which color wins?", tr: "Hangi renk kazanır?" },
  params: [P("teams", "Teams", "Takım", 2, 6, 1, 4), P("per", "Balls / team", "Takım başı top", 5, 60, 1, 18), P("hp", "Ball HP", "Top canı", 1, 10, 1, 3), pSpeed(260), pSize(9)],
  create(w, p) {
    w.gravity.y = 0;
    w.ballCollide = true;
    w.ballE = 1;
    w.minSpeed = p.speed * 0.7;
    w.ballR = p.size;
    w.maxBalls = 600;
    arena(w, "#ffffff");
    const teams = TEAM.slice(0, p.teams);
    const pts = teams.map(() => 0);
    const base = (t: number) => {
      const a = (t / teams.length) * TAU - Math.PI / 2;
      return { x: CX + Math.cos(a) * (AR - 70), y: CY + Math.sin(a) * (AR - 70) };
    };
    const spawn = (t: number) => {
      const q = base(t);
      const a = w.rand(0, TAU);
      return w.addBall({ x: q.x + w.rand(-15, 15), y: q.y + w.rand(-15, 15), vx: Math.cos(a) * p.speed, vy: Math.sin(a) * p.speed, color: teams[t], tag: t, hp: p.hp, cd: 0.5 });
    };
    teams.forEach((_, t) => {
      for (let i = 0; i < p.per; i++) spawn(t);
    });
    let counts = countBy(w, teams);
    let winner = -1;
    return {
      frame() {
        counts = countBy(w, teams);
        const alive = counts.filter((c) => c > 0).length;
        if (alive === 1 && winner < 0) {
          winner = counts.findIndex((c) => c > 0);
          w.flash = 1;
          w.flashColor = teams[winner];
          w.sound("boom", 1);
        }
      },
      onBall(a, b) {
        if (a.tag === b.tag) return w.sound("tick", 0.1);
        if (a.cd > 0 || b.cd > 0) return;
        a.hp--;
        b.hp--;
        a.cd = b.cd = 0.15;
        w.sound("hit", 0.5, a.tag * 2 + b.tag);
        for (const [x, y] of [
          [a, b],
          [b, a],
        ]) {
          if (x.hp <= 0 && !x.dead) {
            x.dead = true;
            pts[y.tag]++;
            w.burst(x.x, x.y, x.color, 10, 220);
            w.sound("pop", 0.8, y.tag * 2 + 4);
            spawn(y.tag);
          }
        }
      },
      drawBack(ctx) {
        teams.forEach((c, t) => {
          const q = base(t);
          ctx.fillStyle = c;
          ctx.globalAlpha = 0.12;
          ctx.beginPath();
          ctx.arc(q.x, q.y, 40, 0, TAU);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      },
      onTap(x, y) {
        let best = 0;
        let bd = Infinity;
        teams.forEach((_, t) => {
          const q = base(t);
          const d = (q.x - x) ** 2 + (q.y - y) ** 2;
          if (d < bd) {
            bd = d;
            best = t;
          }
        });
        for (let i = 0; i < 3; i++) spawn(best);
        w.sound("chime", 0.6, best * 2);
      },
      hud: () => ({
        main: winner >= 0 ? w.tl("WINNER", "KAZANAN") : String(w.count),
        label: winner >= 0 ? w.tl("last team standing", "son kalan takım") : w.tl("fighters", "savaşçı"),
        bars: teams.map((c, i) => ({ color: c, value: counts[i] })),
        stats: teams.map((c, i) => ({ k: "★", v: String(pts[i]), color: c })),
        banner: winner >= 0 ? w.tl("VICTORY!", "ZAFER!") : undefined,
      }),
      done: () => winner >= 0,
    };
  },
};

// 20 ────────────────────────────────────────────────────────────
const lastColor: MachineDef = {
  id: "last-color-standing",
  num: 20,
  name: "Last Color Standing",
  category: "race",
  accent: "#ffd23c",
  sound: "marimba",
  desc: { en: "On impact the faster ball paints the slower one. One color will remain.", tr: "Çarpışmada hızlı top yavaş olanı boyar. Tek bir renk kalacak." },
  hook: { en: "Pick your color now!", tr: "Rengini şimdi seç!" },
  params: [P("colors", "Colors", "Renk sayısı", 2, 6, 1, 6), P("per", "Balls / color", "Renk başı top", 5, 80, 1, 30), pSpeed(240), pSize(8)],
  create(w, p) {
    w.gravity.y = 0;
    w.ballCollide = true;
    w.ballE = 1;
    w.minSpeed = p.speed * 0.6;
    w.ballR = p.size;
    w.maxBalls = 600;
    arena(w, "#ffffff");
    const colors = TEAM.slice(0, p.colors);
    fillDisk(w, p.colors * p.per, p.speed, { colors, R: AR - 25 });
    let counts = countBy(w, colors);
    let winner = -1;
    let flips = 0;
    return {
      frame() {
        counts = countBy(w, colors);
        if (winner < 0) {
          const alive = counts.filter((c) => c > 0);
          if (alive.length === 1) {
            winner = counts.findIndex((c) => c > 0);
            w.flash = 1;
            w.flashColor = colors[winner];
            w.sound("boom", 1);
          }
        }
      },
      onBall(a, b) {
        if (a.color === b.color) return w.sound("tick", 0.08);
        const [win, lose] = speedOf(a) >= speedOf(b) ? [a, b] : [b, a];
        lose.color = win.color;
        flips++;
        w.sound("hit", 0.45, colors.indexOf(win.color) * 2 + (flips % 2));
        if (w.particles.length < 200) w.ringFx(lose.x, lose.y, win.color, 5);
      },
      onTap: (x, y) => w.shockwave(x, y, 400, 160),
      hud: () => ({
        main: winner >= 0 ? w.tl("WINNER", "KAZANAN") : String(counts.filter((c) => c > 0).length),
        label: winner >= 0 ? w.tl("last color standing", "son kalan renk") : w.tl("colors alive", "kalan renk"),
        bars: colors.map((c, i) => ({ color: c, value: counts[i] })),
        stats: colors.map((c, i) => ({ k: "●", v: String(counts[i]), color: c })),
        banner: winner >= 0 ? w.tl("CHAMPION!", "ŞAMPİYON!") : undefined,
      }),
      done: () => winner >= 0,
    };
  },
};

// 21 ────────────────────────────────────────────────────────────
const overflow: MachineDef = {
  id: "overflow-pressure",
  num: 21,
  name: "Overflow Pressure",
  category: "race",
  accent: "#3cf0ff",
  sound: "tick",
  desc: { en: "Balls pour into the bowl until the pressure spills over.", tr: "Toplar hazneye dolar, basınç artınca taşar." },
  hook: { en: "When will it overflow?", tr: "Ne zaman taşacak?" },
  params: [P("rate", "Pour / sec", "Saniyede dökme", 5, 80, 1, 28), P("mouth", "Opening", "Ağız genişliği", 0.2, 1.2, 0.05, 0.45), pGravity(900), pSize(9)],
  create(w, p) {
    w.gravity.y = p.gravity;
    w.ballCollide = true;
    w.ballE = 0.5;
    w.restitution = 0.6;
    w.ballR = p.size;
    w.maxBalls = 1100;
    const top = Math.PI * 1.5;
    arena(w, "#3cf0ff").gaps = [[top - p.mouth, top + p.mouth]];
    const capacity = Math.floor(((AR - 4) ** 2 / (p.size * p.size)) * 0.95);
    let inside = 0;
    let over = 0;
    let t = 0;
    return {
      frame(dt) {
        t -= dt;
        while (t <= 0) {
          t += 1 / p.rate;
          const k = inside / capacity;
          w.addBall({ x: CX + w.rand(-12, 12), y: CY - AR - 110, vy: 200, color: hsl(190 - k * 190) });
        }
        inside = 0;
        for (const b of w.balls) if ((b.x - CX) ** 2 + (b.y - CY) ** 2 < AR * AR) inside++;
      },
      onExit() {
        over++;
        if (over % 3 === 0) w.sound("pop", 0.4, over % 8);
      },
      onRing: (_b, _r, imp) => w.sound("tick", Math.min(0.4, imp / 1500)),
      drawBack(ctx) {
        const k = Math.min(1, inside / capacity);
        ctx.fillStyle = hsl(190 - k * 190, 90, 50);
        ctx.globalAlpha = 0.12;
        ctx.beginPath();
        ctx.arc(CX, CY, AR, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(CX - 20, CY - AR - 126, 40, 10);
      },
      onTap: (x, y) => w.shockwave(x, y, 600, 160),
      hud: () => {
        const k = inside / capacity;
        return {
          main: `${Math.min(999, Math.round(k * 100))}%`,
          label: w.tl("pressure", "basınç"),
          progress: k,
          stats: [
            { k: w.tl("INSIDE", "İÇERİDE"), v: String(inside) },
            { k: w.tl("OVERFLOW", "TAŞAN"), v: String(over), color: over ? "#ff3d5a" : undefined },
          ],
          banner: over > 0 ? w.tl("OVERFLOW!", "TAŞTI!") : undefined,
        };
      },
      done: () => over >= 150,
    };
  },
};

// 22 ────────────────────────────────────────────────────────────
const shredder: MachineDef = {
  id: "shredder-drain",
  num: 22,
  name: "Shredder / Drain Hole",
  category: "race",
  accent: "#ff8a3c",
  sound: "pop",
  desc: { en: "Balls drain through the hole into spinning shredder gears.", tr: "Toplar delikten akıp dönen parçalayıcı dişlilere girer." },
  hook: { en: "Into the shredder…", tr: "Parçalayıcıya…" },
  params: [pCount(400, 800), P("hole", "Hole size", "Delik boyutu", 0.1, 0.8, 0.02, 0.24), pGravity(900), pSize(7)],
  create(w, p) {
    w.gravity.y = p.gravity;
    w.ballCollide = true;
    w.ballE = 0.6;
    w.ballR = p.size;
    w.maxBalls = 1000;
    const ring = arena(w, "#ff8a3c");
    ring.gaps = [[Math.PI / 2 - p.hole, Math.PI / 2 + p.hole]];
    const gy = CY + AR + 55;
    const gap = p.size * 2 + 4;
    const gears = [w.bumper({ x: CX - 30 - gap / 2, y: gy, r: 30, color: "#888899", e: 0.4 }), w.bumper({ x: CX + 30 + gap / 2, y: gy, r: 30, color: "#888899", e: 0.4 })];
    // funnel lips guiding into gears
    w.seg({ x1: CX - 90, y1: CY + AR - 10, x2: CX - 60 - gap / 2, y2: gy - 20, th: 6, color: "#ff8a3c" });
    w.seg({ x1: CX + 90, y1: CY + AR - 10, x2: CX + 60 + gap / 2, y2: gy - 20, th: 6, color: "#ff8a3c" });
    const stir = w.seg({ x1: 0, y1: 0, x2: 0, y2: 0, th: 10, color: "#ffffff" });
    fillDisk(w, p.count, 40, { R: AR - 30, colors: ["#ff8a3c", "#ffcd3c", "#ff3d5a"] });
    let shredded = 0;
    let rot = 0;
    let refill = 0;
    return {
      step(dt) {
        rot += dt * 6;
        w.setBar(stir, CX, CY - 40, w.time * 1.2, 120, -120);
        stir.cx = CX;
        stir.cy = CY - 40;
        stir.omega = 1.2;
        for (const b of w.balls) {
          if (!b.dead && b.y > gy + 10) {
            b.dead = true;
            shredded++;
            w.burst(b.x, b.y, b.color, 5, 260);
            if (shredded % 2 === 0) w.sound("pop", 0.5, shredded % 10);
          }
        }
      },
      frame(dt) {
        if (w.count === 0) {
          refill += dt;
          if (refill > 1) {
            refill = 0;
            fillDisk(w, p.count, 40, { R: AR - 30, colors: [hsl(w.time * 40), hsl(w.time * 40 + 40), hsl(w.time * 40 + 80)] });
            w.sound("chime", 0.8, 5);
          }
        }
      },
      drawFront(ctx) {
        for (const [i, g] of gears.entries()) {
          ctx.save();
          ctx.translate(g.x, g.y);
          ctx.rotate(i ? -rot : rot);
          ctx.fillStyle = "#c9c9d6";
          for (let k = 0; k < 10; k++) {
            ctx.rotate(TAU / 10);
            ctx.fillRect(g.r - 4, -5, 12, 10);
          }
          ctx.fillStyle = "#1a1a2a";
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
      },
      onTap: (x, y) => defaultTap(w, x, y),
      hud: () => ({
        main: String(shredded),
        label: w.tl("shredded", "parçalanan"),
        progress: 1 - w.count / p.count,
        stats: [
          { k: w.tl("LEFT", "KALAN"), v: String(w.count) },
          { k: w.tl("TIME", "SÜRE"), v: fmtTime(w.time) },
        ],
      }),
      done: () => w.count === 0 && shredded > 0,
    };
  },
};

// 23 ────────────────────────────────────────────────────────────
const spiral: MachineDef = {
  id: "spiral-funnel",
  num: 23,
  name: "Spiral Funnel",
  category: "race",
  accent: "#b46bff",
  sound: "marimba",
  desc: { en: "A swirling funnel pulls balls along spiral arms into the drain.", tr: "Dönen huni topları sarmal kollar boyunca merkeze çeker." },
  hook: { en: "Hypnotic spiral", tr: "Hipnotik sarmal" },
  params: [pCount(260, 500), P("pull", "Pull", "Çekim", 100, 2000, 25, 900), P("swirl", "Swirl", "Girdap", 0, 1200, 25, 350), P("arms", "Arms", "Kol", 0, 4, 1, 2), pSize(6)],
  create(w, p) {
    w.gravity.y = 0;
    w.ballCollide = true;
    w.ballE = 0.8;
    w.damping = 1.2;
    w.ballR = p.size;
    w.maxBalls = 800;
    w.trail = 0.35;
    arena(w, "#b46bff");
    const armSegs: { s: Seg; a: number; r0: number; r1: number }[] = [];
    const steps = 18;
    for (let k = 0; k < p.arms; k++) {
      for (let i = 0; i < steps; i++) {
        const r0 = 60 + (i / steps) * (AR - 70);
        const r1 = 60 + ((i + 1) / steps) * (AR - 70);
        armSegs.push({ s: w.seg({ x1: 0, y1: 0, x2: 0, y2: 0, th: 5, color: hsl(270 + k * 40) }), a: (k / p.arms) * TAU, r0, r1 });
      }
    }
    let rot = 0;
    let drained = 0;
    const respawn = (color?: string) => {
      const a = w.rand(0, TAU);
      w.addBall({ x: CX + Math.cos(a) * (AR - 20), y: CY + Math.sin(a) * (AR - 20), color: color ?? hsl(drained * 3 + 270) });
    };
    for (let i = 0; i < p.count; i++) respawn(hsl(270 + i));
    return {
      step(dt) {
        rot += dt * 0.5;
        for (const q of armSegs) {
          const a0 = q.a + rot + q.r0 / 60;
          const a1 = q.a + rot + q.r1 / 60;
          q.s.x1 = CX + Math.cos(a0) * q.r0;
          q.s.y1 = CY + Math.sin(a0) * q.r0;
          q.s.x2 = CX + Math.cos(a1) * q.r1;
          q.s.y2 = CY + Math.sin(a1) * q.r1;
          q.s.cx = CX;
          q.s.cy = CY;
          q.s.omega = 0.5;
        }
        for (const b of w.balls) {
          const dx = b.x - CX;
          const dy = b.y - CY;
          const d = Math.hypot(dx, dy) || 1;
          b.vx += ((-dx / d) * p.pull + (-dy / d) * p.swirl * (1 - d / (AR * 1.4))) * dt;
          b.vy += ((-dy / d) * p.pull + (dx / d) * p.swirl * (1 - d / (AR * 1.4))) * dt;
          if (d < 18 && !b.dead) {
            b.dead = true;
            drained++;
            if (drained % 2 === 0) w.sound("chime", 0.35, drained % 12);
            respawn();
          }
        }
      },
      drawBack(ctx) {
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(CX, CY, 20, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "#b46bff";
        ctx.lineWidth = 3;
        ctx.stroke();
      },
      onTap: (x, y) => w.shockwave(x, y, 500, 160),
      hud: () => ({
        main: String(drained),
        label: w.tl("drained", "akan"),
        stats: [
          { k: w.tl("BALLS", "TOP"), v: String(w.count) },
          { k: w.tl("TIME", "SÜRE"), v: fmtTime(w.time) },
        ],
      }),
      done: () => drained >= 500,
    };
  },
};

// 24 ────────────────────────────────────────────────────────────
const cageBreak: MachineDef = {
  id: "cage-break",
  num: 24,
  name: "Cage Break",
  category: "race",
  accent: "#7cff6b",
  sound: "pop",
  desc: { en: "Balls chip away the cage bricks. Each broken brick spawns a ball.", tr: "Toplar kafes tuğlalarını kırar. Her kırılan tuğla yeni top doğurur." },
  hook: { en: "Break out!", tr: "Kafesi kır!" },
  params: [P("bricks", "Bricks", "Tuğla", 8, 64, 2, 32), P("hp", "Brick HP", "Tuğla canı", 1, 20, 1, 5), pGravity(600), pSpeed(600), pSize(8)],
  create(w, p) {
    w.gravity.y = p.gravity;
    w.ballR = p.size;
    w.maxBalls = 400;
    w.ballCollide = true;
    w.ballE = 1;
    const ring = w.ring({ R: AR, th: 14, color: "#7cff6b", bricks: { n: p.bricks, hp: Array(p.bricks).fill(p.hp), max: p.hp }, omega: 0.3 });
    let escaped = 0;
    let broken = 0;
    const spawn = () => {
      const a = w.rand(0, TAU);
      w.addBall({ x: CX, y: CY, vx: Math.cos(a) * p.speed, vy: Math.sin(a) * p.speed, color: NEON[w.totalSpawned % NEON.length] });
    };
    for (let i = 0; i < 3; i++) spawn();
    return {
      onRing(b, r, _imp, brick) {
        if (r !== ring || brick < 0 || !ring.bricks) return;
        const pdx = b.px - CX;
        const pdy = b.py - CY;
        if (pdx * pdx + pdy * pdy > AR * AR) return; // outside hits don't count
        ring.bricks.hp[brick]--;
        if (ring.bricks.hp[brick] <= 0) {
          broken++;
          w.burst(b.x, b.y, "#7cff6b", 12, 240);
          w.sound("boom", 0.5);
          w.shake = 4;
          spawn();
        } else w.sound("pop", 0.5, ring.bricks.hp[brick] + 2);
      },
      onExit() {
        escaped++;
        w.sound("chime", 0.4, escaped % 10);
      },
      frame() {
        if (w.count === 0 && broken < p.bricks) spawn();
      },
      onTap: (x, y) => defaultTap(w, x, y),
      hud: () => ({
        main: `${p.bricks - broken}`,
        label: w.tl("bricks left", "kalan tuğla"),
        progress: broken / p.bricks,
        stats: [
          { k: w.tl("BALLS", "TOP"), v: String(w.count) },
          { k: w.tl("ESCAPED", "KAÇAN"), v: String(escaped) },
        ],
        banner: broken >= p.bricks ? w.tl("FREEDOM!", "ÖZGÜRLÜK!") : undefined,
      }),
      done: () => broken >= p.bricks && w.count === 0,
    };
  },
};

export const raceMachines: MachineDef[] = [colorBattle, lastColor, overflow, shredder, spiral, cageBreak];
