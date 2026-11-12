"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { DICTIONARIES, DictKey, Lang } from "./dictionaries";
import { SurahMeta } from "@/lib/quran";

interface I18nCtx {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (l: Lang) => void;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  surahName: (s: SurahMeta) => string;
  surahMeaning: (s: SurahMeta) => string;
  formatDate: (iso?: string | null) => string;
}

const Ctx = createContext<I18nCtx | null>(null);
const STORAGE_KEY = "ltd.lang";

// Store sghir dyal l-lougha (localStorage + listeners) -> useSyncExternalStore
// Server w hydration = "fr" (français par défaut), mn ba3d kat-tbeddel l-lougha m7fouda
const listeners = new Set<() => void>();
let memoryLang: Lang | null = null; // ila localStorage m-bloqué
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const readLang = (): Lang => {
  if (memoryLang) return memoryLang;
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && saved in DICTIONARIES) return saved;
  } catch { /* storage bloqué -> fr */ }
  return "fr";
};

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const lang = useSyncExternalStore(subscribe, readLang, () => "fr" as Lang);

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((l: Lang) => {
    memoryLang = l;
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
    listeners.forEach((f) => f());
  }, []);

  const t = useCallback((key: DictKey, vars?: Record<string, string | number>) => {
    let s = DICTIONARIES[lang][key] ?? DICTIONARIES.fr[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  }, [lang]);

  const value = useMemo<I18nCtx>(() => ({
    lang, dir, setLang, t,
    surahName: (s) => (lang === "ar" ? s.ar : s.translit),
    surahMeaning: (s) => (lang === "ar" ? s.ar : lang === "en" ? s.en : s.fr),
    formatDate: (iso) => {
      if (!iso) return "—";
      const locale = lang === "ar" ? "ar-MA" : lang === "en" ? "en-GB" : "fr-FR";
      return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
    },
  }), [lang, dir, setLang, t]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useI18n = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used inside I18nProvider");
  return c;
};