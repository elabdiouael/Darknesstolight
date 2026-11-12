"use client";

// Session dyal Tasmi3: l-user kay9ra l-aya mn dakira dyalo b sawto, l-app katsme3 w kat-compari kelma b kelma (live),
// kat-ban fin ghlat, kat-3ti score w kat-sift n-natija l-programme dyal l-mouraja3a (SM-2 / Manzil) + points.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Mic, Square, Lightbulb, RotateCcw, ArrowRight, Volume2, Eye, Check, Sparkles, SkipForward, MicOff, Loader2,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { DictKey } from "@/i18n/dictionaries";
import { useMe } from "@/components/layout/AppShell/AppShell";
import { useCelebrate } from "@/components/common/Celebration/Celebration";
import { ProgressRing } from "@/components/common/ProgressRing/ProgressRing";
import { getSurah } from "@/lib/quran";
import { compare, ayahWords, TasmiaResult, WordStatus } from "@/lib/tasmia";
import { useSpeech, useSpeechSupported } from "@/lib/useSpeech";
import { ReviewResult, hifdService } from "@/services/api/khatmaService";
import { ayahAudioUrl, DEFAULT_RECITER, fetchChapter, Verse } from "@/services/quran/quranText";
import styles from "./TasmiaSession.module.css";

export interface TasmiaItem { surah: number; ayah: number }
type Mode = "voice" | "self";

interface Outcome { item: TasmiaItem; accuracy: number; passed: boolean; points: number; skipped?: boolean }

interface Props {
  items: TasmiaItem[];
  hintWords?: number;
  passThreshold?: number;
  reciter?: string;
  onDone?: () => void;      // kayt3iyet mli tsala (bach parent y-refreshi)
  onClose: () => void;
}

const QUALITIES = [
  { q: 0, key: "review.q0", tone: "#ff8a7a" },
  { q: 3, key: "review.q3", tone: "#f0c879" },
  { q: 4, key: "review.q4", tone: "#a7e8c6" },
  { q: 5, key: "review.q5", tone: "#5fd3a0" },
];

const keyOf = (i: TasmiaItem) => `${i.surah}:${i.ayah}`;

export const TasmiaSession = ({ items, hintWords = 1, passThreshold = 85, reciter = DEFAULT_RECITER, onDone, onClose }: Props) => {
  const { t, lang } = useI18n();
  const supported = useSpeechSupported();
  const celebrate = useCelebrate();
  const [verses, setVerses] = useState<Record<string, Verse>>({});
  const [failed, setFailed] = useState(false);
  const [idx, setIdx] = useState(0);
  const [modeChoice, setModeChoice] = useState<Mode | null>(null);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const mode: Mode = modeChoice ?? (supported ? "voice" : "self");

  // Text dyal ga3 l-ayat (b sourate)
  useEffect(() => {
    let alive = true;
    const surahs = [...new Set(items.map((i) => i.surah))];
    Promise.all(surahs.map((s) => fetchChapter(s, lang)))
      .then((chapters) => {
        if (!alive) return;
        const map: Record<string, Verse> = {};
        chapters.forEach((c) => c.verses.forEach((v) => { map[`${c.id}:${v.id}`] = v; }));
        setVerses(map);
      })
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [items, lang]);

  const finished = idx >= items.length;
  const current = items[idx];
  const verse = current ? verses[keyOf(current)] : undefined;

  const next = (o: Outcome) => {
    const all = [...outcomes, o];
    setOutcomes(all);
    setIdx((i) => i + 1);
    if (idx + 1 >= items.length) {
      onDone?.();
      const done = all.filter((x) => !x.skipped);
      const avg = done.length ? done.reduce((s, x) => s + x.accuracy, 0) / done.length : 0;
      if (done.length && avg >= passThreshold) celebrate({ big: all.length >= 3, title: t("tasmia.summary.title"), subtitle: `${Math.round(avg)}%` });
    }
  };

  if (failed) return <p className={styles.muted}>{t("common.error")}</p>;
  if (!items.length) return <p className={styles.muted}>{t("hifd.empty.queue")}</p>;
  if (finished) return <Summary outcomes={outcomes} pass={passThreshold} onClose={onClose} />;
  if (!verse) return <div className={styles.center}><Loader2 className={styles.spin} /></div>;

  return (
    <div className={styles.wrap}>
      <div className={styles.topline}>
        <div className={styles.segment} role="tablist">
          {(["voice", "self"] as Mode[]).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} className={mode === m ? styles.segOn : ""}
              onClick={() => setModeChoice(m)} disabled={m === "voice" && !supported}>
              {mode === m && <motion.span layoutId="tasmiaMode" className={styles.segPill} />}
              <span>{m === "voice" ? <Mic size={14} /> : <Eye size={14} />} {t(`tasmia.mode.${m}` as DictKey)}</span>
            </button>
          ))}
        </div>
        <span className={styles.counter}>{t("review.of", { i: idx + 1, n: items.length })}</span>
      </div>
      <div className={styles.bar}><motion.i animate={{ width: `${(idx / items.length) * 100}%` }} /></div>
      {!supported && <p className={styles.notice}><MicOff size={14} /> {t("tasmia.notSupported")}</p>}

      {/* key: state jdid l kol aya (bla reset f effect) */}
      {mode === "voice" ? (
        <VoiceItem key={`v-${idx}`} item={current} verse={verse} hintWords={hintWords} pass={passThreshold}
          reciter={reciter} isLast={idx + 1 >= items.length} onNext={next} />
      ) : (
        <SelfItem key={`s-${idx}`} item={current} verse={verse} reciter={reciter} onNext={next} />
      )}
    </div>
  );
};

