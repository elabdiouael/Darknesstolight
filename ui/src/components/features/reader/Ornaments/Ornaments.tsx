// Zakharif dyal l-mushaf (SVG): zwaya dyal l-cadre, cartouche dyal s-sourate, 3alamat l-aya
import React, { useId } from "react";
import { toArabicDigits } from "@/lib/quran";

/** Zawiya mzakhrafa (kat-dar f 4 zwaya b rotation) */
export const CornerOrnament = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 120" aria-hidden>
    <g fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M6 114V30Q6 6 30 6h84" strokeWidth="2.2" />
      <path d="M16 114V40Q16 16 40 16h74" strokeWidth="1" opacity=".55" />
      <path d="M30 30c18 0 28 10 28 28M30 30c0 18 10 28 28 28" strokeWidth="1.3" opacity=".8" />
      <circle cx="30" cy="30" r="7" strokeWidth="1.4" />
      <path d="M30 18l3.2 8.8L42 30l-8.8 3.2L30 42l-3.2-8.8L18 30l8.8-3.2z" fill="currentColor" stroke="none" opacity=".9" />
      <path d="M60 6c0 10 8 16 16 16M6 60c10 0 16 8 16 16" strokeWidth="1" opacity=".6" />
      <circle cx="76" cy="22" r="2" fill="currentColor" stroke="none" />
      <circle cx="22" cy="76" r="2" fill="currentColor" stroke="none" />
    </g>
  </svg>
);

/** Cartouche dyal smiyt s-sourate (b7al l-mushaf l-madani) */
export const SurahBanner = ({ name, left, right }: { name: string; left: string; right: string }) => {
  const id = useId().replace(/:/g, "");
  return (
    <div className="surah-banner" style={{ position: "relative" }}>
      <svg viewBox="0 0 640 110" preserveAspectRatio="none" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id={`g${id}`} x1="0" x2="1">
            <stop offset="0" stopColor="var(--frame)" stopOpacity=".15" />
            <stop offset=".5" stopColor="var(--frame)" stopOpacity=".32" />
            <stop offset="1" stopColor="var(--frame)" stopOpacity=".15" />
          </linearGradient>
          <pattern id={`p${id}`} width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M11 1l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="var(--frame)" opacity=".18" />
          </pattern>
        </defs>
        <path d="M60 8h520q22 0 34 22l18 25-18 25q-12 22-34 22H60q-22 0-34-22L8 55l18-25Q38 8 60 8z" fill={`url(#g${id})`} stroke="var(--frame)" strokeWidth="2" />
        <path d="M70 18h500q16 0 25 16l12 21-12 21q-9 16-25 16H70q-16 0-25-16L33 55l12-21q9-16 25-16z" fill={`url(#p${id})`} stroke="var(--frame)" strokeOpacity=".55" strokeWidth="1" />
        <circle cx="8" cy="55" r="5" fill="var(--frame)" />
        <circle cx="632" cy="55" r="5" fill="var(--frame)" />
      </svg>
      <span className="surah-banner-side" style={{ insetInlineStart: "9%" }}>{left}</span>
      <span className="quran-text surah-banner-name">{name}</span>
      <span className="surah-banner-side" style={{ insetInlineEnd: "9%" }}>{right}</span>
    </div>
  );
};

/** 3alamat nihayat l-aya: najma mtamna + ra9m b l-3arbiya */
export const AyahMarker = ({ n, className, children }: { n: number; className?: string; children?: React.ReactNode }) => (
  <span className={className}>
    <svg viewBox="0 0 40 40" aria-hidden>
      <path d="M20 1.5l5.4 5.6 7.7-.2-.2 7.7L38.5 20l-5.6 5.4.2 7.7-7.7-.2L20 38.5l-5.4-5.6-7.7.2.2-7.7L1.5 20l5.6-5.4-.2-7.7 7.7.2z"
        fill="var(--marker-fill)" stroke="var(--frame)" strokeWidth="1.4" />
      <circle cx="20" cy="20" r="11.5" fill="none" stroke="var(--frame)" strokeWidth="1" opacity=".7" />
    </svg>
    <b>{toArabicDigits(n)}</b>
    {children}
  </span>
);