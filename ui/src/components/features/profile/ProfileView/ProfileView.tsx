"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, LogOut as Leave, Share2, PenLine, Mic } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { DictKey } from "@/i18n/dictionaries";
import { useMe } from "@/components/layout/AppShell/AppShell";
import { useToast } from "@/components/common/Toast/Toast";
import { HifdSurah, Khatira, Khatma, hifdService, khatmaService, khawatirService } from "@/services/api/khatmaService";
import { KhatmaCard } from "@/components/features/khatma/KhatmaCard/KhatmaCard";
import { ShareKhatmaModal } from "@/components/features/khatma/KhatmaModals/KhatmaModals";
import { HifdReviewModal } from "../HifdReviewModal/HifdReviewModal";
import { ProgressRing } from "@/components/common/ProgressRing/ProgressRing";
import { getSurah } from "@/lib/quran";
import { PerfSwitch } from "@/components/common/Perf/Perf";
import { ProfileDashboard, levelOf } from "../ProfileDashboard/ProfileDashboard";
import styles from "./ProfileView.module.css";

type Filter = "all" | "mine" | "shared" | "done";

export const ProfileView = () => {
  const { t, lang, surahName, formatDate } = useI18n();
  const { me } = useMe();
  const toast = useToast();
  const [list, setList] = useState<Khatma[]>([]);
  const [hifd, setHifd] = useState<HifdSurah[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [review, setReview] = useState<HifdSurah | null>(null);
  const [sharing, setSharing] = useState<Khatma | null>(null);
  const [khawatir, setKhawatir] = useState<Khatira[]>([]);

  // Hifd kayt3awd ytcharja mn ba3d kol révision
  const loadHifd = useCallback(() => {
    hifdService.summary().then(setHifd).catch(() => { /* ignore */ });
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([khatmaService.list(), hifdService.summary(), khawatirService.list()])
      .then(([k, h, kh]) => { if (alive) { setList(k); setHifd(h); setKhawatir(kh); } })
      .catch(() => { /* ignore */ });
    return () => { alive = false; };
  }, []);

  const shown = useMemo(() => list.filter((k) => {
    if (filter === "mine") return k.owner && k.members.length <= 1;
    if (filter === "shared") return k.members.length > 1 || !k.owner;
    if (filter === "done") return k.completed;
    return true;
  }), [list, filter]);

  const remove = async (k: Khatma) => {
    if (!confirm(k.owner ? t("profile.confirmDelete") : t("profile.confirmLeave"))) return;
    try { await khatmaService.remove(k.id); setList((l) => l.filter((x) => x.id !== k.id)); }
    catch { toast(t("common.error"), "error"); }
  };

  const removeKhatira = async (id: number) => {
    try { await khawatirService.remove(id); setKhawatir((l) => l.filter((x) => x.id !== id)); }
    catch { toast(t("common.error"), "error"); }
  };

  const onShared = useCallback((k: Khatma) => {
    setSharing(k);
    setList((l) => l.map((x) => (x.id === k.id ? k : x)));
  }, []);

  const lv = levelOf(me?.nourPoints ?? 0);
  const filters: Filter[] = ["all", "mine", "shared", "done"];

  return (
    <div className={styles.page}>
      {/* ===== Carte identité ===== */}
      <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`glass-panel ${styles.idCard}`}>
        <div className={styles.avatarWrap}>
          <motion.div className={styles.avatarHalo} animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} />
          <span className={styles.avatar}>{me?.username?.slice(0, 1).toUpperCase() ?? "·"}</span>
        </div>
        <div className={styles.idText}>
          <h1 className="gold-text">{me?.username ?? "…"}</h1>
          <p>{me?.email}</p>
          <small>{t("profile.since", { date: formatDate(me?.createdAt) })}</small>
        </div>
        <div className={styles.idLevel}>
          <span>{t("dash.level", { n: lv.level })}</span>
          <strong>{lang === "ar" ? lv.rank.ar : lv.rank.latin}</strong>
        </div>
      </motion.section>

      <PerfSwitch />

      {/* ===== Dashboard: stats + analyse ===== */}
      <ProfileDashboard me={me} list={list} hifd={hifd} khawatir={khawatir} />

      {/* ===== Templates ===== */}
      <section>
        <div className={styles.sectionHead}>
          <h2>{t("profile.templates")}</h2>
          <div className={styles.filters}>
            {filters.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={filter === f ? styles.fOn : ""}>
                {filter === f && <motion.span layoutId="pfFilter" className={styles.fPill} />}
                <span>{t(`profile.filter.${f}` as DictKey)}</span>
              </button>
            ))}
          </div>
        </div>
        {shown.length === 0 ? (
          <p className={styles.empty}>{t("profile.empty")}</p>
        ) : (
          <motion.div layout className={styles.grid}>
            <AnimatePresence>
              {shown.map((k, i) => (
                <motion.div key={k.id} layout exit={{ opacity: 0, scale: 0.9 }}>
                  <KhatmaCard khatma={k} index={i} actions={
                    <>
                      <button className="icon-btn" title={t("share.title")} onClick={() => setSharing(k)}><Share2 size={16} /></button>
                      <button className="icon-btn" title={k.owner ? t("profile.delete") : t("profile.leave")} onClick={() => remove(k)}>
                        {k.owner ? <Trash2 size={16} /> : <Leave size={16} />}
                      </button>
                    </>
                  } />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* ===== Hifd ===== */}
      <section>
        <div className={styles.sectionHead}>
          <h2>{t("profile.hifd")}</h2>
          <Link href="/hifd" className="btn-ghost"><Mic size={15} /> {t("profile.hifd.program")}</Link>
        </div>
        {hifd.length === 0 ? (
          <p className={styles.empty}>{t("profile.hifd.empty")}</p>
        ) : (
          <div className={styles.hifdGrid}>
            {hifd.map((h, i) => {
              const s = getSurah(h.surah);
              const pct = (h.count / s.verses) * 100;
              return (
                <motion.div key={h.surah} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`glass-panel nour-border fx-card ${styles.hifdCard}`}>
                  <ProgressRing value={pct} size={64} stroke={5} color="#5fd3a0">
                    <span className={styles.hPct}>{Math.round(pct)}%</span>
                  </ProgressRing>
                  <div className={styles.hInfo}>
                    <strong>{surahName(s)}</strong>
                    <small>{t("common.ayah")} {h.fromAyah} → {h.toAyah} · {h.count}/{s.verses}</small>
                    {h.due > 0 && <span className={styles.due}>{t("profile.hifd.due", { n: h.due })}</span>}
                  </div>
                  <span className={`quran-text ${styles.hAr}`}>{s.ar}</span>
                  <button className="btn-ghost" onClick={() => setReview(h)}>{t("profile.hifd.review")}</button>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== Khawatir ===== */}
      <section>
        <div className={styles.sectionHead}><h2>{t("profile.khawatir")}</h2></div>
        {khawatir.length === 0 ? (
          <p className={styles.empty}>{t("profile.khawatir.empty")}</p>
        ) : (
          <div className={styles.notes}>
            <AnimatePresence>
              {khawatir.map((k, i) => (
                <motion.article key={k.id} layout className={`glass-panel fx-card ${styles.note}`}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(i, 8) * 0.04 }}>
                  <header>
                    <span className={styles.noteRef}><PenLine size={13} /> {surahName(getSurah(k.surah))} · {k.ayah}</span>
                    <button className="icon-btn" title={t("profile.delete")} onClick={() => removeKhatira(k.id)}><Trash2 size={15} /></button>
                  </header>
                  <p>{k.content}</p>
                  <small>{formatDate(k.createdAt)}</small>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      <HifdReviewModal item={review} onClose={() => setReview(null)} onDone={loadHifd} />
      <ShareKhatmaModal open={!!sharing} khatma={sharing} onClose={() => setSharing(null)} onUpdated={onShared} />
    </div>
  );
};