"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "./I18nProvider";

export function Nav() {
  const path = usePathname();
  const { t, lang, setLang } = useI18n();
  const links = [
    { href: "/", label: t("studio") },
    { href: "/gallery", label: t("gallery") },
    { href: "/guides", label: t("guides") },
  ];
  return (
    <header className="h-14 shrink-0 border-b border-white/10 bg-[#07070f]/90 backdrop-blur flex items-center px-3 sm:px-5 gap-3 sm:gap-6 z-30">
      <Link href="/" className="flex items-center gap-2 font-black tracking-tight text-white">
        <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 via-amber-400 to-cyan-400">
          <span className="h-2.5 w-2.5 rounded-full bg-[#07070f]" />
        </span>
        <span className="hidden sm:inline">
          SimShorts<span className="text-cyan-300">Lab</span>
        </span>
      </Link>
      <nav className="flex items-center gap-1">
        {links.map((l) => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${active ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center rounded-lg border border-white/10 p-0.5 text-xs font-bold">
        {(["tr", "en"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`rounded-md px-2.5 py-1 uppercase transition ${lang === l ? "bg-cyan-400 text-black" : "text-white/60 hover:text-white"}`}
          >
            {l}
          </button>
        ))}
      </div>
    </header>
  );
}
