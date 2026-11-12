"use client";

// Template kay-remonter m3a kol navigation -> transition dyal nour bin les pages
// (l-veil howa sibling machi wrapper, bach ma n-khesrouch position: fixed dyal l-header/sheet)
import React from "react";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <motion.div
        aria-hidden
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.6, ease }}
        style={{
          // Chfaf chwiya: l-background 3D kay-b9a 7ay mn t7t (ma b9atch "coupure" k7la bin les pages)
          position: "fixed", inset: 0, zIndex: 900, pointerEvents: "none", willChange: "opacity",
          background: "radial-gradient(70% 60% at 50% 40%, rgba(23,137,90,0.22), rgba(3,10,7,0.86) 70%)",
        }}
      >
        {/* Dow kay-tfte7 mn l-west */}
        <motion.span
          initial={{ scale: 0.2, opacity: 0.9 }}
          animate={{ scale: 2.4, opacity: 0 }}
          transition={{ duration: 0.75, ease }}
          style={{
            position: "absolute", left: "50%", top: "50%", width: "60vmin", height: "60vmin", margin: "-30vmin 0 0 -30vmin",
            borderRadius: "50%", willChange: "transform, opacity",
            background: "radial-gradient(circle, rgba(255,236,180,0.28), rgba(212,175,55,0.1) 40%, transparent 70%)",
          }}
        />
        <motion.span
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: 0 }}
          transition={{ duration: 0.7, ease }}
          style={{
            position: "absolute", left: 0, right: 0, top: "50%", height: 2, transformOrigin: "center",
            background: "linear-gradient(90deg, transparent, #fff4d6, #d4af37, transparent)",
            boxShadow: "0 0 30px 6px rgba(212,175,55,0.6)",
          }}
        />
      </motion.div>
      {children}
    </>
  );
}