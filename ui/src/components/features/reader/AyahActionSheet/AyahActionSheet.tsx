"use client";

// "Ayah Studio": kolchi li t9der dir b aya wa7da — Hifd, checkpoint, tilawa (tikrar + vitesse + 9ari2),
// tafasir (ktar mn wa7ed), traductions, mot à mot (b sawt kol kelma), tasmi3, khatira, partage (image), favoris.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain, Bookmark, Play, Pause, X, Loader2, Undo2, BookOpenText, PenLine, ListMusic, Mic, FileText,
  Heart, Copy, Languages, Type, Share2, Gauge, Repeat1, Plus, Search, Infinity as InfinityIcon, Square, Headphones,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { DictKey } from "@/i18n/dictionaries";
import { useToast } from "@/components/common/Toast/Toast";
import { NourLoader } from "@/components/common/NourLoader/NourLoader";
import { getSurah, juzOf } from "@/lib/quran";
import { pageOf } from "@/lib/mushafPages";
import { isSajda, quarterOf } from "@/lib/quranMeta";
import { HL_COLORS, useFavorites, useHighlights } from "@/lib/readerPrefs";
import { useLocalState } from "@/lib/localStore";
import {
  ayahAudioUrl, AyahEdition, DEFAULT_TAFSIR, Edition, fetchAyahEditions, fetchEditions, fetchTafsir, fetchWords, Verse, AyahWords,
} from "@/services/quran/quranText";
import { PlayerMode, WordPlayer } from "@/lib/wordPlayer";
import { ReciterPicker } from "../ReciterPicker/ReciterPicker";
import { AyahShare } from "../AyahShare/AyahShare";
import styles from "./AyahActionSheet.module.css";

type Busy = "hifd" | "checkpoint" | "khatira" | null;
type Panel = "tafsir" | "translations" | "words" | "tasmia" | "khatira" | "share";

interface Props {
  surah: number;
  verse: Verse | null;
  isCheckpoint: boolean;
  pointsIfCheckpoint: number;     // 0 = rje3 l-lor
  accent: string;
  busy: Busy;
  reciter: string;
  onReciterChange: (id: string) => void;
  onHifd: () => void;
  onCheckpoint: () => void;
  onSaveKhatira: (content: string) => Promise<boolean>;
  onPlayFrom: (ayah: number) => void;
  onTasmia: (scope: "ayah" | "page") => void;   // Tasmi3 b s-sawt (had l-aya / hta l-akhir dyal la page)
  pageEnd: number;
  onClose: () => void;
}

const QUARTER_GLYPH = ["", "¼", "½", "¾"];

