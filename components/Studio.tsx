"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "./I18nProvider";
import { CATEGORIES, MACHINES, defaultParams, getMachine } from "@/lib/machines";
import { getPreset } from "@/lib/presets";
import { World, W, H } from "@/lib/engine/world";
import { render } from "@/lib/engine/render";
import type { Category, Params, SoundStyle } from "@/lib/engine/types";
import { AudioEngine } from "@/lib/audio";
import { Recorder, downloadBlob, recordingSupported } from "@/lib/recorder";

const STEP = 1 / 180;
const MAX_STEPS = 10;
type AutoMode = "off" | "15" | "30" | "45" | "60" | "target";

const CAT_COLOR: Record<Category, string> = {
  multiply: "#ffcd3c",
  obstacle: "#3cf0ff",
  race: "#ff3d7f",
  physics: "#7cff6b",
};

function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function Studio() {
  const { t, pick, lang } = useI18n();

  const [idx, setIdx] = useState(0);
  const [params, setParams] = useState<Params>(() => defaultParams(MACHINES[0]));
  const [seedNonce, setSeedNonce] = useState(0);
  const [paused, setPaused] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);
  const [clean, setClean] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [listOpen, setListOpen] = useState(true);
  const [mobileSheet, setMobileSheet] = useState<"none" | "list" | "panel">("none");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category | "all">("all");
  const [showHud, setShowHud] = useState(true);
  const [showHook, setShowHook] = useState(true);
  const [quality, setQuality] = useState<720 | 1080>(720);
  const [soundOn, setSoundOn] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [style, setStyle] = useState<SoundStyle | "auto">("auto");
  const [audioReady, setAudioReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [autoMode, setAutoMode] = useState<AutoMode>("30");
  const [resetOnRec, setResetOnRec] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [stats, setStats] = useState({ fps: 0, balls: 0 });
  const [canRecord, setCanRecord] = useState(true);

  const def = MACHINES[idx];

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<World | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const recRef = useRef<Recorder | null>(null);
  const live = useRef({ paused, simSpeed, showHud, showHook, lang, def, autoMode: "off" as AutoMode, recStart: 0, doneAt: 0 });
  live.current.paused = paused;
  live.current.simSpeed = simSpeed;
  live.current.showHud = showHud;
  live.current.showHook = showHook;
  live.current.lang = lang;
  live.current.def = def;

  // --- init from URL
  useEffect(() => {
    setCanRecord(recordingSupported());
    const q = new URLSearchParams(window.location.search);
    const preset = getPreset(q.get("p"));
    const m = getMachine(preset?.machine ?? q.get("m"));
    if (m) {
      const i = MACHINES.indexOf(m);
      setIdx(i);
      setParams({ ...defaultParams(m), ...(preset?.params ?? {}) });
    }
    if (window.innerWidth < 1024) {
      setPanelOpen(false);
      setListOpen(false);
    }
  }, []);

  // --- build world
  const build = useCallback(() => {
    const d = live.current.def;
    const w = new World((Math.random() * 2 ** 31) | 0);
    w.lang = live.current.lang;
    w.m = d.create(w, params);
    worldRef.current = w;
    live.current.doneAt = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, idx]);

  useEffect(() => {
    build();
  }, [build, seedNonce]);

  useEffect(() => {
    if (worldRef.current) worldRef.current.lang = lang;
  }, [lang]);

  // --- audio settings
  useEffect(() => {
    const a = (audioRef.current ??= new AudioEngine());
    a.setEnabled(soundOn);
    a.setVolume(volume);
    a.style = style === "auto" ? def.sound : style;
  }, [soundOn, volume, style, def]);

  const ensureAudio = useCallback(() => {
    const a = (audioRef.current ??= new AudioEngine());
    const ctx = a.ensure();
    if (ctx) setAudioReady(true);
    return a;
  }, []);

  // --- url sync
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("m") !== def.id) {
      url.searchParams.set("m", def.id);
      url.searchParams.delete("p");
      window.history.replaceState(null, "", url.toString());
    }
  }, [def]);

  const selectMachine = useCallback((i: number) => {
    const n = ((i % MACHINES.length) + MACHINES.length) % MACHINES.length;
    setIdx(n);
    setParams(defaultParams(MACHINES[n]));
    setMobileSheet("none");
  }, []);

  const next = useCallback(() => selectMachine(live.current.def.num), [selectMachine]);
  const prev = useCallback(() => selectMachine(live.current.def.num - 2), [selectMachine]);
  const reset = useCallback(() => setSeedNonce((n) => n + 1), []);

  // --- recording
  const stopRec = useCallback(async () => {
    const r = recRef.current;
    if (!r || !r.recording) return;
    live.current.autoMode = "off";
    const blob = await r.stop();
    setRecording(false);
    if (blob && blob.size > 0) {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      downloadBlob(blob, `${live.current.def.id}-${stamp}.${r.ext}`);
      setToast(`${t("saved")} (.${r.ext})`);
      setTimeout(() => setToast(null), 3000);
    }
  }, [t]);

  const startRec = useCallback(
    (mode: AutoMode) => {
      const canvas = canvasRef.current;
      if (!canvas || !recordingSupported()) return;
      const a = ensureAudio();
      if (resetOnRec) build();
      const r = (recRef.current ??= new Recorder());
      try {
        r.start(canvas, a.stream, 60, quality === 1080 ? 14_000_000 : 8_000_000);
      } catch (e) {
        setToast(String(e));
        return;
      }
      live.current.autoMode = mode;
      live.current.recStart = performance.now();
      live.current.doneAt = 0;
      setPaused(false);
      setRecording(true);
    },
    [build, ensureAudio, quality, resetOnRec],
  );

  // --- main loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let frames = 0;
    let fpsT = last;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      const w = worldRef.current;
      const L = live.current;
      if (!w) return;
      if (!L.paused) {
        acc += dt * L.simSpeed;
        let steps = 0;
        while (acc >= STEP && steps < MAX_STEPS) {
          w.step(STEP);
          acc -= STEP;
          steps++;
        }
        if (steps >= MAX_STEPS) acc = 0;
        w.frame(dt * L.simSpeed);
      }
      if (w.sounds.length) {
        audioRef.current?.play(w.sounds, w.count);
        w.sounds.length = 0;
      }
      render(ctx, w, canvas.width / W, {
        name: L.def.name,
        num: L.def.num,
        accent: L.def.accent,
        hook: L.def.hook[L.lang],
        showHud: L.showHud,
        showHook: L.showHook,
      });

      // auto-record control
      if (recRef.current?.recording && L.autoMode !== "off") {
        const el = (now - L.recStart) / 1000;
        if (L.autoMode === "target") {
          if (!L.doneAt && w.m?.done?.()) L.doneAt = now;
          if ((L.doneAt && now - L.doneAt > 1800) || el > 90) void stopRec();
        } else if (el >= Number(L.autoMode)) void stopRec();
      }

      frames++;
      if (now - fpsT > 500) {
        setStats({ fps: Math.round((frames * 1000) / (now - fpsT)), balls: w.count });
        if (recRef.current?.recording) setRecTime((now - L.recStart) / 1000);
        frames = 0;
        fpsT = now;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [stopRec]);

  // --- fit 9:16 stage into available space
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [fit, setFit] = useState({ w: 270, h: 480 });
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const h = Math.max(160, Math.min(r.height, (r.width * 16) / 9));
      setFit({ w: Math.floor((h * 9) / 16), h: Math.floor(h) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // --- input: pointer (tap / swipe) & wheel
  const ptr = useRef<{ x: number; y: number; t: number } | null>(null);
  const wheelT = useRef(0);
  const onPointerDown = (e: React.PointerEvent) => {
    ensureAudio();
    ptr.current = { x: e.clientX, y: e.clientY, t: performance.now() };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = ptr.current;
    ptr.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.3) {
      if (recRef.current?.recording) return;
      return dy < 0 ? next() : prev();
    }
    if (Math.hypot(dx, dy) < 14) {
      const c = canvasRef.current;
      const w = worldRef.current;
      if (!c || !w?.m) return;
      const r = c.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * W;
      const y = ((e.clientY - r.top) / r.height) * H;
      if (w.m.onTap) w.m.onTap(x, y);
    }
  };
  const onWheel = (e: React.WheelEvent) => {
    if (recRef.current?.recording) return;
    const now = performance.now();
    if (Math.abs(e.deltaY) < 30 || now - wheelT.current < 700) return;
    wheelT.current = now;
    if (e.deltaY > 0) next();
    else prev();
  };

  // --- keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      const recordingNow = !!recRef.current?.recording;
      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
          if (!recordingNow) next();
          e.preventDefault();
          break;
        case "ArrowUp":
        case "ArrowLeft":
          if (!recordingNow) prev();
          e.preventDefault();
          break;
        case " ":
          setPaused((p) => !p);
          e.preventDefault();
          break;
        case "r":
        case "R":
          reset();
          break;
        case "h":
        case "H":
          setClean((c) => !c);
          break;
        case "m":
        case "M":
          setSoundOn((s) => !s);
          break;
        case "Escape":
          setClean(false);
          setMobileSheet("none");
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, reset]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MACHINES.filter((m) => (cat === "all" || m.category === cat) && (!q || m.name.toLowerCase().includes(q) || String(m.num) === q || pick(m.desc).toLowerCase().includes(q)));
  }, [query, cat, pick]);

  // ------------------------------------------------------------------ UI parts
  const machineList = (
    <div className="flex h-full flex-col">
      <div className="space-y-2 p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/60"
        />
        <div className="flex flex-wrap gap-1">
          <Chip active={cat === "all"} onClick={() => setCat("all")}>
            {t("all")} · {MACHINES.length}
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} color={CAT_COLOR[c.id]}>
              {c[lang]}
            </Chip>
          ))}
        </div>
      </div>
      <div className="scroll-thin min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {filtered.map((m) => {
          const i = MACHINES.indexOf(m);
          const active = i === idx;
          return (
            <button
              key={m.id}
              onClick={() => selectMachine(i)}
              className={`group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition ${active ? "bg-white/10" : "hover:bg-white/5"}`}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-black text-black"
                style={{ background: CAT_COLOR[m.category] }}
              >
                {String(m.num).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className={`block truncate text-sm font-semibold ${active ? "text-white" : "text-white/80"}`}>{m.name}</span>
                <span className="block truncate text-[11px] text-white/40">{pick(m.desc)}</span>
              </span>
            </button>
          );
        })}
      </div>
      <button
        onClick={() => selectMachine(Math.floor(Math.random() * MACHINES.length))}
        className="m-3 mt-0 rounded-lg border border-white/10 py-2 text-sm font-semibold text-white/70 hover:bg-white/5"
      >
        🎲 {t("random")}
      </button>
    </div>
  );

  const panel = (
    <div className="scroll-thin h-full space-y-5 overflow-y-auto p-4 text-sm">
      <Section title={t("controls")}>
        <div className="grid grid-cols-4 gap-1.5">
          <Btn onClick={prev} title="↑">▲</Btn>
          <Btn onClick={() => setPaused((p) => !p)} accent>
            {paused ? "▶" : "❚❚"}
          </Btn>
          <Btn onClick={reset} title="R">↺</Btn>
          <Btn onClick={next} title="↓">▼</Btn>
        </div>
        <Slider label={t("simSpeed")} value={simSpeed} min={0.25} max={3} step={0.05} onChange={setSimSpeed} fmt={(v) => `${v.toFixed(2)}x`} />
        <div className="flex gap-1.5">
          <Btn onClick={() => setClean(true)} className="flex-1">
            ⛶ {t("hideUi")} (H)
          </Btn>
        </div>
      </Section>

      <Section
        title={t("params")}
        right={
          <button className="text-[11px] text-white/40 hover:text-white" onClick={() => setParams(defaultParams(def))}>
            {t("reset")}
          </button>
        }
      >
        {def.params.map((p) => (
          <Slider
            key={p.key}
            label={p.label[lang]}
            value={params[p.key] ?? p.def}
            min={p.min}
            max={p.max}
            step={p.step}
            onChange={(v) => setParams((s) => ({ ...s, [p.key]: v }))}
          />
        ))}
      </Section>

      <Section title={t("sound")}>
        <div className="flex items-center gap-2">
          <Btn onClick={() => { ensureAudio(); setSoundOn((s) => !s); }} accent={soundOn} className="w-24">
            {soundOn ? "🔊 ON" : "🔇 OFF"}
          </Btn>
          <div className="flex-1">
            <Slider label={t("volume")} value={volume} min={0} max={1} step={0.01} onChange={setVolume} fmt={(v) => `${Math.round(v * 100)}%`} />
          </div>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs text-white/50">{t("style")}</span>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as SoundStyle | "auto")}
            className="w-full rounded-lg border border-white/10 bg-[#11111d] px-2 py-2 text-sm"
          >
            <option value="auto">Auto ({def.sound})</option>
            <option value="marimba">Marimba</option>
            <option value="pop">Soft pop</option>
            <option value="tick">Tick</option>
            <option value="synth">Synth</option>
          </select>
        </label>
        {!audioReady && <p className="text-[11px] text-amber-300/80">{t("enableAudio")}</p>}
      </Section>

      <Section title={t("record")}>
        {!canRecord && <p className="text-xs text-red-300">{t("notSupported")}</p>}
        <div className="grid grid-cols-2 gap-1.5">
          {recording ? (
            <Btn onClick={() => void stopRec()} className="col-span-2 !bg-red-500 !text-white">
              ■ {t("stop")} · {fmt(recTime)}
            </Btn>
          ) : (
            <>
              <Btn onClick={() => startRec("off")} disabled={!canRecord}>
                ● {t("start")}
              </Btn>
              <Btn onClick={() => startRec(autoMode)} disabled={!canRecord || autoMode === "off"} accent>
                ⏺ {t("autoRecord")}
              </Btn>
            </>
          )}
        </div>
        <div className="grid grid-cols-6 gap-1">
          {(["15", "30", "45", "60", "target"] as AutoMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setAutoMode(m)}
              className={`rounded-md py-1.5 text-xs font-bold ${m === "target" ? "col-span-2" : ""} ${autoMode === m ? "bg-cyan-400 text-black" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
            >
              {m === "target" ? `🎯 ${t("untilTarget")}` : `${m}s`}
            </button>
          ))}
        </div>
        <Toggle label={t("resetOnRec")} value={resetOnRec} onChange={setResetOnRec} />
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">{t("quality")}</span>
          <div className="flex gap-1">
            {([720, 1080] as const).map((q) => (
              <button
                key={q}
                disabled={recording}
                onClick={() => setQuality(q)}
                className={`rounded-md px-2 py-1 text-xs font-bold ${quality === q ? "bg-white text-black" : "bg-white/5 text-white/60"}`}
              >
                {q === 720 ? "720×1280" : "1080×1920"}
              </button>
            ))}
          </div>
        </div>
        <Toggle label={t("hud")} value={showHud} onChange={setShowHud} />
        <Toggle label={t("hook")} value={showHook} onChange={setShowHook} />
      </Section>

      <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2 font-mono text-xs text-white/60">
        <span>
          {t("fps")} <b className={stats.fps >= 50 ? "text-green-300" : stats.fps >= 30 ? "text-amber-300" : "text-red-300"}>{stats.fps}</b>
        </span>
        <span>
          {t("balls")} <b className="text-white">{stats.balls}</b>
        </span>
      </div>
      <p className="text-[11px] leading-relaxed text-white/35">{t("tips")}</p>
    </div>
  );

  const stage = (
    <div ref={boxRef} className="relative flex h-full w-full items-center justify-center">
      <div className="relative" style={{ width: fit.w, height: fit.h }}>
        <canvas
          ref={canvasRef}
          width={quality === 1080 ? 1080 : 720}
          height={quality === 1080 ? 1920 : 1280}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (ptr.current = null)}
          onWheel={onWheel}
          className={`h-full w-full touch-none select-none bg-black ${clean ? "" : "rounded-xl shadow-[0_0_60px_rgba(60,240,255,0.08)] ring-1 ring-white/10"}`}
        />
        {recording && (
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 font-mono text-xs font-bold text-white ring-1 ring-red-500/60">
            <span className="rec-dot h-2.5 w-2.5 rounded-full bg-red-500" />
            REC {fmt(recTime)}
            {live.current.autoMode !== "off" && (
              <span className="text-white/50">/ {live.current.autoMode === "target" ? "🎯" : `${live.current.autoMode}s`}</span>
            )}
          </div>
        )}
        {paused && !recording && (
          <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white/80">❚❚</div>
        )}
      </div>
    </div>
  );

  return (
    <div className={clean ? "fixed inset-0 z-50 flex bg-black" : "flex h-full w-full"}>
      {/* left: machine list (desktop) */}
      {!clean && (
      <aside className={`hidden shrink-0 border-r border-white/10 bg-[#08080f] transition-all lg:block ${listOpen ? "w-72" : "w-0 overflow-hidden border-r-0"}`}>
        {listOpen && machineList}
      </aside>
      )}

      {/* stage */}
      <section className="relative min-w-0 flex-1">
        {!clean && (
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-2 lg:p-3">
          <button
            onClick={() => (window.innerWidth >= 1024 ? setListOpen((o) => !o) : setMobileSheet("list"))}
            className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70 ring-1 ring-white/10 hover:bg-white/10"
          >
            ☰ {t("machines")}
          </button>
          <div className="hidden text-center text-xs text-white/40 sm:block">
            <span className="font-bold" style={{ color: def.accent }}>
              #{String(def.num).padStart(2, "0")}
            </span>{" "}
            {def.name}
          </div>
          <button
            onClick={() => (window.innerWidth >= 1024 ? setPanelOpen((o) => !o) : setMobileSheet("panel"))}
            className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70 ring-1 ring-white/10 hover:bg-white/10"
          >
            ⚙ {t("controls")}
          </button>
        </div>
        )}
        <div className={clean ? "h-full" : "h-full px-2 pb-16 pt-12 lg:px-4 lg:pb-3 lg:pt-14"}>{stage}</div>
        {clean && (
          <button
            onClick={() => setClean(false)}
            className="absolute bottom-3 right-3 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/30 hover:bg-white/15 hover:text-white"
          >
            {t("showUi")} (H)
          </button>
        )}
        {/* mobile quick bar */}
        {!clean && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 p-2 lg:hidden">
          <Btn onClick={prev}>▲</Btn>
          <Btn onClick={() => setPaused((p) => !p)}>{paused ? "▶" : "❚❚"}</Btn>
          <Btn onClick={reset}>↺</Btn>
          {recording ? (
            <Btn onClick={() => void stopRec()} className="!bg-red-500 !text-white">
              ■ {fmt(recTime)}
            </Btn>
          ) : (
            <Btn onClick={() => startRec(autoMode)} accent disabled={!canRecord}>
              ⏺ {autoMode === "target" ? "🎯" : `${autoMode}s`}
            </Btn>
          )}
          <Btn onClick={() => setClean(true)}>⛶</Btn>
          <Btn onClick={next}>▼</Btn>
        </div>
        )}
      </section>

      {/* right: control panel (desktop) */}
      {!clean && (
      <aside className={`hidden shrink-0 border-l border-white/10 bg-[#08080f] transition-all lg:block ${panelOpen ? "w-80" : "w-0 overflow-hidden border-l-0"}`}>
        {panelOpen && panel}
      </aside>
      )}

      {/* mobile sheets */}
      {!clean && mobileSheet !== "none" && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/60 lg:hidden" onClick={() => setMobileSheet("none")}>
          <div className="h-[75dvh] rounded-t-2xl border-t border-white/10 bg-[#0b0b14]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
              <span className="text-sm font-bold">{mobileSheet === "list" ? t("machines") : t("controls")}</span>
              <button onClick={() => setMobileSheet("none")} className="px-2 text-lg text-white/60">
                ✕
              </button>
            </div>
            <div className="h-[calc(75dvh-45px)]">{mobileSheet === "list" ? machineList : panel}</div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black shadow-lg lg:bottom-6">{toast}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- small UI atoms
function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-white/40">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

function Btn({
  children,
  onClick,
  accent,
  className = "",
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  accent?: boolean;
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-bold transition disabled:opacity-40 ${accent ? "bg-cyan-400 text-black hover:bg-cyan-300" : "bg-white/5 text-white/80 ring-1 ring-white/10 hover:bg-white/10"} ${className}`}
    >
      {children}
    </button>
  );
}

function Chip({ children, active, onClick, color }: { children: React.ReactNode; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${active ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
    >
      {color && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: color }} />}
      {children}
    </button>
  );
}

function Slider({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="font-mono text-white/90">{fmt ? fmt(value) : Number.isInteger(step) ? value : value.toFixed(2)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="flex w-full items-center justify-between text-xs">
      <span className="text-white/60">{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition ${value ? "bg-cyan-400" : "bg-white/15"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${value ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}
