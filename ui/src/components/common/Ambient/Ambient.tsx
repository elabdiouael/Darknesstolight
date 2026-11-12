"use client";

// Effets globaux: halo dyal nour kaytbe3 souris + splash "Bismillah" f kol bdya dyal l-app
import React, { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { useI18n } from "@/i18n/I18nProvider";
import { usePerf } from "@/lib/perf";
import styles from "./Ambient.module.css";

const noop = () => () => {};

export const CursorGlow = () => {
  const x = useMotionValue(-500), y = useMotionValue(-500);
  const sx = useSpring(x, { stiffness: 120, damping: 20, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 120, damping: 20, mass: 0.6 });
  // Ghir f desktop (souris), machi f telephone
  const enabled = useSyncExternalStore(noop, () => window.matchMedia("(pointer: fine)").matches, () => false);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y, enabled]);

  const { tier } = usePerf();
  if (!enabled || tier !== "high") return null;
  return <motion.div className={styles.cursor} style={{ x: sx, y: sy }} aria-hidden />;
};

// Splash: kayban f KOL bdya dyal l-app (reload / ouverture), machi f navigation dakhel l-app.
// Variable f module: navigation client-side ma kat3awdch t-charger l-module -> ma kaybanch merra khra.
let splashShown = false;
const claimSplash = () => {
  if (!splashShown) { splashShown = true; return true; }
  return false;
};
let splashDecision: boolean | null = null;
const shouldShowSplash = () => {
  if (splashDecision === null) splashDecision = claimSplash();
  return splashDecision;
};

const SPLASH_MS = 3300; // ms mn bdya dyal r-rasm 7ta l-khrouj
const BASMALA = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

// Nou9at d-dhab (positions stables: pseudo-random b l-index)
const SPARKS = Array.from({ length: 26 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  return { left: r(1) * 100, top: 20 + r(2) * 70, size: 2 + r(3) * 4, delay: r(4) * 2.4, dur: 3 + r(5) * 3 };
});

export const Splash = () => {
  const { t } = useI18n();
  const wanted = useSyncExternalStore(noop, shouldShowSplash, () => false);
  const [phase, setPhase] = useState<"wait" | "draw" | "done">("wait");
  const show = wanted && phase !== "done";

  useEffect(() => {
    if (!wanted) return;
    let alive = true;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // N-tsennaw l-khatt (Amiri Quran) bach r-rasm dyal l-basmala ykoun b l-khatt s7i7 (max 1.2s)
    const fonts = document.fonts?.load('64px "Amiri Quran"').catch(() => undefined) ?? Promise.resolve();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let done: ReturnType<typeof setTimeout> | undefined;
    // L-basmala kat-tersem kamla (rasm + dhab) 9bel ma t-tfte7 l-app
    Promise.race([fonts, new Promise((r) => setTimeout(r, 1200))]).then(() => {
      if (!alive) return;
      setPhase("draw");
      done = setTimeout(() => alive && setPhase("done"), reduced ? 900 : SPLASH_MS);
    });
    return () => { alive = false; clearTimeout(done); document.body.style.overflow = prev; };
  }, [wanted]);

  useEffect(() => {
    if (phase === "done") document.body.style.overflow = "";
  }, [phase]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={styles.splash}
          initial={{ clipPath: "circle(150% at 50% 50%)" }}
          exit={{ clipPath: "circle(0% at 50% 50%)", transition: { duration: 1.1, ease: [0.76, 0, 0.24, 1] } }}
          aria-label={BASMALA}
          role="img"
        >
          <div className={styles.glow} aria-hidden />
          {SPARKS.map((p, i) => (
            <span key={i} className={styles.spark} aria-hidden
              style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }} />
          ))}

          {/* Najma + 7l9at f 3D */}
          <div className={styles.scene} aria-hidden>
            <div className={`${styles.ring} ${styles.r1}`} />
            <div className={`${styles.ring} ${styles.r2}`} />
            <div className={`${styles.ring} ${styles.r3}`} />
            <motion.svg viewBox="0 0 100 100" className={styles.star} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}>
              <defs>
                <linearGradient id="spg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#fff4d6" /><stop offset="0.5" stopColor="#d4af37" /><stop offset="1" stopColor="#8a6a1c" />
                </linearGradient>
              </defs>
              <motion.rect x="22" y="22" width="56" height="56" fill="none" stroke="url(#spg)" strokeWidth="1.6"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: "easeInOut" }} />
              <motion.rect x="22" y="22" width="56" height="56" fill="none" stroke="url(#spg)" strokeWidth="1.6" transform="rotate(45 50 50)"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, delay: 0.2, ease: "easeInOut" }} />
              <motion.circle cx="50" cy="50" r="8" fill="url(#spg)" initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 12 }} style={{ transformOrigin: "50px 50px" }} />
            </motion.svg>
          </div>

          {/* L-basmala: kat-tersem b d-dhab (stroke) w mn ba3d kat-3mer */}
          <svg viewBox="0 0 1000 220" className={`${styles.basmala} ${phase === "draw" ? styles.drawing : ""}`} aria-hidden>
            <defs>
              <linearGradient id="bsg" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#b8922f" /><stop offset="0.35" stopColor="#fff4d6" /><stop offset="0.6" stopColor="#ecd08a" /><stop offset="1" stopColor="#b8922f" />
              </linearGradient>
            </defs>
            <text x="500" y="150" textAnchor="middle" direction="rtl" className={styles.bText}>{BASMALA}</text>
          </svg>

          <motion.p className={styles.meaning} initial={{ opacity: 0, y: 8 }} animate={{ opacity: phase === "draw" ? 1 : 0, y: 0 }}
            transition={{ delay: 1.6, duration: 0.9 }}>
            {t("splash.meaning")}
          </motion.p>

          <div className={styles.progress} aria-hidden><i className={phase === "draw" ? styles.progressOn : ""} /></div>
          <motion.span className={styles.brand} initial={{ opacity: 0, letterSpacing: "0.7em" }} animate={{ opacity: 1, letterSpacing: "0.34em" }}
            transition={{ delay: 0.6, duration: 1.4 }}>
            FROM DARKNESSES TO LIGHT
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};