"use client";

// Progress dyal l-adhkar (localStorage): 3add kol dhikr l-yawm, historique, série, favoris, réglages, misbaha
import { useState } from "react";
import { useLocalState } from "./localStore";
import { ADHKAR, AdhkarCategory } from "./adhkar";

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Nhar l-yawm (kayt7seb merra wa7da f mount — machi f kol render) */
export const useToday = () => useState(() => dayKey())[0];

interface DayProgress { date: string; counts: Record<string, number> }

const key = (cat: string, item: string) => `${cat}:${item}`;

export const useAdhkarProgress = () => {
  const today = useToday();
  const [day, setDay] = useLocalState<DayProgress>("ltd.adhkar.day", { date: today, counts: {} });
  const [history, setHistory] = useLocalState<Record<string, number>>("ltd.adhkar.history", {});
  const counts = day.date === today ? day.counts : {};

  const get = (cat: string, item: string) => counts[key(cat, item)] ?? 0;

  /** +1 (ma kaydouzch l-max). Kayrje3 l-3add jdid */
  const inc = (cat: string, item: string, max: number) => {
    const cur = get(cat, item);
    if (cur >= max) return cur;
    const next = cur + 1;
    // Updater kay9ra l-valeur l-7aliya (taps sri3in ma kaydi3ouch)
    setDay((d) => {
      const base = d.date === today ? d.counts : {};
      const k = key(cat, item);
      return { date: today, counts: { ...base, [k]: Math.min(max, (base[k] ?? 0) + 1) } };
    });
    setHistory((h) => ({ ...h, [today]: (h[today] ?? 0) + 1 }));
    return next;
  };

  /** Dhikr 7orr (misbaha): kayzid ghir f l-historique */
  const addFree = (n = 1) => setHistory((h) => ({ ...h, [today]: (h[today] ?? 0) + n }));

  const setCount = (cat: string, item: string, n: number) =>
    setDay((d) => ({ date: today, counts: { ...(d.date === today ? d.counts : {}), [key(cat, item)]: n } }));

  const resetCategory = (cat: string) =>
    setDay((d) => {
      const base = d.date === today ? { ...d.counts } : {};
      Object.keys(base).forEach((k) => { if (k.startsWith(`${cat}:`)) delete base[k]; });
      return { date: today, counts: base };
    });

  /** Pourcentage dyal categorie (b 3add, machi b items) */
  const catProgress = (c: AdhkarCategory) => {
    const total = c.items.reduce((s, d) => s + d.count, 0);
    const done = c.items.reduce((s, d) => s + Math.min(get(c.id, d.id), d.count), 0);
    return { done, total, pct: total ? (done / total) * 100 : 0, items: c.items.filter((d) => get(c.id, d.id) >= d.count).length };
  };

  const completedToday = ADHKAR.filter((c) => catProgress(c).pct >= 100).length;
  const todayTotal = history[today] ?? 0;

  /** Série: ayam mtab3in fihom dhikr (l-yawm wla l-bare7 kaykemlo s-série) */
  const streak = (() => {
    let n = 0;
    const d = new Date(`${today}T12:00:00`);
    if (!history[today]) d.setDate(d.getDate() - 1);
    while (history[dayKey(d)]) { n += 1; d.setDate(d.getDate() - 1); }
    return n;
  })();

  /** 7 ayam l-akhra (l-graph) */
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() - (6 - i));
    const k = dayKey(d);
    return { date: k, day: d.getDay(), value: history[k] ?? 0 };
  });

  const lifetime = Object.values(history).reduce((s, v) => s + v, 0);

  return { today, get, inc, addFree, setCount, resetCategory, catProgress, completedToday, todayTotal, streak, week, lifetime };
};

export const useAdhkarFavorites = () => {
  const [list, setList] = useLocalState<string[]>("ltd.adhkar.fav", []);
  const has = (cat: string, item: string) => list.includes(key(cat, item));
  const toggle = (cat: string, item: string) =>
    setList((l) => (l.includes(key(cat, item)) ? l.filter((x) => x !== key(cat, item)) : [key(cat, item), ...l]));
  return { list, has, toggle };
};

export interface AdhkarPrefs { fontSize: number; showTr: boolean; autoNext: boolean; haptics: boolean; view: "focus" | "list" }
export const DEFAULT_ADHKAR_PREFS: AdhkarPrefs = { fontSize: 1.7, showTr: true, autoNext: true, haptics: true, view: "focus" };

export const useAdhkarPrefs = () => {
  const [stored, setStored] = useLocalState<Partial<AdhkarPrefs>>("ltd.adhkar.prefs", DEFAULT_ADHKAR_PREFS);
  const prefs: AdhkarPrefs = { ...DEFAULT_ADHKAR_PREFS, ...stored };
  const update = (p: Partial<AdhkarPrefs>) => setStored((s) => ({ ...DEFAULT_ADHKAR_PREFS, ...s, ...p }));
  return [prefs, update] as const;
};

export interface MisbahaState { phrase: string; target: number; count: number; rounds: number; total: number }
export const useMisbaha = () =>
  useLocalState<MisbahaState>("ltd.misbaha", { phrase: "subhan", target: 33, count: 0, rounds: 0, total: 0 });

/** Vibration sghira (mobile) */
export const buzz = (ms: number | number[] = 12) => {
  try { navigator.vibrate?.(ms); } catch { /* ma-kaynch */ }
};