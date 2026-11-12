"use client";

// Carte image dyal l-aya (canvas) bach t-partagiha: 7 thèmes, traduction optionnelle, PNG / partage natif / copie
import React, { useEffect, useRef, useState } from "react";
import { Copy, Download, Share2, Languages } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { DictKey } from "@/i18n/dictionaries";
import { useToast } from "@/components/common/Toast/Toast";
import { getSurah, toArabicDigits } from "@/lib/quran";
import { Verse } from "@/services/quran/quranText";
import styles from "./AyahShare.module.css";

type CardTheme = "emerald" | "parchment" | "madina" | "andalus" | "lapis" | "kiswa" | "night";

const THEMES: Record<CardTheme, { bg: [string, string]; ink: string; gold: string; sub: string }> = {
  emerald: { bg: ["#0b3a28", "#03110b"], ink: "#fff4d6", gold: "#d4af37", sub: "#9fd8bd" },
  parchment: { bg: ["#f7ecd2", "#e6d2a6"], ink: "#2b1d0c", gold: "#a8801f", sub: "#5b4526" },
  madina: { bg: ["#fefaee", "#efe2c0"], ink: "#1a1408", gold: "#1f7a55", sub: "#4f5d46" },
  andalus: { bg: ["#fbf4e7", "#e8d5b4"], ink: "#2a1c10", gold: "#1c6f6a", sub: "#9a3f1c" },
  lapis: { bg: ["#123063", "#040a1e"], ink: "#eef1fb", gold: "#e3c06a", sub: "#b6c6f0" },
  kiswa: { bg: ["#151513", "#000000"], ink: "#f4ead0", gold: "#ffd875", sub: "#c9c0a4" },
  night: { bg: ["#101014", "#000000"], ink: "#f5eedb", gold: "#ecd08a", sub: "#b9b2a0" },
};

const LIGHT_CARDS = new Set<CardTheme>(["parchment", "madina", "andalus"]);

const W = 1080;
const H = 1350;

/** Kat-9sem text 3la stour 3la 7sab l-3ord */
const wrap = (ctx: CanvasRenderingContext2D, text: string, max: number): string[] => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > max && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
};

const star = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.55 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
};

const draw = async (canvas: HTMLCanvasElement, opts: {
  theme: CardTheme; surah: number; verse: Verse; withTrans: boolean; surahLabel: string; ayahLabel: string;
}) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const th = THEMES[opts.theme];
  try {
    await Promise.all([
      document.fonts.load('64px "Amiri Quran"'),
      document.fonts.load('600 40px "Cormorant Garamond"'),
      document.fonts.load('700 30px "Manrope"'),
    ]);
  } catch { /* fonts dyal système */ }

  // Fond + halo
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, th.bg[0]);
  g.addColorStop(1, th.bg[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const halo = ctx.createRadialGradient(W / 2, 260, 20, W / 2, 260, 700);
  halo.addColorStop(0, `${th.gold}40`);
  halo.addColorStop(1, "transparent");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  // Cadre double + najmat f z-zwaya
  ctx.strokeStyle = th.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, W - 96, H - 96);
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(66, 66, W - 132, H - 132);
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.fillStyle = th.gold;
  [[48, 48], [W - 48, 48], [48, H - 48], [W - 48, H - 48]].forEach(([x, y]) => { star(ctx, x, y, 22); ctx.fill(); });

  // Smiyt s-sourate
  ctx.textAlign = "center";
  ctx.direction = "rtl";
  ctx.fillStyle = th.gold;
  ctx.font = '64px "Amiri Quran", "Amiri", serif';
  ctx.fillText(`سُورَةُ ${getSurah(opts.surah).ar}`, W / 2, 190);
  ctx.globalAlpha = 0.6;
  ctx.fillRect(W / 2 - 160, 222, 320, 2);
  star(ctx, W / 2, 223, 10);
  ctx.fill();
  ctx.globalAlpha = 1;

  // L-aya (taille adaptative)
  const text = `${opts.verse.text} ﴿${toArabicDigits(opts.verse.id)}﴾`;
  const maxH = opts.withTrans && opts.verse.translation ? 560 : 760;
  let size = 72;
  let lines: string[] = [];
  for (; size >= 30; size -= 4) {
    ctx.font = `${size}px "Amiri Quran", "Amiri", serif`;
    lines = wrap(ctx, text, W - 220);
    if (lines.length * size * 1.9 <= maxH) break;
  }
  const lh = size * 1.9;
  let y = 300 + (maxH - lines.length * lh) / 2 + size;
  ctx.fillStyle = th.ink;
  ctx.shadowColor = `${th.gold}66`;
  ctx.shadowBlur = LIGHT_CARDS.has(opts.theme) ? 0 : 18;
  lines.forEach((l) => { ctx.fillText(l, W / 2, y); y += lh; });
  ctx.shadowBlur = 0;

  // Traduction
  if (opts.withTrans && opts.verse.translation) {
    ctx.direction = "ltr";
    ctx.fillStyle = th.sub;
    let ts = 36;
    let tl: string[] = [];
    for (; ts >= 22; ts -= 2) {
      ctx.font = `italic 600 ${ts}px "Cormorant Garamond", serif`;
      tl = wrap(ctx, `« ${opts.verse.translation} »`, W - 240);
      if (tl.length * ts * 1.45 <= 300) break;
    }
    let ty = 300 + maxH + 70;
    tl.forEach((l) => { ctx.fillText(l, W / 2, ty); ty += ts * 1.45; });
  }

  // Référence + signature
  ctx.direction = "ltr";
  ctx.fillStyle = th.gold;
  ctx.font = '700 30px "Manrope", sans-serif';
  ctx.fillText(`${opts.surahLabel} · ${opts.ayahLabel}`, W / 2, H - 150);
  ctx.globalAlpha = 0.6;
  ctx.font = '600 26px "Cormorant Garamond", serif';
  ctx.fillText("✦ From Darknesses to Light ✦", W / 2, H - 104);
  ctx.globalAlpha = 1;
};

