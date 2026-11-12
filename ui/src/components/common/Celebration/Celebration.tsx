"use client";

// Ihtifal dyal nour: confettis dhahabiyin (canvas) mli kaytsjel checkpoint, w overlay kbir mli tkemmel l-khatma
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./Celebration.module.css";

interface Opts { x?: number; y?: number; big?: boolean; title?: string; subtitle?: string }
type Shape = 0 | 1 | 2; // cercle, losange, najma
interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; rot: number; vr: number; shape: Shape; color: string }

const COLORS = ["#fff4d6", "#ecd08a", "#d4af37", "#b8922f", "#5fd3a0"];
const Ctx = createContext<(o?: Opts) => void>(() => {});
export const useCelebrate = () => useContext(Ctx);

const randomShape = () => Math.floor(Math.random() * 3) as Shape;
const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export const CelebrationProvider = ({ children }: { children: React.ReactNode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parts = useRef<P[]>([]);
  const raf = useRef(0);
  const loop = useRef<() => void>(() => {});
  const [overlay, setOverlay] = useState<{ title: string; subtitle?: string } | null>(null);

  // Loop dyal l-animation f ref (kay3iyet 3la rasso b requestAnimationFrame)
  useEffect(() => {
    loop.current = () => {
      const c = canvasRef.current;
      if (!c) return;
      const g = c.getContext("2d")!;
      g.clearRect(0, 0, c.width, c.height);
      const dpr = c.width / window.innerWidth;
      parts.current = parts.current.filter((p) => p.life < p.max);
      for (const p of parts.current) {
        p.life++;
        p.vy += 0.12;
        p.vx *= 0.985; p.vy *= 0.985;
        p.x += p.vx; p.y += p.vy;
        p.rot += p.vr;
        g.save();
        g.translate(p.x * dpr, p.y * dpr);
        g.rotate(p.rot);
        g.globalAlpha = 1 - p.life / p.max;
        g.fillStyle = p.color;
        g.shadowColor = p.color;
        g.shadowBlur = 12 * dpr;
        const s = p.size * dpr;
        g.beginPath();
        if (p.shape === 0) g.arc(0, 0, s * 0.5, 0, Math.PI * 2);
        else if (p.shape === 1) { g.moveTo(0, -s); g.lineTo(s * 0.55, 0); g.lineTo(0, s); g.lineTo(-s * 0.55, 0); }
        else {
          for (let i = 0; i < 16; i++) {
            const r = i % 2 === 0 ? s : s * 0.55;
            const an = (i / 16) * Math.PI * 2;
            if (i === 0) g.moveTo(Math.cos(an) * r, Math.sin(an) * r); else g.lineTo(Math.cos(an) * r, Math.sin(an) * r);
          }
        }
        g.closePath();
        g.fill();
        g.restore();
      }
      if (parts.current.length) raf.current = requestAnimationFrame(loop.current);
    };
  }, []);

  const resize = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    c.width = window.innerWidth * dpr;
    c.height = window.innerHeight * dpr;
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf.current); };
  }, [resize]);

  const burst = (x: number, y: number, n: number, power: number) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = (0.4 + Math.random()) * power;
      parts.current.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - power * 0.35,
        life: 0, max: 60 + Math.random() * 50, size: 3 + Math.random() * 6,
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
        shape: randomShape(), color: randomColor(),
      });
    }
  };

  const celebrate = useCallback((o: Opts = {}) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (o.big && o.title) { setOverlay({ title: o.title, subtitle: o.subtitle }); setTimeout(() => setOverlay(null), 2600); }
      return;
    }
    const x = o.x ?? window.innerWidth / 2;
    const y = o.y ?? window.innerHeight / 2;
    const wasIdle = parts.current.length === 0;
    if (o.big) {
      burst(window.innerWidth / 2, window.innerHeight * 0.45, 160, 12);
      // Chta dyal nour mn l-fo9
      for (let i = 0; i < 140; i++) {
        parts.current.push({
          x: Math.random() * window.innerWidth, y: -20 - Math.random() * 300, vx: (Math.random() - 0.5) * 1.5, vy: 1 + Math.random() * 3,
          life: 0, max: 160 + Math.random() * 80, size: 3 + Math.random() * 6, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.2,
          shape: randomShape(), color: randomColor(),
        });
      }
      if (o.title) { setOverlay({ title: o.title, subtitle: o.subtitle }); setTimeout(() => setOverlay(null), 3200); }
    } else {
      burst(x, y, 46, 7);
    }
    if (wasIdle) raf.current = requestAnimationFrame(loop.current);
  }, []);

  return (
    <Ctx.Provider value={celebrate}>
      {children}
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden />
      <AnimatePresence>
        {overlay && (
          <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOverlay(null)}>
            <motion.div className={styles.medal}
              initial={{ scale: 0.4, rotate: -30, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 160, damping: 14 }}>
              <span className="quran-text">ٱلْحَمْدُ لِلَّهِ</span>
            </motion.div>
            <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="gold-text">
              {overlay.title}
            </motion.h2>
            {overlay.subtitle && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>{overlay.subtitle}</motion.p>}
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
};