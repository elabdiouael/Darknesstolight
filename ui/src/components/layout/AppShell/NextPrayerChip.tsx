"use client";

// Chip sghir f navbar (HUD): s-salat l-jaya w ch7al ba9i liha. Component bo7do bach l-shell ma y-re-renderich.
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { DictKey } from "@/i18n/dictionaries";
import { FARD, timesForDate } from "@/lib/prayerTimes";
import { toPrayerInput, useSalatSettings } from "@/lib/salatStore";
import styles from "./AppShell.module.css";

const pad = (n: number) => String(n).padStart(2, "0");

export const NextPrayerChip = () => {
  const { t } = useI18n();
  const [settings] = useSalatSettings();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(id); }, []);

  const input = toPrayerInput(settings);
  const today = timesForDate(new Date(now), input);
  const tomorrow = timesForDate(new Date(now + 86_400_000), input);
  const seq = [...FARD.map((p) => ({ p, at: today[p]?.getTime() ?? NaN })), { p: "fajr" as const, at: tomorrow.fajr?.getTime() ?? NaN }];
  const next = seq.find((e) => e.at > now);
  if (!next) return null;
  const min = Math.max(0, Math.round((next.at - now) / 60_000));

  return (
    <Link href="/salat" className={styles.hud} title={t("salat.next")}>
      <i aria-hidden />
      <strong>{t(`salat.p.${next.p}` as DictKey)}</strong>
      <span>−{pad(Math.floor(min / 60))}:{pad(min % 60)}</span>
    </Link>
  );
};
