"use client";

// Listener wa7ed l-app kamla — "moteur" dyal les cartes (.fx-card), bla state w bla re-render:
//   --px / --py   : blasst l-curseur (px) -> spotlight (souris) w dow dyal l-lamsa (téléphone)
//   --fx-x / --fx-y : mn -1 l 1 -> l-carte kat-mil f 3D m3a l-curseur, d-dell kay-t7errek, l-icônes kay-tel3ou (parallax)
//   --fx-amp      : ch7al kat-mil (degré) — les cartes sghar kay-milou bezzaf, les panels kbar ma kay-milouch
// L-mil kay-khdem ghir b souris (pointer: fine); f téléphone kayn l-effet dyal scroll (globals.css).
import { useEffect } from "react";

const TILT_MAX_SIZE = 760; // fo9 had l-3ard l-carte ma kat-milch (n-nass kay-b9a wade7)

export const FxPointer = () => {
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    let raf = 0;
    let ev: PointerEvent | null = null;
    let cur: HTMLElement | null = null;
    const cooling = new Map<HTMLElement, number>();

    const cardOf = (e: PointerEvent | null) => (e?.target as Element | null)?.closest?.<HTMLElement>(".fx-card") ?? null;
    const place = (el: HTMLElement, e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      el.style.setProperty("--px", `${x}px`);
      el.style.setProperty("--py", `${y}px`);
      return { r, x, y };
    };
    // Mli l-curseur kay-khrej: l-carte kat-rje3 l blasstha b chwiya, 3ad kan-7iydou l-7ala "hot"
    const release = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.setProperty("--fx-x", "0");
      el.style.setProperty("--fx-y", "0");
      cooling.set(el, window.setTimeout(() => { cooling.delete(el); el.removeAttribute("data-fx-hot"); }, 320));
    };
    const apply = () => {
      raf = 0;
      if (!ev) return;
      const el = cardOf(ev);
      if (el !== cur) {
        release(cur);
        cur = el;
        if (el) {
          const pending = cooling.get(el);
          if (pending) { clearTimeout(pending); cooling.delete(el); }
          const r0 = el.getBoundingClientRect();
          const size = Math.max(r0.width, r0.height, 1);
          const amp = r0.width > TILT_MAX_SIZE || el.hasAttribute("data-fx-flat") ? 0 : Math.min(9, 2400 / size);
          el.style.setProperty("--fx-amp", amp.toFixed(2));
          el.setAttribute("data-fx-hot", "");
        }
      }
      if (!el) return;
      const { r, x, y } = place(el, ev);
      el.style.setProperty("--fx-x", ((x / r.width) * 2 - 1).toFixed(3));
      el.style.setProperty("--fx-y", ((y / r.height) * 2 - 1).toFixed(3));
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      ev = e;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    // Lamsa (wla click): d-dow kay-ban nichan t7t s-sba3 — bla ma ntsennaw l-frame jaya
    const onDown = (e: PointerEvent) => { const el = cardOf(e); if (el) place(el, e); };
    const onLeave = () => { release(cur); cur = null; ev = null; };

    if (fine) document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
      cooling.forEach((id) => clearTimeout(id));
    };
  }, []);
  return null;
};
