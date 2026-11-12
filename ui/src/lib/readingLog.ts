"use client";

// Journal dyal l-9raya (localStorage): f kol nhar ch7al mn aya t-sejlat, ch7al mn t-tanya w ch7al mn page.
// Kay-t3mmer mn l-mushaf (MushafReader) w kayt9ra f dashboard dyal l-profil.
import { useCallback } from "react";
import { useLocalState } from "./localStore";
import { dayKey } from "./adhkarStore";

export interface ReadDay { ayahs: number; seconds: number; pages: number }
export type ReadingLog = Record<string, ReadDay>;

const EMPTY: ReadingLog = {};

export const useReadingLog = () => {
  const [log, setLog] = useLocalState<ReadingLog>("ltd.reading.log", EMPTY);
  const add = useCallback((patch: Partial<ReadDay>) => {
    const k = dayKey();
    setLog((l) => {
      const cur = l[k] ?? { ayahs: 0, seconds: 0, pages: 0 };
      return {
        ...l,
        [k]: {
          ayahs: cur.ayahs + (patch.ayahs ?? 0),
          seconds: cur.seconds + (patch.seconds ?? 0),
          pages: cur.pages + (patch.pages ?? 0),
        },
      };
    });
  }, [setLog]);
  return { log, add };
};
