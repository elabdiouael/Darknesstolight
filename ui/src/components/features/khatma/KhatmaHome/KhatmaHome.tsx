"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, KeyRound, Sparkles, Flame, BookOpen, Brain, ArrowRight } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useMe } from "@/components/layout/AppShell/AppShell";
import { HifdSurah, Khatma, hifdService, khatmaService } from "@/services/api/khatmaService";
import { KhatmaCard } from "../KhatmaCard/KhatmaCard";
import { CreateKhatmaModal, JoinKhatmaModal } from "../KhatmaModals/KhatmaModals";
import { getSurah, juzOf, khatmaProgress } from "@/lib/quran";
import { getTemplate } from "@/lib/templates";
import { KhatmaOrb3D } from "@/components/three/KhatmaOrb3D/KhatmaOrb3D";
import { CountUp, Magnetic } from "@/components/common/Motion/Motion";
import { AyahOfDay } from "../AyahOfDay/AyahOfDay";
import { AdhkarNow } from "@/components/features/adhkar/AdhkarNow/AdhkarNow";
import styles from "./KhatmaHome.module.css";

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } }),
};

export const KhatmaHome = () => {
  const { t, surahName } = useI18n();
  const { me } = useMe();
  const router = useRouter();
  const params = useSearchParams();
  const joinCode = params.get("join") ?? "";

  const [list, setList] = useState<Khatma[] | null>(null);
  const [hifd, setHifd] = useState<HifdSurah[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  // Lien d'invitation (?join=CODE) kay7el l-modal direct, 7ta y-sedo l-user
  const [joinDismissed, setJoinDismissed] = useState(false);
  const showJoin = joinOpen || (!!joinCode && !joinDismissed);

  useEffect(() => {
    let alive = true;
    Promise.all([khatmaService.list(), hifdService.summary()])
      .then(([k, h]) => { if (alive) { setList(k); setHifd(h); } })
      .catch(() => { if (alive) setList([]); });
    return () => { alive = false; };
  }, []);

  const active = useMemo(() => (list ?? []).filter((k) => !k.completed), [list]);
  const latest = active[0];
  // L-orb 3D kayban l-khatma li katsta3mel daba (awla li tsalat ila kolchi tsala)
  const featured = latest ?? list?.[0];
  const featuredProgress = featured ? khatmaProgress(featured.currentSurah, featured.currentAyah, featured.completed) : 0;
  const featuredJuz = featured ? juzOf(featured.currentSurah, featured.currentAyah) : 1;
  const hifdCount = hifd.reduce((s, h) => s + h.count, 0);

  const stats = [
    { icon: Sparkles, label: t("common.points"), value: me?.nourPoints ?? 0 },
    { icon: Flame, label: t("common.streak"), value: me?.currentStreak ?? 0 },
    { icon: BookOpen, label: t("home.stat.active"), value: active.length },
    { icon: Brain, label: t("home.stat.hifd"), value: hifdCount },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.heroWrap}>
      <div className={styles.hero}>
        <motion.p custom={0} variants={fadeUp} initial="hidden" animate="show" className={styles.greet}>
          {t("home.greeting", { name: me?.username ?? "" })}
        </motion.p>
        <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="show" className={`${styles.title} gold-text`}>
          {t("home.title")}
        </motion.h1>
        <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show" className={styles.sub}>
          {t("home.subtitle")}
        </motion.p>
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className={styles.ctas}>
          <Magnetic><button className="btn-gold" onClick={() => setCreateOpen(true)}><Plus size={18} /> {t("home.new")}</button></Magnetic>
          <Magnetic strength={0.25}><button className="btn-ghost" onClick={() => setJoinOpen(true)}><KeyRound size={17} /> {t("home.join")}</button></Magnetic>
        </motion.div>

        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className={styles.stats}>
          {stats.map((s) => (
            <div key={s.label} className={`glass-panel fx-card ${styles.stat}`}>
              <s.icon size={18} />
              <strong><CountUp value={s.value} /></strong>
              <span>{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        className={styles.orbCol}
        initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1.4, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <KhatmaOrb3D progress={featuredProgress} juz={featuredJuz} accent={getTemplate(featured?.template).accent}>
          <div className={styles.orbPct}><CountUp value={featuredProgress} decimals={1} /><small>%</small></div>
          <div className={styles.orbMeta}>
            {featured ? <>{featured.title} · {t("common.juz")} {featuredJuz}/30</> : <>{t("common.juz")} 0/30</>}
          </div>
        </KhatmaOrb3D>
      </motion.div>
      </section>

      {latest && (
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show">
          <Link href={`/khatma/${latest.id}`} className={`nour-border ${styles.continue}`}
            style={{ ["--acc" as string]: getTemplate(latest.template).accent }}>
            <div>
              <span className={styles.continueLabel}>{t("home.continue")} · {latest.title}</span>
              <span className={styles.continueSurah}>
                {surahName(getSurah(latest.currentSurah))} · {t("common.ayah")} {latest.currentAyah}
              </span>
            </div>
            <span className={`quran-text ${styles.continueAr}`}>{getSurah(latest.currentSurah).ar}</span>
            <span className={styles.continueGo}><ArrowRight size={18} /></span>
          </Link>
        </motion.div>
      )}

      <AdhkarNow compact />

      <AyahOfDay />

      {list === null ? (
        <div className={`fx-rail ${styles.grid}`}>
          {[0, 1, 2].map((i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : list.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className={`glass-panel ${styles.empty}`}>
          <motion.span className={`quran-text ${styles.emptyAr}`} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 4, repeat: Infinity }}>
            ٱقْرَأْ بِٱسْمِ رَبِّكَ
          </motion.span>
          <h2>{t("home.empty.title")}</h2>
          <p>{t("home.empty.text")}</p>
          <button className="btn-gold" onClick={() => setCreateOpen(true)}><Plus size={18} /> {t("home.new")}</button>
        </motion.div>
      ) : (
        <div className={`fx-rail ${styles.grid}`}>
          {list.map((k, i) => <KhatmaCard key={k.id} khatma={k} index={i} />)}
        </div>
      )}

      <CreateKhatmaModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(k) => router.push(`/khatma/${k.id}`)}
      />
      <JoinKhatmaModal
        open={showJoin}
        initialCode={joinCode}
        onClose={() => { setJoinOpen(false); setJoinDismissed(true); if (joinCode) router.replace("/khatma"); }}
        onJoined={(k) => router.push(`/khatma/${k.id}`)}
      />
    </div>
  );
};