/* ===================================================================== */

const AyahHeader = ({ item }: { item: TasmiaItem }) => {
  const { t, surahName } = useI18n();
  const s = getSurah(item.surah);
  return (
    <div className={styles.ref}>
      <span className="quran-text">{s.ar}</span>
      <small>{surahName(s)} · {t("common.ayah")} {item.ayah}</small>
    </div>
  );
};

const useAyahAudio = (src: string) => {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => () => audio.current?.pause(), []);
  const toggle = () => {
    if (!audio.current) {
      audio.current = new Audio(src);
      audio.current.onended = () => setPlaying(false);
    }
    if (playing) { audio.current.pause(); setPlaying(false); }
    else audio.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };
  return { playing, toggle };
};

/* ============================ Mode voix ============================ */

type Phase = "ready" | "listening" | "result";

const VoiceItem = ({ item, verse, hintWords, pass, reciter, isLast, onNext }: {
  item: TasmiaItem; verse: Verse; hintWords: number; pass: number; reciter: string; isLast: boolean;
  onNext: (o: Outcome) => void;
}) => {
  const { t } = useI18n();
  const { refreshMe } = useMe();
  const words = useMemo(() => ayahWords(verse.text), [verse.text]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [heard, setHeard] = useState("");
  const [extraHints, setExtraHints] = useState(0);
  const [result, setResult] = useState<TasmiaResult | null>(null);
  const [attempt, setAttempt] = useState(1);
  const [saved, setSaved] = useState<ReviewResult | null>(null);
  const [firstScore, setFirstScore] = useState<number | null>(null);
  const [notHeard, setNotHeard] = useState(false);
  const heardRef = useRef("");
  const phaseRef = useRef<Phase>("ready");
  const autoStop = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audio = useAyahAudio(ayahAudioUrl(item.surah, item.ayah, reciter));

  const shown = Math.min(words.length, hintWords + extraHints);
  const live = useMemo(() => (phase === "listening" ? compare(verse.text, heard, true) : null), [phase, heard, verse.text]);
  const view = result ?? live;

  const finishRef = useRef<() => void>(() => {});
  const { start: recStart, stop: recStop, error: speechError, attachMeter } = useSpeech({
    onText: (text) => {
      heardRef.current = text;
      setHeard(text);
      // Wselna l-akhir dyal l-aya b kelma s7i7a -> n-wqfo automatiquement
      const r = compare(verse.text, text, true);
      const last = r.words[r.words.length - 1];
      if (autoStop.current) clearTimeout(autoStop.current);
      if (r.reached === words.length && last && (last.status === "ok" || last.status === "close")) {
        autoStop.current = setTimeout(() => finishRef.current(), 900);
      }
    },
    onEnd: () => finishRef.current(),
  });

  const finish = () => {
    if (phaseRef.current !== "listening") return;
    phaseRef.current = "result";
    if (autoStop.current) clearTimeout(autoStop.current);
    recStop();
    const text = heardRef.current;
    if (!text.trim()) {
      phaseRef.current = "ready";
      setPhase("ready");
      setNotHeard(true);
      return;
    }
    const r = compare(verse.text, text, false);
    // Kol kelma dyal indice zayda kat-n9es chwiya mn n-natija
    const penalty = Math.round((extraHints / Math.max(words.length, 1)) * 50);
    const accuracy = Math.max(0, r.accuracy - penalty);
    const final = { ...r, accuracy };
    setResult(final);
    setPhase("result");
    // Ghir l-mo7awala l-oula kat-tsjel f l-programme (l-be9i = tadrib)
    if (attempt === 1) {
      setFirstScore(accuracy);
      hifdService.tasmia(item.surah, item.ayah, accuracy, final.mistakes)
        .then((res) => { setSaved(res); refreshMe(); })
        .catch(() => {});
    }
  };

  useEffect(() => { finishRef.current = finish; });
  useEffect(() => () => { if (autoStop.current) clearTimeout(autoStop.current); }, []);

  const begin = () => {
    heardRef.current = "";
    setHeard("");
    setResult(null);
    setNotHeard(false);
    phaseRef.current = "listening";
    setPhase("listening");
    recStart();
  };

  const retry = () => {
    setAttempt((a) => a + 1);
    setExtraHints(0);
    begin();
  };

  const statusAt = (i: number): WordStatus => view?.words[i]?.status ?? "pending";
  const current = live?.reached ?? -1;
  const accuracy = result?.accuracy ?? 0;
  const tier = accuracy >= 98 ? "excellent" : accuracy >= pass ? "pass" : "fail";

  return (
    <div className={styles.item}>
      <AyahHeader item={item} />

      <motion.div className={`${styles.stage} ${phase === "listening" ? styles.stageLive : ""}`} layout>
        <p className={`quran-text ${styles.words}`} dir="rtl">
          {words.map((w, i) => {
            const st = statusAt(i);
            const visible = phase === "result" || i < shown || (st !== "pending" && st !== "missed");
            const heardW = view?.words[i]?.heard;
            return (
              <motion.span
                key={i}
                className={`${styles.w} ${styles[st]} ${visible ? "" : styles.masked} ${i === current && phase === "listening" ? styles.cursor : ""}`}
                initial={false}
                animate={visible ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0.55, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                {w}
                {phase === "result" && heardW && (st === "wrong" || st === "close") && (
                  <small className={styles.heardW}>{heardW}</small>
                )}
              </motion.span>
            );
          })}
        </p>
        {phase === "result" && result && result.extra.length > 0 && (
          <p className={styles.extra}>{t("tasmia.extra")}: <span dir="rtl">{result.extra.join(" · ")}</span></p>
        )}
      </motion.div>

      {phase !== "result" ? (
        <div className={styles.micZone}>
          <button
            ref={attachMeter}
            className={`${styles.mic} ${phase === "listening" ? styles.micOn : ""}`}
            onClick={phase === "listening" ? finish : begin}
            aria-label={phase === "listening" ? t("tasmia.stop") : t("tasmia.tapToStart")}
          >
            <span className={styles.ring} /><span className={styles.ring} /><span className={styles.ring} />
            {phase === "listening" ? <Square size={26} /> : <Mic size={30} />}
          </button>
          <p className={styles.micLabel}>{phase === "listening" ? t("tasmia.listening") : t("tasmia.tapToStart")}</p>
          <AnimatePresence>
            {phase === "listening" && heard && (
              <motion.p className={styles.transcript} dir="rtl" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {heard}
              </motion.p>
            )}
          </AnimatePresence>
          {notHeard && <p className={styles.warn}>{t("tasmia.notHeard")}</p>}
          {speechError && <p className={styles.warn}>{t(`tasmia.err.${speechError}` as DictKey)}</p>}
          <div className={styles.row}>
            <button className="btn-ghost" onClick={() => setExtraHints((h) => h + 1)} disabled={shown >= words.length}>
              <Lightbulb size={15} /> {t("tasmia.hint")}
            </button>
            <button className="btn-ghost" onClick={() => onNext({ item, accuracy: 0, passed: false, points: 0, skipped: true })}>
              <SkipForward size={15} /> {t("tasmia.skip")}
            </button>
          </div>
        </div>
      ) : (
        <motion.div className={styles.result} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <ProgressRing value={accuracy} size={96} stroke={7} color={tier === "fail" ? "#ff8a7a" : tier === "pass" ? "#ecd08a" : "#5fd3a0"}>
            <strong className={styles.pct}>{accuracy}%</strong>
          </ProgressRing>
          <div className={styles.resultTxt}>
            <h4 className={styles[`tier_${tier}`]}>{t(`tasmia.score.${tier}` as DictKey)}</h4>
            <p>{t("tasmia.mistakes", { n: result?.mistakes ?? 0 })}</p>
            {attempt > 1 ? (
              <p className={styles.muted}>{t("tasmia.practice")}</p>
            ) : saved ? (
              <p className={styles.muted}>
                <Sparkles size={13} /> +{saved.points} · {t("tasmia.nextReview", { n: saved.intervalDays })}
              </p>
            ) : null}
            <div className={styles.legend}>
              {(["ok", "close", "wrong", "missed"] as WordStatus[]).map((s) => (
                <span key={s}><i className={styles[`dot_${s}`]} /> {t(`tasmia.legend.${s}` as DictKey)}</span>
              ))}
            </div>
          </div>
          <div className={styles.actions}>
            <button className="btn-ghost" onClick={audio.toggle}><Volume2 size={15} /> {t("tasmia.listen")}</button>
            <button className="btn-ghost" onClick={retry}><RotateCcw size={15} /> {t("tasmia.retry")}</button>
            <button className="btn-gold" onClick={() => onNext({
              item, accuracy: firstScore ?? accuracy, passed: (firstScore ?? accuracy) >= pass, points: saved?.points ?? 0,
            })}>
              {isLast ? <Check size={16} /> : <ArrowRight size={16} className={styles.flip} />} {isLast ? t("tasmia.finish") : t("tasmia.next")}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

/* ===================== Mode auto-évaluation ===================== */

const SelfItem = ({ item, verse, reciter, onNext }: {
  item: TasmiaItem; verse: Verse; reciter: string; onNext: (o: Outcome) => void;
}) => {
  const { t } = useI18n();
  const { refreshMe } = useMe();
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const audio = useAyahAudio(ayahAudioUrl(item.surah, item.ayah, reciter));
  const words = ayahWords(verse.text);

  const rate = async (q: number) => {
    setBusy(true);
    let points = 0;
    try { points = (await hifdService.review(item.surah, item.ayah, q)).points; refreshMe(); } catch { /* continue */ }
    setBusy(false);
    const accuracy = [0, 40, 60, 75, 90, 100][q];
    onNext({ item, accuracy, passed: q >= 3, points });
  };

  return (
    <div className={styles.item}>
      <AyahHeader item={item} />
      <motion.div className={styles.stage} initial={{ rotateY: -60, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
        <p className={`quran-text ${styles.words}`} dir="rtl">
          {words.map((w, i) => (
            <span key={i} className={`${styles.w} ${revealed || i < 2 ? styles.ok : styles.masked}`}>{w}</span>
          ))}
        </p>
        {revealed && verse.translation && <p className={styles.trans}>{verse.translation}</p>}
      </motion.div>
      {!revealed ? (
        <div className={styles.row}>
          <button className="btn-gold" onClick={() => setRevealed(true)}><Eye size={16} /> {t("review.reveal")}</button>
          <button className="btn-ghost" onClick={audio.toggle}><Volume2 size={15} /> {t("tasmia.listen")}</button>
        </div>
      ) : (
        <div className={styles.rates}>
          {QUALITIES.map((x) => (
            <button key={x.q} disabled={busy} onClick={() => rate(x.q)} style={{ ["--tone" as string]: x.tone }} className={styles.rate}>
              {t(x.key as DictKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================ Résumé ============================ */

const Summary = ({ outcomes, pass, onClose }: { outcomes: Outcome[]; pass: number; onClose: () => void }) => {
  const { t, surahName } = useI18n();
  const done = outcomes.filter((o) => !o.skipped);
  const avg = done.length ? Math.round(done.reduce((s, o) => s + o.accuracy, 0) / done.length) : 0;
  const points = outcomes.reduce((s, o) => s + o.points, 0);
  const passed = done.filter((o) => o.passed).length;

  return (
    <motion.div className={styles.summary} initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
      <span className={`quran-text ${styles.blessing}`}>بَارَكَ ٱللَّهُ فِيكَ</span>
      <div className={styles.sumStats}>
        <ProgressRing value={avg} size={110} stroke={8} color={avg >= pass ? "#5fd3a0" : "#ecd08a"}>
          <strong className={styles.pct}>{avg}%</strong>
        </ProgressRing>
        <div>
          <p><strong>{passed}/{done.length}</strong> {t("tasmia.summary.passed")}</p>
          <p><Sparkles size={14} /> <strong>+{points}</strong> {t("common.points")}</p>
        </div>
      </div>
      <ul className={styles.sumList}>
        {outcomes.map((o) => (
          <li key={keyOf(o.item)}>
            <span>{surahName(getSurah(o.item.surah))} · {o.item.ayah}</span>
            <span className={o.skipped ? styles.muted : o.passed ? styles.tier_excellent : styles.tier_fail}>
              {o.skipped ? "—" : `${o.accuracy}%`}
            </span>
          </li>
        ))}
      </ul>
      <button className="btn-gold" onClick={onClose}>{t("common.close")}</button>
    </motion.div>
  );
};