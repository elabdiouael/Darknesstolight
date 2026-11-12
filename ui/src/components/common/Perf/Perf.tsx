"use client";

// PerfRoot: kay-7ett data-perf 3la <html> (l-CSS kay-khfef 7sabo) w kay-goul l framer-motion y-n9es l-7araka f "low".
// PerfSwitch: l-user y9der ykhtar bidih (Auto / Max / Équilibré / Léger).
import React, { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { Gauge } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { DictKey } from "@/i18n/dictionaries";
import { PERF_MODES, setPerfMode, usePerf } from "@/lib/perf";
import styles from "./Perf.module.css";

export const PerfRoot = ({ children }: { children: React.ReactNode }) => {
  const { tier } = usePerf();
  useEffect(() => { document.documentElement.dataset.perf = tier; }, [tier]);
  return <MotionConfig reducedMotion={tier === "low" ? "always" : "user"}>{children}</MotionConfig>;
};

export const PerfSwitch = () => {
  const { t } = useI18n();
  const { mode, tier } = usePerf();
  return (
    <div className={styles.wrap}>
      <span className={styles.label}><Gauge size={14} /> {t("perf.title")}</span>
      <div className={styles.seg} role="radiogroup" aria-label={t("perf.title")}>
        {PERF_MODES.map((m) => (
          <button key={m} role="radio" aria-checked={mode === m} className={mode === m ? styles.on : ""} onClick={() => setPerfMode(m)}>
            {t(`perf.${m}` as DictKey)}
          </button>
        ))}
      </div>
      {mode === "auto" && <small className={styles.hint}>{t("perf.autoNow", { tier: t(`perf.${tier}` as DictKey) })}</small>}
    </div>
  );
};
