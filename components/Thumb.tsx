"use client";

import { useEffect, useRef } from "react";
import { World, W } from "@/lib/engine/world";
import { render } from "@/lib/engine/render";
import { defaultParams, getMachine } from "@/lib/machines";
import type { Lang, Params } from "@/lib/engine/types";

/** Runs a machine headless for a moment and paints a still frame — real previews, no images. */
export function Thumb({ machine, params, lang, delay = 0, seconds = 2.5 }: { machine: string; params?: Params; lang: Lang; delay?: number; seconds?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const def = getMachine(machine);
    const c = ref.current;
    if (!def || !c) return;
    let cancelled = false;
    const id = window.setTimeout(() => {
      if (cancelled) return;
      const w = new World(1234 + def.num);
      w.lang = lang;
      w.m = def.create(w, { ...defaultParams(def), ...(params ?? {}) });
      const step = 1 / 120;
      for (let i = 0; i < seconds / step; i++) {
        w.step(step);
        if (i % 2 === 0) w.frame(step * 2);
      }
      w.sounds.length = 0;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      w.trail = 0;
      render(ctx, w, c.width / W, { name: def.name, num: def.num, accent: def.accent, hook: "", showHud: true, showHook: false });
    }, delay);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [machine, params, lang, delay, seconds]);
  return <canvas ref={ref} width={270} height={480} className="h-full w-full" />;
}
