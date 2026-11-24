"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useI18n } from "./I18nProvider";
import { PRESETS } from "@/lib/presets";
import { MACHINES, getMachine } from "@/lib/machines";
import { Thumb } from "./Thumb";

const TAGS = ["ALL", "VIRAL", "ASMR", "SATISFYING", "FAST", "CHAOS"];

export function GalleryGrid() {
  const { t, pick, lang } = useI18n();
  const [tag, setTag] = useState("ALL");
  const list = useMemo(() => PRESETS.filter((p) => tag === "ALL" || p.tag === tag), [tag]);
  return (
    <div className="scroll-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t("galleryTitle")}</h1>
        <p className="mt-2 text-white/55">{t("gallerySub")}</p>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {TAGS.map((g) => (
            <button
              key={g}
              onClick={() => setTag(g)}
              className={`rounded-full px-3 py-1 text-xs font-bold ${tag === g ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
            >
              {g === "ALL" ? t("all") : g}
            </button>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {list.map((p, i) => {
            const m = getMachine(p.machine)!;
            return (
              <Link
                key={p.id}
                href={`/?m=${p.machine}&p=${p.id}`}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-0.5 hover:border-white/25"
              >
                <div className="relative aspect-[9/16] bg-black">
                  <Thumb machine={p.machine} params={p.params} lang={lang} delay={i * 40} />
                  <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-black" style={{ color: m.accent }}>
                    {p.tag}
                  </span>
                  <span className="absolute inset-x-2 bottom-2 rounded-lg bg-cyan-400 py-1.5 text-center text-xs font-black text-black opacity-0 transition group-hover:opacity-100">
                    ▶ {t("loadPreset")}
                  </span>
                </div>
                <div className="p-3">
                  <div className="text-[11px] font-bold text-white/40">
                    #{String(m.num).padStart(2, "0")} · {m.name}
                  </div>
                  <div className="mt-0.5 font-bold leading-tight">{pick(p.title)}</div>
                  <div className="mt-1 text-xs text-white/50">{pick(p.desc)}</div>
                </div>
              </Link>
            );
          })}
        </div>

        <h2 className="mt-12 text-xl font-black">
          {t("machines")} · {MACHINES.length}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MACHINES.map((m) => (
            <Link key={m.id} href={`/?m=${m.id}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:border-white/25">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-black text-black" style={{ background: m.accent }}>
                {String(m.num).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{m.name}</span>
                <span className="block truncate text-xs text-white/45">{pick(m.desc)}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
