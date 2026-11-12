"use client";

import { useEffect, useState } from "react";
import { FALLBACK_RECITERS, loadReciters, Reciter } from "@/services/quran/quranText";

/** Liste dyal ga3 l-9orra2 disponibles (kat-charja merra wa7da) */
export const useReciters = (): Reciter[] => {
  const [list, setList] = useState<Reciter[]>(FALLBACK_RECITERS);
  useEffect(() => {
    let alive = true;
    loadReciters().then((l) => { if (alive) setList(l); });
    return () => { alive = false; };
  }, []);
  return list;
};