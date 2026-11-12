"use client";

// Niveau dyal l-performance: l-app kat-khfef bo7dha f l-jihaz d-d3if.
//   high   : kolchi (3D kaml, 60 fps, blur)
//   medium : 3D mkhfef (résolution 1x, 9ell mn particules, 30 fps) — téléphones w PC motawassit
//   low    : bla WebGL (background CSS), bla blur, bla animations dayma
// "auto" kay-khtar 7sab l-jihaz, w kay-hbet b daraja ila l-fps ta7 f l-wa9i3.
import { useSyncExternalStore } from "react";

export type PerfTier = "high" | "medium" | "low";
export type PerfMode = "auto" | PerfTier;
export const PERF_MODES: PerfMode[] = ["auto", "high", "medium", "low"];

const MODE_KEY = "ltd.perf";
const DROP_KEY = "ltd.perf.drop"; // sessionStorage: ch7al mn daraja hbetna f had s-session
const ORDER: PerfTier[] = ["high", "medium", "low"];
const listeners = new Set<() => void>();
let cache: { mode: PerfMode; tier: PerfTier } | null = null;

const detect = (): PerfTier => {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (cores <= 2 || mem <= 2 || nav.connection?.saveData) return "low";
  if (cores <= 4 || mem <= 4 || coarse) return "medium";
  return "high";
};

const read = (): { mode: PerfMode; tier: PerfTier } => {
  if (cache) return cache;
  let mode: PerfMode = "auto";
  let drop = 0;
  try {
    const m = localStorage.getItem(MODE_KEY) as PerfMode | null;
    if (m && PERF_MODES.includes(m)) mode = m;
    drop = Number(sessionStorage.getItem(DROP_KEY) ?? 0) || 0;
  } catch { /* storage bloqué */ }
  const tier = mode === "auto" ? ORDER[Math.min(ORDER.length - 1, ORDER.indexOf(detect()) + drop)] : mode;
  cache = { mode, tier };
  return cache;
};

const emit = () => { cache = null; listeners.forEach((l) => l()); };
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export const getPerfTier = (): PerfTier => read().tier;
export const setPerfMode = (mode: PerfMode) => {
  try { localStorage.setItem(MODE_KEY, mode); sessionStorage.removeItem(DROP_KEY); } catch { /* ignore */ }
  emit();
};

/** L-fps ta7 f l-wa9i3: f mode auto kan-hebtou b daraja. Kay-rejje3 true ila tbeddel chi 7aja. */
export const reportSlowFrames = (): boolean => {
  const { mode, tier } = read();
  if (mode !== "auto" || tier === "low") return false;
  try { sessionStorage.setItem(DROP_KEY, String((Number(sessionStorage.getItem(DROP_KEY) ?? 0) || 0) + 1)); } catch { /* ignore */ }
  emit();
  return true;
};

const SERVER = { mode: "auto" as PerfMode, tier: "high" as PerfTier };
/** { mode, tier } — f serveur / hydration: "high" (mn ba3d kay-tse77e7) */
export const usePerf = () => useSyncExternalStore(subscribe, read, () => SERVER);
