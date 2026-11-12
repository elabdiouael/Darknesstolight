"use client";

// Petit store f localStorage, synchronisé bin les composants (useSyncExternalStore)
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();
const memory = new Map<string, string | null>();

const read = (key: string): string | null => {
  if (memory.has(key)) return memory.get(key)!;
  let v: string | null = null;
  try { v = localStorage.getItem(key); } catch { /* storage bloqué */ }
  memory.set(key, v);
  return v;
};

const write = (key: string, value: string) => {
  memory.set(key, value);
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
  listeners.get(key)?.forEach((l) => l());
};

/** Valeur JSON persistée + setter. Server snapshot = fallback */
export const useLocalState = <T,>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void] => {
  const subscribe = useCallback((l: Listener) => {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key)!.add(l);
    return () => { listeners.get(key)?.delete(l); };
  }, [key]);
  const raw = useSyncExternalStore(subscribe, () => read(key), () => null);
  // Valeur STABLE: nafs l-objet ma dam raw ma tbeddelch (sinon kol render kayreja3 array jdid
  // -> effects li kay3tamdo 3liha kay-t3awdo bla nihaya -> l-app kat-blogi)
  const [stableFallback] = useState(fallback);
  const value = useMemo(() => {
    if (raw == null) return stableFallback;
    try { return JSON.parse(raw) as T; } catch { return stableFallback; }
  }, [raw, stableFallback]);
  const set = useCallback((v: T | ((prev: T) => T)) => {
    const cur = read(key);
    let prev = fallback;
    if (cur != null) { try { prev = JSON.parse(cur) as T; } catch { /* ignore */ } }
    const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
    write(key, JSON.stringify(next));
  // fallback kayt3tabar stable (valeur par défaut)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return [value, set];
};