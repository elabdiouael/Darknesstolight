"use client";

// Loader khfif "Nour": najma 3D kat-dour + 3 nouqat f l-madar + text (optionnel)
// size: "sm" (f l-panels) / "md" / "page" (f west l-page)
import React from "react";
import styles from "./NourLoader.module.css";

export const NourLoader = ({ size = "md", label, className }: { size?: "sm" | "md" | "page"; label?: string; className?: string }) => (
  <span className={`${styles.wrap} ${styles[size]} ${className ?? ""}`} role="status" aria-live="polite">
    <span className={styles.scene} aria-hidden>
      <span className={styles.orbit}><i /><i /><i /></span>
      <svg viewBox="0 0 40 40" className={styles.star}>
        <defs>
          <linearGradient id="nl-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff4d6" /><stop offset="0.55" stopColor="#d4af37" /><stop offset="1" stopColor="#8a6a1c" />
          </linearGradient>
        </defs>
        <rect x="9" y="9" width="22" height="22" rx="1.5" fill="none" stroke="url(#nl-g)" strokeWidth="2" />
        <rect x="9" y="9" width="22" height="22" rx="1.5" fill="none" stroke="url(#nl-g)" strokeWidth="2" transform="rotate(45 20 20)" />
        <circle cx="20" cy="20" r="4" fill="url(#nl-g)" />
      </svg>
    </span>
    {label && <span className={styles.label}>{label}<b>.</b><b>.</b><b>.</b></span>}
  </span>
);

/** Loader dyal page kamla (f west) */
export const PageLoader = ({ label }: { label?: string }) => (
  <div className={styles.pageWrap}><NourLoader size="page" label={label} /></div>
);