export const AyahActionSheet = (props: Props) => {
  const { verse, surah, accent, onClose } = props;
  const { t } = useI18n();

  // Esc kaysedd
  useEffect(() => {
    if (!verse) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [verse, onClose]);

  return (
    <AnimatePresence>
      {verse && (
        <motion.aside
          key="sheet"
          className={styles.sheet}
          style={{ ["--acc" as string]: accent }}
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
          role="dialog"
          aria-label={t("sheet.question")}
        >
          {/* key: state jdid l kol aya (bla reset f effects) */}
          <Studio key={`${surah}:${verse.id}`} {...props} verse={verse} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

/* ============================================================== */

const Studio = ({
  surah, verse, isCheckpoint, pointsIfCheckpoint, busy, reciter, onReciterChange,
  onHifd, onCheckpoint, onSaveKhatira, onPlayFrom, onTasmia, pageEnd, onClose,
}: Props & { verse: Verse }) => {
  const { t, lang, surahName } = useI18n();
  const toast = useToast();
  const fav = useFavorites();
  const meta = getSurah(surah);
  const [panel, setPanel] = useState<Panel | null>(null);
  const isFav = fav.has(surah, verse.id);
  const hl = useHighlights();
  const hlNow = hl.get(surah, verse.id);

  const q = quarterOf(surah, verse.id);
  const chips = [
    `${t("common.juz")} ${juzOf(surah, verse.id)}`,
    `${t("studio.hizb")} ${q.hizb}${q.quarter ? ` ${QUARTER_GLYPH[q.quarter]}` : ""}`,
    `${t("reader.page")} ${pageOf(surah, verse.id)}`,
    t(`common.${meta.type}` as DictKey),
  ];
  const sajda = isSajda(surah, verse.id);

  const copy = async () => {
    const txt = `${verse.text}\n\n${verse.translation ? `${verse.translation}\n\n` : ""}— ${surahName(meta)} ${surah}:${verse.id}`;
    try { await navigator.clipboard.writeText(txt); toast(t("common.copied")); } catch { /* bloqué */ }
  };

  const toggleFav = () => {
    fav.toggle(surah, verse.id);
    toast(isFav ? t("studio.unfav") : t("studio.fav"));
  };

  const goingBack = pointsIfCheckpoint <= 0 && !isCheckpoint;

  const TABS: { id: Panel; icon: React.ElementType; label: string }[] = [
    { id: "tafsir", icon: BookOpenText, label: t("studio.tafsir") },
    { id: "translations", icon: Languages, label: t("studio.translations") },
    { id: "words", icon: Type, label: t("studio.words") },
    { id: "tasmia", icon: Mic, label: t("sheet.tasmia") },
    { id: "khatira", icon: PenLine, label: t("sheet.khatira") },
    { id: "share", icon: Share2, label: t("studio.share") },
  ];

  return (
    <>
      <div className={styles.grab} />
      <header className={styles.head}>
        <div className={styles.headTxt}>
          <span className={styles.kicker}>{t("sheet.selected", { surah: surahName(meta), ayah: verse.id })}</span>
          <div className={styles.chips}>
            {chips.map((c) => <span key={c}>{c}</span>)}
            {sajda && <span className={styles.sajda}>۩ {t("studio.sajda")}</span>}
          </div>
          <div className={styles.hlRow} role="group" aria-label={t("reader.highlight")}>
            <small>{t("reader.highlight")}</small>
            {HL_COLORS.map((c) => (
              <button key={c} data-c={c} className={`${styles.hl} ${hlNow === c ? styles.hlOn : ""}`} aria-pressed={hlNow === c}
                aria-label={`${t("reader.highlight")} ${c}`} onClick={() => hl.set(surah, verse.id, hlNow === c ? null : c)} />
            ))}
          </div>
        </div>
        <div className={styles.headBtns}>
          <motion.button whileTap={{ scale: 0.8 }} className={`icon-btn ${isFav ? styles.favOn : ""}`} onClick={toggleFav}
            title={t("studio.favorite")} aria-label={t("studio.favorite")} aria-pressed={isFav}>
            <Heart size={17} fill={isFav ? "currentColor" : "none"} />
          </motion.button>
          <button className="icon-btn" onClick={copy} title={t("common.copy")} aria-label={t("common.copy")}><Copy size={16} /></button>
          <button className="icon-btn" onClick={onClose} aria-label={t("common.close")}><X size={17} /></button>
        </div>
      </header>

      <div className={styles.previewWrap}>
        <p className={`quran-text ${styles.preview}`}>{verse.text}</p>
        {verse.translation && <p className={styles.previewTrans}>{verse.translation}</p>}
      </div>

      <AudioBar surah={surah} ayah={verse.id} reciter={reciter} onReciterChange={onReciterChange} onPlayFrom={onPlayFrom} />

      <div className={styles.choices}>
        <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} className={`${styles.choice} ${styles.hifd}`}
          onClick={onHifd} disabled={busy !== null}>
          <span className={styles.icon}>{busy === "hifd" ? <Loader2 className={styles.spin} /> : <Brain />}</span>
          <span className={styles.txt}>
            <strong>{t("sheet.hifd")}</strong>
            <small>{t("sheet.hifd.desc", { ayah: verse.id, surah: surahName(meta) })}</small>
          </span>
          <span className={styles.range} dir="ltr">1 → {verse.id}</span>
        </motion.button>

        <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} className={`${styles.choice} ${styles.check}`}
          onClick={onCheckpoint} disabled={busy !== null || isCheckpoint}>
          <span className={styles.icon}>
            {busy === "checkpoint" ? <Loader2 className={styles.spin} /> : goingBack ? <Undo2 /> : <Bookmark />}
          </span>
          <span className={styles.txt}>
            <strong>{isCheckpoint ? t("sheet.isCheckpoint") : t("sheet.checkpoint")}</strong>
            {!isCheckpoint && (
              <small>{goingBack ? t("sheet.checkpoint.back") : t("sheet.checkpoint.desc", { points: pointsIfCheckpoint })}</small>
            )}
          </span>
          {!isCheckpoint && !goingBack && <span className={styles.range}>+{pointsIfCheckpoint}</span>}
        </motion.button>
      </div>

      <div className={styles.tabs} role="tablist">
        {TABS.map((tb) => (
          <button key={tb.id} role="tab" aria-selected={panel === tb.id}
            className={`${styles.tab} ${panel === tb.id ? styles.tabOn : ""}`}
            onClick={() => setPanel(panel === tb.id ? null : tb.id)}>
            {panel === tb.id && <motion.span layoutId="studioTab" className={styles.tabPill} transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
            <span className={styles.tabInner}><tb.icon size={15} /> {tb.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {panel && (
          <motion.div key={panel} className={styles.panel}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <div className={styles.panelInner}>
              {panel === "tafsir" && <TafsirPanel surah={surah} ayah={verse.id} />}
              {panel === "translations" && <TranslationsPanel surah={surah} ayah={verse.id} />}
              {panel === "words" && <WordsPanel surah={surah} ayah={verse.id} />}
              {panel === "tasmia" && (
                <>
                  <small className={styles.muted}>{t("sheet.tasmia.desc")}</small>
                  <div className={styles.rowBtns}>
                    <button className="btn-gold" onClick={() => onTasmia("ayah")}><Mic size={16} /> {t("sheet.tasmia.ayah")}</button>
                    {pageEnd > verse.id && (
                      <button className="btn-ghost" onClick={() => onTasmia("page")}>
                        <FileText size={16} /> {t("sheet.tasmia.page", { n: pageEnd - verse.id + 1 })}
                      </button>
                    )}
                  </div>
                </>
              )}
              {panel === "khatira" && <KhatiraPanel busy={busy === "khatira"} onSave={onSaveKhatira} onDone={() => setPanel(null)} />}
              {panel === "share" && <AyahShare surah={surah} verse={verse} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {lang !== "ar" && !panel && <p className={styles.tip}>{t("studio.tip")}</p>}
    </>
  );
};

/* ============================ Audio ============================ */

const REPEATS = [1, 3, 5, 10, 0]; // 0 = ∞
const SPEEDS = [0.75, 1, 1.25, 1.5];

const AudioBar = ({ surah, ayah, reciter, onReciterChange, onPlayFrom }: {
  surah: number; ayah: number; reciter: string; onReciterChange: (id: string) => void; onPlayFrom: (a: number) => void;
}) => {
  const { t } = useI18n();
  const audio = useRef<HTMLAudioElement | null>(null);
  const left = useRef(1);
  const [playing, setPlaying] = useState(false);
  const [repeat, setRepeat] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [count, setCount] = useState(0);

  useEffect(() => () => audio.current?.pause(), []);

  const toggle = () => {
    if (!audio.current) {
      const a = new Audio();
      a.onended = () => {
        setCount((c) => c + 1);
        // Tikrar (0 = bla nihaya)
        if (left.current === 0 || left.current > 1) {
          if (left.current > 1) left.current -= 1;
          a.currentTime = 0;
          a.play().catch(() => setPlaying(false));
        } else setPlaying(false);
      };
      audio.current = a;
    }
    const a = audio.current;
    if (playing) { a.pause(); setPlaying(false); return; }
    const src = ayahAudioUrl(surah, ayah, reciter);
    if (a.src !== src) a.src = src;
    a.playbackRate = speed;
    left.current = repeat;
    setCount(0);
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  const pickRepeat = (r: number) => { setRepeat(r); left.current = r; };
  const pickSpeed = (s: number) => { setSpeed(s); if (audio.current) audio.current.playbackRate = s; };
  const changeReciter = (id: string) => {
    onReciterChange(id);
    audio.current?.pause();
    setPlaying(false);
  };

  return (
    <div className={styles.audio}>
      <button className={`${styles.play} ${playing ? styles.playOn : ""}`} onClick={toggle} aria-label={playing ? t("audio.pause") : t("audio.play")}>
        {playing ? <Pause size={18} /> : <Play size={18} />}
        {playing && <span className={styles.eq} aria-hidden><i /><i /><i /></span>}
      </button>
      <div className={styles.audioMid}>
        <div className={styles.seg} title={t("audio.repeat")}>
          <Repeat1 size={13} />
          {REPEATS.map((r) => (
            <button key={r} className={repeat === r ? styles.segOn : ""} onClick={() => pickRepeat(r)}>
              {r === 0 ? <InfinityIcon size={13} /> : `${r}×`}
            </button>
          ))}
        </div>
        <div className={styles.seg} title={t("audio.speed")}>
          <Gauge size={13} />
          {SPEEDS.map((s) => (
            <button key={s} className={speed === s ? styles.segOn : ""} onClick={() => pickSpeed(s)}>{s}</button>
          ))}
        </div>
        {playing && repeat !== 1 && <span className={styles.counter}>{count + 1}{repeat ? `/${repeat}` : ""}</span>}
      </div>
      <div className={styles.audioEnd}>
        <ReciterPicker value={reciter} onChange={changeReciter} />
        <button className="icon-btn" onClick={() => onPlayFrom(ayah)} title={t("audio.from")} aria-label={t("audio.from")}>
          <ListMusic size={16} />
        </button>
      </div>
    </div>
  );
};

/* ============================ Tafsir ============================ */

const dirOf = (e?: Edition) => (e?.direction === "rtl" || e?.language === "ar" || e?.language === "ur" || e?.language === "fa" ? "rtl" : "ltr");

const TafsirPanel = ({ surah, ayah }: { surah: number; ayah: number }) => {
  const { t } = useI18n();
  const [edition, setEdition] = useLocalState<string>("ltd.tafsir", DEFAULT_TAFSIR);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [res, setRes] = useState<{ key: string; text: string | null } | null>(null);
  const key = `${surah}:${ayah}:${edition}`;

  useEffect(() => {
    let alive = true;
    fetchEditions("tafsir").then((l) => alive && setEditions(l)).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    fetchTafsir(surah, edition)
      .then((m) => alive && setRes({ key, text: m[ayah] ?? null }))
      .catch(() => alive && setRes({ key, text: null }));
    return () => { alive = false; };
  }, [surah, ayah, edition, key]);

  const current = editions.find((e) => e.identifier === edition);
  const dir = dirOf(current ?? ({ language: edition.slice(0, 2) } as Edition));
  const ready = res?.key === key;

  return (
    <>
      <div className={styles.panelHead}>
        <BookOpenText size={15} />
        <select className={styles.select} value={edition} onChange={(e) => setEdition(e.target.value)} aria-label={t("studio.tafsir")}>
          {!editions.some((e) => e.identifier === edition) && <option value={edition}>{edition}</option>}
          {editions.map((e) => (
            <option key={e.identifier} value={e.identifier}>{e.name} · {e.language.toUpperCase()}</option>
          ))}
        </select>
      </div>
      {!ready ? (
        <NourLoader size="sm" label={t("sheet.tafsirLoading").replace("…", "")} />
      ) : res.text ? (
        <p className={`${styles.reading} ${dir === "rtl" ? styles.readingAr : ""}`} dir={dir}>{res.text}</p>
      ) : (
        <p className={styles.muted}>{t("sheet.tafsirError")}</p>
      )}
    </>
  );
};

/* ============================ Traductions ============================ */

const defaultTranslations = (lang: string) =>
  lang === "fr" ? ["fr.hamidullah", "en.sahih"] : lang === "en" ? ["en.sahih", "en.pickthall"] : ["en.sahih", "fr.hamidullah"];

const TranslationsPanel = ({ surah, ayah }: { surah: number; ayah: number }) => {
  const { t, lang } = useI18n();
  const [selected, setSelected] = useLocalState<string[]>("ltd.translations", defaultTranslations(lang));
  const [all, setAll] = useState<Edition[]>([]);
  const [data, setData] = useState<{ key: string; list: AyahEdition[] | null } | null>(null);
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const key = `${surah}:${ayah}:${selected.join(",")}`;

  useEffect(() => {
    let alive = true;
    fetchEditions("translation").then((l) => alive && setAll(l)).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!selected.length) return;
    let alive = true;
    fetchAyahEditions(surah, ayah, selected)
      .then((list) => alive && setData({ key, list }))
      .catch(() => alive && setData({ key, list: null }));
    return () => { alive = false; };
  }, [surah, ayah, selected, key]);

  const options = useMemo(() => {
    const s = q.trim().toLowerCase();
    return all.filter((e) => !selected.includes(e.identifier))
      .filter((e) => !s || e.englishName.toLowerCase().includes(s) || e.name.toLowerCase().includes(s) || e.language.includes(s))
      .slice(0, 40);
  }, [all, selected, q]);

  const remove = (id: string) => setSelected((l) => l.filter((x) => x !== id));
  const add = (id: string) => { setSelected((l) => [...l, id].slice(0, 6)); setAdding(false); setQ(""); };
  const ready = data?.key === key;

  return (
    <>
      <div className={styles.transChips}>
        {selected.map((id) => (
          <span key={id} className={styles.tChip}>
            {all.find((e) => e.identifier === id)?.englishName ?? id}
            <button onClick={() => remove(id)} aria-label="×"><X size={12} /></button>
          </span>
        ))}
        {selected.length < 6 && (
          <button className={styles.addChip} onClick={() => setAdding((v) => !v)}><Plus size={13} /> {t("studio.addTranslation")}</button>
        )}
      </div>
      <AnimatePresence>
        {adding && (
          <motion.div className={styles.adder} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <label className={styles.searchMini}><Search size={14} /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("studio.searchLang")} /></label>
            <ul className={styles.adderList}>
              {options.map((e) => (
                <li key={e.identifier}><button onClick={() => add(e.identifier)}>
                  <span className={styles.langTag}>{e.language}</span> {e.englishName} <small>{e.name}</small>
                </button></li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      {!selected.length ? null : !ready ? (
        <NourLoader size="sm" label={t("common.loadingShort")} />
      ) : !data.list ? (
        <p className={styles.muted}>{t("common.error")}</p>
      ) : (
        <div className={styles.transList}>
          {data.list.map((d, i) => (
            <motion.article key={d.edition.identifier} className={styles.transCard}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <header><span className={styles.langTag}>{d.edition.language}</span> {d.edition.englishName}</header>
              <p dir={dirOf(d.edition)} className={dirOf(d.edition) === "rtl" ? styles.readingAr : ""}>{d.text}</p>
            </motion.article>
          ))}
        </div>
      )}
    </>
  );
};

/* ============================ Mot à mot ============================ */

const WORD_REPEATS = [1, 2, 3];
const WORD_SPEEDS = [0.75, 1, 1.25];

const WordsPanel = ({ surah, ayah }: { surah: number; ayah: number }) => {
  const { t, lang } = useI18n();
  const [data, setData] = useState<AyahWords | null | undefined>(undefined);
  const [active, setActive] = useState<number | null>(null);
  const [mode, setMode] = useState<PlayerMode>("idle");
  const [progress, setProgress] = useState(0);
  const [fallback, setFallback] = useState<number[]>([]);
  const [repeat, setRepeat] = useState(1);
  const [speed, setSpeed] = useState(1);
  const player = useRef<WordPlayer | null>(null);

  useEffect(() => {
    let alive = true;
    fetchWords(surah, ayah, lang)
      .then((d) => {
        if (!alive) return;
        // Lecteur jdid l kol aya (préchargement dyal ga3 l-kelmat)
        const p = new WordPlayer(d, {
          onActive: (i) => alive && setActive(i),
          onMode: (m) => alive && setMode(m),
          onProgress: (r) => alive && setProgress(r),
          onFallback: (i) => alive && setFallback((l) => (l.includes(i) ? l : [...l, i])),
        });
        p.preload();
        player.current = p;
        setData(d);
      })
      .catch(() => alive && setData(null));
    return () => { alive = false; player.current?.destroy(); player.current = null; };
  }, [surah, ayah, lang]);

  if (data === undefined) return <NourLoader size="sm" label={t("common.loadingShort")} />;
  if (!data || !data.words.length) return <p className={styles.muted}>{t("studio.wordsError")}</p>;

  const hasSync = !!data.verseAudio && data.segments.length > 0;
  const playing = mode !== "idle";

  return (
    <>
      <div className={styles.panelHead}>
        <small className={styles.muted}>{t("studio.wordsHint")}</small>
        <div className={styles.wordBtns}>
          {playing ? (
            <button className="btn-gold" onClick={() => player.current?.stop()}><Square size={13} /> {t("studio.stop")}</button>
          ) : (
            <>
              <button className="btn-ghost" onClick={() => player.current?.playAll(0, repeat, speed)}><Play size={14} /> {t("studio.playWords")}</button>
              {hasSync && (
                <button className="btn-gold" onClick={() => player.current?.playSync(speed)}><Headphones size={14} /> {t("studio.syncPlay")}</button>
              )}
            </>
          )}
        </div>
      </div>

      <div className={styles.wordOpts}>
        <div className={styles.seg} title={t("studio.wordRepeat")}>
          <Repeat1 size={13} />
          {WORD_REPEATS.map((r) => (
            <button key={r} className={repeat === r ? styles.segOn : ""} onClick={() => setRepeat(r)}>{r}×</button>
          ))}
        </div>
        <div className={styles.seg} title={t("audio.speed")}>
          <Gauge size={13} />
          {WORD_SPEEDS.map((v) => (
            <button key={v} className={speed === v ? styles.segOn : ""} onClick={() => setSpeed(v)}>{v}</button>
          ))}
        </div>
      </div>

      {playing && <div className={styles.wordBar}><i style={{ width: `${progress * 100}%` }} /></div>}

      <div className={styles.words} dir="rtl">
        {data.words.map((w, i) => {
          const past = playing && active !== null && i < active;
          return (
            <motion.button key={`${w.position}-${i}`}
              className={`${styles.word} ${active === i ? styles.wordOn : ""} ${past ? styles.wordPast : ""}`}
              onClick={() => player.current?.playOne(i, speed)}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: active === i ? 1.06 : 1 }}
              transition={{ delay: active === null ? Math.min(i, 20) * 0.02 : 0, type: "spring", stiffness: 400, damping: 26 }}>
              <span className={styles.wNum}>{w.position}</span>
              {fallback.includes(i) && <span className={styles.wFallback} title={t("studio.audioFallback")} />}
              <span className={`quran-text ${styles.wAr}`}>{w.text}</span>
              {w.transliteration && <small className={styles.wTr} dir="ltr">{w.transliteration}</small>}
              <small className={styles.wMean} dir="ltr">{w.translation}</small>
            </motion.button>
          );
        })}
      </div>
    </>
  );
};

/* ============================ Khatira ============================ */

const KhatiraPanel = ({ busy, onSave, onDone }: { busy: boolean; onSave: (c: string) => Promise<boolean>; onDone: () => void }) => {
  const { t } = useI18n();
  const [draft, setDraft] = useState("");
  const save = async () => {
    if (!draft.trim()) return;
    if (await onSave(draft.trim())) { setDraft(""); onDone(); }
  };
  return (
    <>
      <small className={styles.muted}>{t("sheet.khatira.desc")}</small>
      <textarea className={styles.textarea} value={draft} maxLength={2000} autoFocus
        placeholder={t("sheet.khatira.ph")} onChange={(e) => setDraft(e.target.value)} />
      <div className={styles.rowBtns}>
        <small className={styles.muted}>{draft.length}/2000</small>
        <button className="btn-gold" onClick={save} disabled={!draft.trim() || busy}>
          {busy ? <Loader2 size={16} className={styles.spin} /> : <PenLine size={16} />} {t("sheet.khatira.save")}
        </button>
      </div>
    </>
  );
};