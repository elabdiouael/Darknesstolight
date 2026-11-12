"use client";

import { useEffect } from "react";
import { setNourMood } from "@/lib/three/nourMood";

/** Kol page kat-7ett had l-component bach t-goul l-background 3D chno bghat (bla ma t-3awd t-bnih) */
export const NourMood = ({ calm = false, star = true }: { calm?: boolean; star?: boolean }) => {
  useEffect(() => { setNourMood({ calm, star }); }, [calm, star]);
  return null;
};
