"use client";

import Link from "next/link";
import { useI18n } from "./I18nProvider";
import { GUIDES } from "@/lib/guides";

export function GuidesView() {
  const { t, pick } = useI18n();
  return (
    <div className="scroll-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t("guidesTitle")}</h1>
        <p className="mt-2 text-white/55">{t("guidesSub")}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {GUIDES.map((g, i) => (
            <article id={g.id} key={g.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-xl">{g.icon}</span>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-cyan-300/70">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h2 className="text-lg font-black leading-tight">{pick(g.title)}</h2>
                </div>
              </div>
              <p className="mt-3 text-sm text-white/65">{pick(g.summary)}</p>
              <ul className="mt-3 space-y-2">
                {pick(g.points).map((pt, k) => (
                  <li key={k} className="flex gap-2 text-sm text-white/80">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Link href="/" className="rounded-xl bg-cyan-400 px-5 py-3 font-black text-black hover:bg-cyan-300">
            ▶ {t("studio")}
          </Link>
        </div>
      </div>
    </div>
  );
}
