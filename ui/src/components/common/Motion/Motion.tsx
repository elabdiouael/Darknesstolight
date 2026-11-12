"use client";

// Micro-interactions sghar: CountUp (ar9am kaytl3ou), Magnetic (boutons kayjebdou l-souris), Tilt3D (cartes 3D)
import React, { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export const CountUp = ({ value, duration = 1.6, decimals = 0 }: { value: number; duration?: number; decimals?: number }) => {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => v.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));
  useEffect(() => {
    const c = animate(mv, value, { duration, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [value, duration, mv]);
  return <motion.span>{text}</motion.span>;
};

export const Magnetic = ({ children, strength = 0.35 }: { children: React.ReactNode; strength?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(0, { stiffness: 250, damping: 18 });
  const y = useSpring(0, { stiffness: 250, damping: 18 });

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.span ref={ref} style={{ x, y, display: "inline-flex" }} onPointerMove={onMove} onPointerLeave={reset}>
      {children}
    </motion.span>
  );
};

/**
 * Carte 3D: kat-mil m3a souris (rotateX/Y), lam3a (glare) kat-tbe3 souris, w l-contenu
 * kayban "tal3" (translateZ) — ghir f desktop (pointer: fine)
 */
export const Tilt3D = ({ children, className, style, max = 10, glare = true, depth = 30 }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; max?: number; glare?: boolean; depth?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5), my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [max, -max]), { stiffness: 220, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-max, max]), { stiffness: 220, damping: 20 });
  const gx = useTransform(mx, (v) => `${v * 100}%`);
  const gy = useTransform(my, (v) => `${v * 100}%`);
  const glareBg = useTransform([gx, gy] as never, ([x, y]: string[]) =>
    `radial-gradient(circle at ${x} ${y}, rgba(255, 244, 214, 0.22), transparent 55%)`);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const reset = () => { mx.set(0.5); my.set(0.5); };

  return (
    <div style={{ perspective: 1000, height: "100%" }}>
      <motion.div ref={ref} onPointerMove={onMove} onPointerLeave={reset} className={className}
        style={{ ...style, rotateX: rx, rotateY: ry, transformStyle: "preserve-3d", height: "100%", position: "relative" }}>
        <div style={{ transform: `translateZ(${depth}px)`, transformStyle: "preserve-3d", height: "100%" }}>{children}</div>
        {glare && (
          <motion.span aria-hidden style={{
            position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none", zIndex: 3,
            background: glareBg, mixBlendMode: "screen",
          }} />
        )}
      </motion.div>
    </div>
  );
};