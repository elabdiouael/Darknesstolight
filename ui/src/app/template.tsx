"use client";

// Template kay-remonter m3a kol navigation -> transition "warp": l-background 3D kay-dfe3 (njoum, zoom)
// w khett dyal dow kay-douz. Bla voile k7el: l-background kay-b9a bayn (ma kayn 7ta "coupure").
// (l-éléments homa siblings machi wrapper, bach ma n-khesrouch position: fixed dyal l-header / sheets)
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { triggerWarp } from "@/lib/three/nourMood";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Template({ children }: { children: React.ReactNode }) {
  useEffect(() => { triggerWarp(1); }, []);
  return (
    <>
      <motion.div
        aria-hidden
        initial={{ opacity: 0.55 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5, ease }}
        style={{ position: "fixed", inset: 0, zIndex: 900, pointerEvents: "none", willChange: "opacity", background: "rgba(2,8,7,0.9)" }}
      />
      {/* Scan: khett dyal dow kay-hbet mn l-fo9 l l-ta7t */}
      <motion.span
        aria-hidden
        initial={{ y: "-10vh", opacity: 1 }}
        animate={{ y: "110vh", opacity: 0 }}
        transition={{ duration: 0.75, ease }}
        style={{
          position: "fixed", left: 0, right: 0, top: 0, height: 2, zIndex: 901, pointerEvents: "none", willChange: "transform, opacity",
          background: "linear-gradient(90deg, transparent, #6fe8ff 20%, #fff4d6 50%, #6fe8ff 80%, transparent)",
          boxShadow: "0 0 26px 5px rgba(111,232,255,0.5)",
        }}
      />
      {children}
    </>
  );
}
