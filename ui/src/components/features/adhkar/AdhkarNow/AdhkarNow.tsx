"use client";

// Carte "Dhikr du moment" (matin / soir / nuit) — f l-accueil w f /adhkar
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlarmClock, ArrowRight, BookOpen, Droplets, HandHeart, Heart, House, Moon, ShieldCheck, Sparkles, Sunrise, Sunset,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { CategoryIcon, getCategory, pick, suggestedCategory } from "@/lib/adhkar";
import { useAdhkarProgress } from "@/lib/adhkarStore";
import { ProgressRing } from "@/components/common/ProgressRing/ProgressRing";
import styles from "./AdhkarNow.module.css";

export const CATEGORY_ICONS: Record<CategoryIcon, React.ElementType> = {
  sunrise: Sunrise, sunset: Sunset, prayer: HandHeart, moon: Moon, alarm: AlarmClock, repent: Droplets,
  sparkle: Sparkles, heart: Heart, book: BookOpen, shield: ShieldCheck, home: House,
};

export const AdhkarNow = ({ compact = false }: { compact?: boolean }) => {
  const { t, lang } = useI18n();
  const progress = useAdhkarProgress();
  // L-wa9t kayt7seb merra wa7da (lazy) — machi f kol render
  const [catId] = React.useState(() => suggestedCategory());
  const cat = getCategory(catId)!;
  const p = progress.catProgress(cat);
  const Icon = CATEGORY_ICONS[cat.icon];
  const started = p.done > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
      <Link href={`/adhkar/${cat.id}`} className={`${styles.card} ${compact ? styles.compact : ""}`} style={{ ["--h" as string]: cat.hue }}>
        <span className={styles.glow} aria-hidden />
        <span className={styles.iconWrap}><Icon size={compact ? 22 : 28} /></span>
        <span className={styles.txt}>
          <small>{t("adhkar.now")}</small>
          <strong>{pick(cat.title, lang)}</strong>
          {!compact && <em>{pick(cat.desc, lang)}</em>}
        </span>
        <ProgressRing value={p.pct} size={compact ? 54 : 74} stroke={compact ? 4 : 5}>
          <span className={styles.pct}>{Math.round(p.pct)}<small>%</small></span>
        </ProgressRing>
        <span className={styles.go}>
          <span className={styles.goLabel}>{p.pct >= 100 ? t("adhkar.done") : started ? t("adhkar.continue") : t("adhkar.start")}</span>
          <ArrowRight size={17} className={styles.flip} />
        </span>
      </Link>
    </motion.div>
  );
};