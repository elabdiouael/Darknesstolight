"use client";

import { useCallback, useSyncExternalStore } from "react";

/** true ila l-media query kat-matchi (false f server) */
export const useMediaQuery = (query: string) => {
  const subscribe = useCallback((cb: () => void) => {
    const m = window.matchMedia(query);
    m.addEventListener("change", cb);
    return () => m.removeEventListener("change", cb);
  }, [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
};