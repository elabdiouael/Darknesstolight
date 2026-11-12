"use client";

import React from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/I18nProvider";
import { LANGS } from "@/i18n/dictionaries";
import styles from "./LangSwitcher.module.css";

export const LangSwitcher = () => {
  const { lang, setLang } = useI18n();
  return (
    <div className={styles.wrap} role="radiogroup" aria-label="Language">
      {LANGS.map((l) => (
        <button
          key={l.id}
          role="radio"
          aria-checked={lang === l.id}
          title={l.label}
          className={`${styles.btn} ${lang === l.id ? styles.on : ""}`}
          onClick={() => setLang(l.id)}
        >
          {lang === l.id && <motion.span layoutId="langPill" className={styles.pill} transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
          <span className={styles.label}>{l.short}</span>
        </button>
      ))}
    </div>
  );
};