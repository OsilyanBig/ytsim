# SimShorts Lab

Oddly-satisfying physics & ball simulations for YouTube Shorts / Reels / TikTok — 30 machines, procedural ASMR audio (Web Audio API) and one-click 9:16 video recording.

**Stack:** Next.js App Router · TypeScript · Tailwind CSS v4 · Canvas 2D · Web Audio · MediaRecorder

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build (Vercel-ready, zero config)
```

## Architecture

```
app/                 Studio (/), Gallery (/gallery), Guides (/guides)
components/
  Studio.tsx         9:16 stage, machine picker, control panel, recording UI (client-only, ssr:false)
  Thumb.tsx          headless-runs a machine to paint gallery previews
  I18nProvider.tsx   TR / EN switch (localStorage)
lib/engine/
  world.ts           physics core: fixed-step integrator, spatial-hash ball collisions,
                     rotating rings with gaps/bricks, moving segments (one-way), bumpers, attractor
  render.ts          canvas renderer + in-video HUD + 3 s hook caption
  types.ts           MachineDef / MachineInstance contracts
lib/machines/        modular registry — multiply.ts (1-10), obstacles.ts (11-18),
                     race.ts (19-24), physics.ts (25-30), index.ts
lib/audio.ts         procedural marimba / pop / tick / synth / boom voices, throttled, routed to recorder
lib/recorder.ts      canvas.captureStream + Web Audio stream → MP4 (or WebM fallback)
lib/presets.ts       gallery presets
lib/guides.ts        Shorts playbook cards
```

### Adding a machine

Create a `MachineDef` (id, num, params, `create(world, params)` returning hooks like `onRing`, `onSeg`, `onBall`, `onTap`, `hud`, `done`) and append it to any category array — it appears in the studio, picker and gallery automatically.

## Controls

`↑/↓` or swipe / mouse wheel: switch machine · tap/click: interact · `Space` pause · `R` reset · `H` clean mode · `M` mute

Auto record: 15 / 30 / 45 / 60 s, or **Until target** (stops ~1.8 s after the machine reports its goal) — the file downloads automatically.
