"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Users, CheckCircle2, Bookmark, ArrowRight } from "lucide-react";
import { Khatma } from "@/services/api/khatmaService";
import { getTemplate } from "@/lib/templates";
import { getSurah, juzOf, khatmaProgress, TOTAL_AYAHS, globalIndex } from "@/lib/quran";
import { useI18n } from "@/i18n/I18nProvider";
import { DictKey } from "@/i18n/dictionaries";
import { ProgressRing } from "@/components/common/ProgressRing/ProgressRing";
import styles from "./KhatmaCard.module.css";

interface Props { khatma: Khatma; index?: number; actions?: React.ReactNode }

export const KhatmaCard = ({ khatma, index = 0, actions }: Props) => {
  const { t, surahName } = useI18n();
  const tpl = getTemplate(khatma.template);
  const surah = getSurah(khatma.currentSurah);
  const progress = khatmaProgress(khatma.currentSurah, khatma.currentAyah, khatma.completed);
  const remaining = TOTAL_AYAHS - globalIndex(khatma.currentSurah, khatma.currentAyah);
  const pace = Math.max(1, Math.ceil(TOTAL_AYAHS / khatma.targetDays));

  // Tilt 3D m3a souris
  const ref = useRef<HTMLDivElement>(null);
  const rect = useRef<DOMRect | null>(null);
  const mx = useMotionValue(0.5), my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 200, damping: 20 });
  // L-glyph kay-t7errek 3aks souris (parallax)
  const gx = useSpring(useTransform(mx, [0, 1], [14, -14]), { stiffness: 120, damping: 18 });
  const gy = useSpring(useTransform(my, [0, 1], [10, -10]), { stiffness: 120, damping: 18 });

  // L-rect kayt9ra merra we7da f d-dkhoul (machi f kol pointermove) — ghir b souris, machi f touch
  const onEnter = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") rect.current = ref.current?.getBoundingClientRect() ?? null;
  };
  const onMove = (e: React.PointerEvent) => {
    const r = rect.current;
    if (!r || e.pointerType !== "mouse") return;
    const x = e.clientX - r.left, y = e.clientY - r.top;
    mx.set(x / r.width);
    my.set(y / r.height);
    // Spotlight (shine + bordure) b CSS vars: bla re-render
    ref.current?.style.setProperty("--px", `${x}px`);
    ref.current?.style.setProperty("--py", `${y}px`);
  };
  const onLeave = () => { rect.current = null; mx.set(0.5); my.set(0.5); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 36, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ delay: Math.min(index, 6) * 0.07, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.lift}>
      <motion.div
        ref={ref}
        onPointerEnter={onEnter}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{
          rotateX: rx, rotateY: ry,
          ["--tpl-from" as string]: tpl.from, ["--tpl-to" as string]: tpl.to,
          ["--tpl-accent" as string]: tpl.accent, ["--tpl-glow" as string]: tpl.glow,
        }}
        className={`nour-border ${styles.card}`}
      >
        <span className={styles.shine} aria-hidden />
        <span className={styles.edge} aria-hidden />
        <motion.span className={styles.glyph} style={{ x: gx, y: gy }} aria-hidden>{tpl.glyph}</motion.span>

        <Link href={`/khatma/${khatma.id}`} className={styles.body}>
          <div className={styles.top}>
            <span className={styles.tpl}>{t(`tpl.${tpl.id}` as DictKey)}</span>
            <div className={styles.badges}>
              {khatma.members.length > 1 && <span className={styles.badge}><Users size={12} /> {khatma.members.length}</span>}
              {khatma.inviteCode && khatma.members.length <= 1 && <span className={styles.badge}><Users size={12} /> {t("card.shared")}</span>}
              {khatma.completed && <span className={`${styles.badge} ${styles.done}`}><CheckCircle2 size={12} /> {t("card.completed")}</span>}
            </div>
          </div>

          <div className={styles.mid}>
            <ProgressRing value={progress} color={tpl.accent} size={96}>
              <div>
                <div className={styles.pct}>{Math.floor(progress)}<small>%</small></div>
                <div className={styles.juz}>{t("common.juz")} {juzOf(khatma.currentSurah, khatma.currentAyah)}</div>
              </div>
            </ProgressRing>
            <div className={styles.info}>
              <h3 className={styles.title}>{khatma.title}</h3>
              <p className={styles.checkpoint}>
                <Bookmark size={13} /> {surahName(surah)} · {khatma.currentAyah}
              </p>
              <p className={`quran-text ${styles.ar}`}>{surah.ar}</p>
            </div>
          </div>

          <div className={styles.foot}>
            <div className={styles.avatars}>
              {khatma.members.slice(0, 4).map((m, i) => (
                <span key={m.id} className={styles.avatar} style={{ zIndex: 10 - i }} title={m.username}>
                  {m.username.slice(0, 1).toUpperCase()}
                </span>
              ))}
            </div>
            <span className={styles.meta}>
              {khatma.completed ? `${TOTAL_AYAHS} ${t("common.ayahs")}` : t("card.pace", { n: pace })}
              {!khatma.completed && remaining > 0 && <> · {khatma.targetDays} {t("common.days")}</>}
            </span>
            <span className={styles.go}><ArrowRight size={16} /></span>
          </div>
        </Link>
        {actions && <div className={styles.actions}>{actions}</div>}
      </motion.div>
      </div>
    </motion.div>
  );
};