export const AyahShare = ({ surah, verse }: { surah: number; verse: Verse }) => {
  const { t, surahName } = useI18n();
  const toast = useToast();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [theme, setTheme] = useState<CardTheme>("emerald");
  const [withTrans, setWithTrans] = useState(!!verse.translation);
  const name = surahName(getSurah(surah));
  const ayahLabel = `${t("common.ayah")} ${verse.id}`;

  useEffect(() => {
    if (canvas.current) draw(canvas.current, { theme, surah, verse, withTrans, surahLabel: name, ayahLabel });
  }, [theme, surah, verse, withTrans, name, ayahLabel]);

  const fileName = `ayah-${surah}-${verse.id}.png`;
  const toBlob = () => new Promise<Blob | null>((res) => {
    if (!canvas.current) { res(null); return; }
    canvas.current.toBlob(res, "image/png");
  });

  const download = async () => {
    const blob = await toBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const share = async () => {
    const blob = await toBlob();
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try { await nav.share({ files: [file], title: `${name} ${surah}:${verse.id}` }); } catch { /* annulé */ }
    } else {
      download();
    }
  };

  const copy = async () => {
    const txt = `${verse.text}\n\n${verse.translation ? `${verse.translation}\n\n` : ""}— ${name} ${surah}:${verse.id}`;
    try { await navigator.clipboard.writeText(txt); toast(t("common.copied")); } catch { /* bloqué */ }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.preview}><canvas ref={canvas} width={W} height={H} /></div>
      <div className={styles.side}>
        <div className={styles.themes}>
          {(Object.keys(THEMES) as CardTheme[]).map((k) => (
            <button key={k} className={`${styles.swatch} ${theme === k ? styles.swOn : ""}`} onClick={() => setTheme(k)}
              style={{ background: `linear-gradient(135deg, ${THEMES[k].bg[0]}, ${THEMES[k].bg[1]})`, borderColor: THEMES[k].gold }}
              title={t(`share.theme.${k}` as DictKey)} aria-label={t(`share.theme.${k}` as DictKey)} />
          ))}
        </div>
        {verse.translation && (
          <button className={`${styles.toggle} ${withTrans ? styles.toggleOn : ""}`} onClick={() => setWithTrans((v) => !v)}>
            <Languages size={15} /> {t("share.withTranslation")}
          </button>
        )}
        <button className="btn-gold" onClick={share}><Share2 size={16} /> {t("share.image")}</button>
        <button className="btn-ghost" onClick={download}><Download size={16} /> {t("share.download")}</button>
        <button className="btn-ghost" onClick={copy}><Copy size={16} /> {t("share.copyText")}</button>
      </div>
    </div>
  );
};