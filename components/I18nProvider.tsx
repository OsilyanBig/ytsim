"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Lang } from "@/lib/engine/types";
import { DICT, type DictKey } from "@/lib/i18n";

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: DictKey) => string;
  pick: <T>(o: { en: T; tr: T }) => T;
}

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("tr");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "en" || saved === "tr") setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {}
  }, []);

  const t = useCallback((k: DictKey) => DICT[k][lang], [lang]);
  const pick = useCallback(<T,>(o: { en: T; tr: T }) => o[lang], [lang]);

  return <I18nCtx.Provider value={{ lang, setLang, t, pick }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}
