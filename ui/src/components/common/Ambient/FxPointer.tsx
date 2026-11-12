"use client";

// Listener wa7ed l-app kamla: kay-7ett --px / --py 3la l-carte (.fx-card) li t7t souris,
// bach l-spotlight (globals.css) ytbe3 l-curseur — bla state, bla re-render.
import { useEffect } from "react";

export const FxPointer = () => {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    let ev: PointerEvent | null = null;
    const apply = () => {
      raf = 0;
      const el = (ev?.target as Element | null)?.closest?.<HTMLElement>(".fx-card");
      if (!el || !ev) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--px", `${ev.clientX - r.left}px`);
      el.style.setProperty("--py", `${ev.clientY - r.top}px`);
    };
    const onMove = (e: PointerEvent) => {
      ev = e;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => { document.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);
  return null;
};
