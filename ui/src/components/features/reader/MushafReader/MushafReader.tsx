"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, PanInfo, Variants } from "framer-motion";
import {
  ArrowLeft, Bookmark, ChevronLeft, ChevronRight, List, Search, Share2, Activity as ActivityIcon,
  X, Check, Crown, Headphones, Mic, Maximize2, Minimize2, ChevronsDown, Compass, Heart, Timer, Highlighter, History, Target, EyeOff,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { DictKey } from "@/i18n/dictionaries";
import { useMe } from "@/components/layout/AppShell/AppShell";
import { useToast } from "@/components/common/Toast/Toast";
import { useCelebrate } from "@/components/common/Celebration/Celebration";
import { PageLoader } from "@/components/common/NourLoader/NourLoader";
import { Activity, Khatma, hifdService, khatmaService, khawatirService } from "@/services/api/khatmaService";
import {
  Chapter, DEFAULT_RECITER, fetchChapter, fetchTajweed, normalizeReciter, TajweedSeg, Verse,
} from "@/services/quran/quranText";
import { SURAHS, getSurah, globalIndex, juzOf, juzStart, khatmaProgress, toArabicDigits } from "@/lib/quran";
import { pageOf, pagesOfSurah, pageStart, SurahPage, TOTAL_PAGES } from "@/lib/mushafPages";
import { isSajda, quarterStart } from "@/lib/quranMeta";
import { MUSHAF_FONTS, PageFlip, useFavorites, useHighlights, useReaderPrefs } from "@/lib/readerPrefs";
import { useLocalState } from "@/lib/localStore";
import { useToday } from "@/lib/adhkarStore";
import { timesForDate } from "@/lib/prayerTimes";
import { toPrayerInput, useSalatSettings } from "@/lib/salatStore";
import { useReadingLog } from "@/lib/readingLog";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { TasmiaModal } from "@/components/features/hifd/TasmiaModal/TasmiaModal";
import { TasmiaItem } from "@/components/features/hifd/TasmiaSession/TasmiaSession";
import { getTemplate } from "@/lib/templates";
import { ShareKhatmaModal } from "@/components/features/khatma/KhatmaModals/KhatmaModals";
import { AyahActionSheet } from "../AyahActionSheet/AyahActionSheet";
import { RecitationDock, RecitationHandle } from "../RecitationDock/RecitationDock";
import { ReaderSettings } from "../ReaderSettings/ReaderSettings";
import { AyahMarker, CornerOrnament, SurahBanner } from "../Ornaments/Ornaments";
import styles from "./MushafReader.module.css";

type Mode = "mushaf" | "translation";
const RECITER_KEY = "ltd.reciter";
const POINTS_PER_AYAH = 5;
const EASE = [0.22, 1, 0.36, 1] as const;
const QUARTER_GLYPH = ["", "¼", "½", "¾"];

/** Index dyal la page (f s-sourate) li fiha l-aya */
const pageIdxOf = (surah: number, ayah: number) => {
  const i = pagesOfSurah(surah).findIndex((p) => ayah >= p.from && ayah <= p.to);
  return Math.max(0, i);
};

/** Double page: (impaire = limn, paire = lisr) b7al l-mushaf l-madani */
const pairOf = (pages: SurahPage[], idx: number): number[] => {
  const p = pages[idx]?.page ?? 1;
  const odd = p % 2 === 1 ? p : p - 1;
  return [odd, odd + 1].map((n) => pages.findIndex((x) => x.page === n)).filter((i) => i >= 0);
};

// Teqlab dyal la page (dir = 1 -> page jaya, -1 -> li fatt). Bla filter blur: kan kay-tiyye7 l-fps f kol teqlab.
const FLIP_VARIANTS: Record<PageFlip, Variants> = {
  book: {
    enter: (dir: number) => ({ opacity: 0, rotateY: dir * 62, originX: dir > 0 ? 0 : 1, x: dir * -40 }),
    center: { opacity: 1, rotateY: 0, x: 0, transition: { duration: 0.8, ease: EASE } },
    exit: (dir: number) => ({ opacity: 0, rotateY: dir * -62, originX: dir > 0 ? 1 : 0, x: dir * 40, transition: { duration: 0.4, ease: EASE } }),
  },
  slide: {
    enter: (dir: number) => ({ opacity: 0, x: dir * -90 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } },
    exit: (dir: number) => ({ opacity: 0, x: dir * 90, transition: { duration: 0.26, ease: EASE } }),
  },
  fade: {
    enter: { opacity: 0 },
    center: { opacity: 1, transition: { duration: 0.45 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  },
  none: {
    enter: { opacity: 1 },
    center: { opacity: 1, transition: { duration: 0 } },
    exit: { opacity: 1, transition: { duration: 0 } },
  },
};

/** La page fin kaybda kol juz2 (l-3alamat dyal l-scrubber) */
const JUZ_PAGES = Array.from({ length: 30 }, (_, i) => { const s = juzStart(i + 1); return pageOf(s.surah, s.ayah); });
const NO_POS: Record<string, { surah: number; ayah: number }> = {};
const NO_REVEAL = new Set<number>();

/** Bach l-ba7t f l-ayat ykhdem bla tachkil */
const stripAr = (x: string) => x
  .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
  .replace(/[ٱأإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");

/** Sawt khfif dyal wr9a kat-tqleb (bruit filtré, WebAudio) */
const paperSound = () => {
  try {
    const ctx = new AudioContext();
    const len = Math.floor(ctx.sampleRate * 0.22);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass"; filter.frequency.value = 2600; filter.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.value = 0.16;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
    setTimeout(() => ctx.close(), 500);
  } catch { /* audio bloqué */ }
};

/** Wach daba lil (mn l-maghrib l l-fajr) 7sab les réglages dyal s-salat */
const isNightNow = (inputJson: string) => {
  try {
    const tt = timesForDate(new Date(), JSON.parse(inputJson) as ReturnType<typeof toPrayerInput>);
    const n = Date.now();
    return !!tt.maghrib && !!tt.fajr && (n >= tt.maghrib.getTime() || n < tt.fajr.getTime());
  } catch { return false; }
};

const fmtTime = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

/** Chrono dyal s-session (component sghir bo7do: bach l-mushaf kaml ma y-re-renderich kol tanya) */
const SessionChip = ({ pages, onTick }: { pages: number; onTick: (seconds: number) => void }) => {
  const { t } = useI18n();
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) setSec((x) => x + 1); }, 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { if (sec > 0 && sec % 15 === 0) onTick(15); }, [sec, onTick]);
  return <span className={styles.session}><Timer size={14} /> {t("reader.session", { time: fmtTime(sec), pages })}</span>;
};

export const MushafReader = ({ khatmaId }: { khatmaId: string }) => {
  const { t, lang, surahName, surahMeaning } = useI18n();
  const { refreshMe } = useMe();
  const toast = useToast();
  const celebrate = useCelebrate();
  const [prefs, setPrefs, resetPrefs] = useReaderPrefs();
  const { add: addLog, log } = useReadingLog();
  const today = useToday();
  const highlights = useHighlights();
  // Akhir blassa (page) f had l-khatma: bach n-kemlou mn fin w9efna, 7ta ila l-checkpoint ma t7errekch
  const [, setPositions] = useLocalState<Record<string, { surah: number; ayah: number }>>("ltd.reader.pos", NO_POS);
  const [resume, setResume] = useState<{ surah: number; ayah: number } | null>(() => {
    try { return (JSON.parse(localStorage.getItem("ltd.reader.pos") ?? "{}") as typeof NO_POS)[khatmaId] ?? null; } catch { return null; }
  });
  // Mode mémorisation: l-ayat li t-kechfou f had la page
  const [revealed, setRevealed] = useState<{ key: string; ids: Set<number> }>({ key: "", ids: NO_REVEAL });
  const [scrub, setScrub] = useState<number | null>(null);
  // Thème "nuit" tilqa2i: kan-raj3ou l-we9t kol d9i9a
  const [salat] = useSalatSettings();
  const salatKey = JSON.stringify(toPrayerInput(salat));
  const [night, setNight] = useState(() => isNightNow(salatKey));
  useEffect(() => {
    const id = setInterval(() => setNight(isNightNow(salatKey)), 60_000);
    return () => clearInterval(id);
  }, [salatKey]);
  // L-écran ma kay-tfach ma dam l-mushaf m7loul (Wake Lock)
  useEffect(() => {
    if (!prefs.wakeLock || !("wakeLock" in navigator)) return;
    let alive = true;
    let lock: WakeLockSentinel | null = null;
    const request = () => navigator.wakeLock.request("screen").then((l) => { if (alive) lock = l; else l.release().catch(() => {}); }).catch(() => { /* mrfoud */ });
    const onVisible = () => { if (!document.hidden) request(); };
    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => { alive = false; document.removeEventListener("visibilitychange", onVisible); lock?.release().catch(() => {}); };
  }, [prefs.wakeLock]);
  const logSeconds = useCallback((seconds: number) => addLog({ seconds }), [addLog]);
  const favorites = useFavorites();
  const wide = useMediaQuery("(min-width: 1280px)");

  const [dir, setDir] = useState(1);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  // Position dyal akhir click (celebration) — state machi ref bach n9edro nst3mlouh f render
  const [lastClick, setLastClick] = useState<{ x: number; y: number } | null>(null);
  const dock = useRef<RecitationHandle>(null);

  const [khatma, setKhatma] = useState<Khatma | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [surah, setSurah] = useState<number | null>(null);
  // Pagination: la page (index f s-sourate) — b7al l-Mushaf l-Madani (604 page)
  const [pageIdx, setPageIdx] = useState(0);
  const [tasmia, setTasmia] = useState<{ items: TasmiaItem[]; title: string } | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [tajweed, setTajweed] = useState<{ surah: number; map: Record<number, TajweedSeg[]> } | null>(null);
  const [mode, setMode] = useState<Mode>("mushaf");
  const [focus, setFocus] = useState(false);
  const [selected, setSelected] = useState<Verse | null>(null);
  const [busy, setBusy] = useState<"hifd" | "checkpoint" | "khatira" | null>(null);
  // Tilawa: l-9ari2 (m7fouz f localStorage) w l-aya li kat-t9ra daba
  const [reciter, setReciter] = useState<string>(() => {
    try { return normalizeReciter(localStorage.getItem(RECITER_KEY)); } catch { return DEFAULT_RECITER; }
  });
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [query, setQuery] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [burst, setBurst] = useState<number | null>(null);
  const [drawerTab, setDrawerTab] = useState<"surahs" | "ayat" | "fav" | "marks">("surahs");
  const [ayahQuery, setAyahQuery] = useState("");
  const [gotoOpen, setGotoOpen] = useState(false);
  const [gotoPage, setGotoPage] = useState("");
  const [autoScroll, setAutoScroll] = useState(false);
  const [sessionPages, setSessionPages] = useState(0);
  const gotoBox = useRef<HTMLDivElement>(null);
  const pendingScroll = useRef<number | null>(null);

  const tpl = getTemplate(khatma?.template);

  // ---------- Chargement khatma + polling (bach l-partenaires ychoufo l-progress) ----------
  const loadActivity = useCallback(() => {
    khatmaService.activity(Number(khatmaId)).then(setActivity).catch(() => { /* ignore */ });
  }, [khatmaId]);

  useEffect(() => {
    let alive = true;
    // Awel chargement: n7elou s-sourate dyal l-checkpoint w nscrolliw l-aya
    khatmaService.get(khatmaId)
      .then((k) => {
        if (!alive) return;
        setKhatma(k);
        setSurah(k.currentSurah);
        setPageIdx(pageIdxOf(k.currentSurah, k.currentAyah));
        pendingScroll.current = k.currentAyah;
      })
      .catch(() => { if (alive) setNotFound(true); });
    loadActivity();
    // Polling: l-checkpoint dyal l-partenaires
    const id = setInterval(() => {
      khatmaService.get(khatmaId).then((k) => { if (alive) setKhatma(k); }).catch(() => {});
      loadActivity();
    }, 20000);
    return () => { alive = false; clearInterval(id); };
  }, [khatmaId, loadActivity]);

  // ---------- Text dyal s-sourate ----------
  useEffect(() => {
    if (!surah) return;
    let alive = true;
    fetchChapter(surah, lang)
      .then((c) => { if (alive) setChapter(c); })
      .catch(() => alive && toast(t("common.error"), "error"));
    return () => { alive = false; };
  }, [surah, lang, toast, t]);

  // ---------- Tajweed (ghir ila t-activa) ----------
  useEffect(() => {
    if (!surah || !prefs.tajweed) return;
    let alive = true;
    fetchTajweed(surah)
      .then((map) => { if (alive) setTajweed({ surah, map }); })
      .catch(() => alive && toast(t("reader.tajweedError"), "error"));
    return () => { alive = false; };
  }, [surah, prefs.tajweed, toast, t]);

  // Scroll l-aya (checkpoint) mli l-text yt-charja
  useEffect(() => {
    if (!chapter || pendingScroll.current == null) return;
    const ayah = pendingScroll.current;
    pendingScroll.current = null;
    requestAnimationFrame(() => {
      document.getElementById(`ayah-${ayah}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [chapter, mode, pageIdx]);

  // Mode focus: n-khebbiw l-header dyal l-app (class 3la body, kat-t7ayed f cleanup)
  useEffect(() => {
    document.body.classList.toggle("ltd-focus", focus);
    // Plein écran 7a9i9i m3a l-mode focus (ila l-navigateur sme7)
    if (focus) document.documentElement.requestFullscreen?.().catch(() => { /* bla plein écran */ });
    else if (document.fullscreenElement) document.exitFullscreen?.().catch(() => { /* ignore */ });
    return () => document.body.classList.remove("ltd-focus");
  }, [focus]);
  useEffect(() => {
    const onFs = () => { if (!document.fullscreenElement) setFocus(false); };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // F l-3arbiya ma kaynach traduction -> dima mode Mushaf
  const viewMode: Mode = lang === "ar" ? "mushaf" : mode;
  const spreadOn = prefs.spread && wide && viewMode === "mushaf";

  // ---------- Pages ----------
  const pages = useMemo(() => (surah ? pagesOfSurah(surah) : []), [surah]);
  const safeIdx = Math.min(pageIdx, Math.max(pages.length - 1, 0));
  const page = pages[safeIdx];
  const shown = spreadOn ? pairOf(pages, safeIdx) : [safeIdx];
  const versesOf = (p: SurahPage | undefined) =>
    chapter && p && chapter.id === surah ? chapter.verses.filter((v) => v.id >= p.from && v.id <= p.to) : [];
  const firstShownPage = pages[shown[0]] ?? page;
  const lastShownPage = pages[shown[shown.length - 1]] ?? page;

  // N-7efdou akhir page t7ellat (b l-aya l-wla dyalha)
  const pageFrom = page?.from;
  useEffect(() => {
    if (!surah || !pageFrom || !chapter) return;
    setPositions((p) => (p[khatmaId]?.surah === surah && p[khatmaId]?.ayah === pageFrom ? p : { ...p, [khatmaId]: { surah, ayah: pageFrom } }));
  }, [surah, pageFrom, chapter, khatmaId, setPositions]);

  // Wird dyal l-yawm: ch7al mn page khassek bach t-kemmel f l-ajal
  const wirdGoal = khatma ? Math.max(1, Math.ceil(TOTAL_PAGES / Math.max(1, khatma.targetDays))) : 0;
  const wirdDone = log[today]?.pages ?? 0;
  const revealKey = `${surah}-${safeIdx}`;
  const revealedIds = revealed.key === revealKey ? revealed.ids : NO_REVEAL;

  const turnPage = (delta: number) => {
    if (!surah) return;
    // F double page kan-tqelbo b 2
    const cur = spreadOn ? (delta > 0 ? Math.max(...shown) : Math.min(...shown)) : safeIdx;
    const target = cur + delta;
    setDir(delta > 0 ? 1 : -1);
    setSelected(null);
    if (prefs.flipSound) paperSound();
    if (delta > 0 && (target < pages.length || surah < 114)) {
      setSessionPages((n) => n + 1);
      addLog({ pages: 1 });
      if (wirdGoal > 0 && wirdDone + 1 === wirdGoal) { toast(t("reader.wird.done")); celebrate({}); }
    }
    if (target < 0) {
      // Page l-akhra dyal s-sourate li fatt
      if (surah > 1) { setSurah(surah - 1); setPageIdx(pagesOfSurah(surah - 1).length - 1); setPlayingAyah(null); }
    } else if (target >= pages.length) {
      if (surah < 114) { setSurah(surah + 1); setPageIdx(0); setPlayingAyah(null); }
    } else {
      setPageIdx(target);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Keyboard: ← / → pages, F focus, Esc, + − taille, T tajweed, B repère, S défilement auto, G aller à
  const turnRef = useRef(turnPage);
  const keysRef = useRef<(e: KeyboardEvent) => void>(() => {});
  const goCheckpointRef = useRef<() => void>(() => {});
  useEffect(() => {
    turnRef.current = turnPage;
    keysRef.current = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.closest?.("input, textarea, select, [role=dialog]")) return;
      const k = e.key.toLowerCase();
      if (e.key === "ArrowLeft") turnPage(lang === "ar" ? 1 : -1);
      else if (e.key === "ArrowRight") turnPage(lang === "ar" ? -1 : 1);
      else if (k === "f") setFocus((v) => !v);
      else if (e.key === "Escape") { setFocus(false); setAutoScroll(false); setGotoOpen(false); }
      else if (e.key === "+" || e.key === "=") setPrefs({ fontSize: Math.min(3.6, +(prefs.fontSize + 0.1).toFixed(1)) });
      else if (e.key === "-") setPrefs({ fontSize: Math.max(1.4, +(prefs.fontSize - 0.1).toFixed(1)) });
      else if (k === "t") setPrefs({ tajweed: !prefs.tajweed });
      else if (k === "s") setAutoScroll((v) => !v);
      else if (k === "h") setPrefs({ hide: prefs.hide === "off" ? "all" : prefs.hide === "all" ? "first" : "off" });
      else if (k === "g") { e.preventDefault(); setGotoOpen((v) => !v); }
      else if (k === "b") goCheckpointRef.current();
    };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keysRef.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Défilement auto: kay-hbet b chwiya; mli kaywsel l-ta7t kay-tsenna chwiya w kay-qleb la page
  const speedRef = useRef(prefs.autoSpeed);
  useEffect(() => { speedRef.current = prefs.autoSpeed; }, [prefs.autoSpeed]);
  useEffect(() => {
    if (!autoScroll) return;
    let raf = 0, last = performance.now(), acc = 0, wait = 0;
    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= max - 2) {
        wait += dt;
        if (wait > 1.6) { wait = 0; turnRef.current(1); }
        return;
      }
      wait = 0;
      acc += speedRef.current * dt;
      if (acc >= 1) { const px = Math.floor(acc); acc -= px; window.scrollBy({ top: px, behavior: "instant" }); }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [autoScroll]);

  // "Aller à": click barra -> ysedd
  useEffect(() => {
    if (!gotoOpen) return;
    const onDown = (e: MouseEvent) => { if (!gotoBox.current?.contains(e.target as Node)) setGotoOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [gotoOpen]);

  // Swipe (mobile): swipe l-limn = page jaya f l-mushaf
  const onPanEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) < 80 || Math.abs(info.offset.y) > Math.abs(info.offset.x)) return;
    turnPage(info.offset.x > 0 ? 1 : -1);
  };

  // L-aya li kat-t9ra: ila kharja 3la la page -> n-qelbo la page, w n-scrolliw liha
  const onRecitedAyah = (a: number | null) => {
    setPlayingAyah(a);
    if (!a || !surah) return;
    const i = pageIdxOf(surah, a);
    if (!shown.includes(i)) { setDir(i > safeIdx ? 1 : -1); setPageIdx(i); pendingScroll.current = a; }
    else document.getElementById(`ayah-${a}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const openTasmia = (scope: "ayah" | "page") => {
    if (!selected || !surah) return;
    const p = pages[pageIdxOf(surah, selected.id)];
    const to = scope === "ayah" || !p ? selected.id : p.to;
    const items = Array.from({ length: to - selected.id + 1 }, (_, i) => ({ surah, ayah: selected.id + i }));
    setTasmia({ items, title: `${t("tasmia.title")} · ${surahName(getSurah(surah))}` });
    setSelected(null);
  };

  const changeReciter = useCallback((id: string) => {
    setReciter(id);
    try { localStorage.setItem(RECITER_KEY, id); } catch { /* ignore */ }
  }, []);

  const startRecitation = (ayah: number) => {
    setSelected(null);
    dock.current?.playFrom(ayah);
  };

  // ---------- Calculs ----------
  const checkpointG = khatma ? globalIndex(khatma.currentSurah, khatma.currentAyah) : 0;
  const hasStarted = khatma ? khatmaProgress(khatma.currentSurah, khatma.currentAyah, khatma.completed) > 0 : false;
  const progress = khatma ? khatmaProgress(khatma.currentSurah, khatma.currentAyah, khatma.completed) : 0;

  const pointsFor = (ayah: number) => {
    if (!surah) return 0;
    const target = globalIndex(surah, ayah);
    const base = hasStarted ? checkpointG : 0;
    return Math.max(0, target - base) * POINTS_PER_AYAH;
  };

  const ayahState = (ayah: number) => {
    if (!khatma || !surah) return "";
    const g = globalIndex(surah, ayah);
    if (surah === khatma.currentSurah && ayah === khatma.currentAyah && hasStarted) return styles.isCheckpoint;
    if (hasStarted && g < checkpointG) return styles.isRead;
    return "";
  };

  // ---------- Actions ----------
  const pickAyah = (v: Verse, e?: React.MouseEvent) => {
    // Mode mémorisation: l-click l-wla kat-kchef l-aya, t-tanya kat-7ellha
    if (prefs.hide !== "off" && !revealedIds.has(v.id)) {
      setRevealed({ key: revealKey, ids: new Set(revealedIds).add(v.id) });
      return;
    }
    setSelected(v);
    if (e) {
      const id = e.timeStamp + e.clientX;
      setLastClick({ x: e.clientX, y: e.clientY });
      setRipples((r) => [...r, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 900);
    }
  };

  const goSurah = (n: number, scrollTo?: number) => {
    if (n < 1 || n > 114) return;
    if (surah) setDir(n >= surah ? 1 : -1);
    if (n !== surah) setPlayingAyah(null);
    pendingScroll.current = scrollTo ?? null;
    setSelected(null);
    const idx = pageIdxOf(n, scrollTo ?? 1);
    if (n === surah && shown.includes(idx) && scrollTo) {
      document.getElementById(`ayah-${scrollTo}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      pendingScroll.current = null;
    } else {
      if (n === surah) setDir(idx >= safeIdx ? 1 : -1);
      setSurah(n);
      setPageIdx(idx);
      if (!scrollTo) window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setDrawer(false);
  };

  useEffect(() => { goCheckpointRef.current = () => { if (khatma) goSurah(khatma.currentSurah, khatma.currentAyah); }; });

  const saveKhatira = async (content: string) => {
    if (!selected || !surah) return false;
    setBusy("khatira");
    try {
      await khawatirService.add(surah, selected.id, content);
      toast(t("toast.khatira"));
      return true;
    } catch {
      toast(t("common.error"), "error");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const doHifd = async () => {
    if (!selected || !surah) return;
    setBusy("hifd");
    try {
      const res = await hifdService.start(surah, selected.id);
      toast(t("toast.hifd", { count: res.count, surah: surahName(getSurah(surah)) }));
      setSelected(null);
    } catch {
      toast(t("common.error"), "error");
    } finally {
      setBusy(null);
    }
  };

  const doCheckpoint = async () => {
    if (!selected || !surah || !khatma) return;
    const pts = pointsFor(selected.id);
    const ayahsRead = pts / POINTS_PER_AYAH;
    setBusy("checkpoint");
    try {
      const k = await khatmaService.checkpoint(khatma.id, surah, selected.id, ayahsRead);
      setKhatma(k);
      setBurst(selected.id);
      setTimeout(() => setBurst(null), 1400);
      if (ayahsRead > 0) addLog({ ayahs: ayahsRead });
      if (k.completed) celebrate({ big: true, title: t("toast.completed"), subtitle: k.title });
      else if (pts > 0) celebrate({ x: lastClick?.x, y: lastClick?.y });
      toast(k.completed ? t("toast.completed") : pts > 0 ? t("toast.checkpoint", { points: pts }) : t("toast.checkpointMoved"));
      setSelected(null);
      refreshMe();
      loadActivity();
    } catch {
      toast(t("common.error"), "error");
    } finally {
      setBusy(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SURAHS;
    return SURAHS.filter((s) =>
      String(s.id) === q || s.translit.toLowerCase().includes(q) || s.fr.toLowerCase().includes(q) ||
      s.en.toLowerCase().includes(q) || s.ar.includes(query.trim()));
  }, [query]);

  // Ba7t f l-ayat dyal s-sourate l-7aliya (b l-3arbiya bla tachkil, b t-traduction, wla b r-ra9m)
  const ayahResults = useMemo(() => {
    const q = ayahQuery.trim();
    if (!q || !chapter) return [];
    if (/^\d+$/.test(q)) return chapter.verses.filter((v) => String(v.id).startsWith(q)).slice(0, 60);
    const qa = stripAr(q), ql = q.toLowerCase();
    return chapter.verses.filter((v) => stripAr(v.text).includes(qa) || (v.translation ?? "").toLowerCase().includes(ql)).slice(0, 60);
  }, [ayahQuery, chapter]);

  // ---------- Render ----------
  if (notFound) {
    return (
      <div className={`glass-panel ${styles.notFound}`}>
        <p>{t("common.error")}</p>
        <Link href="/khatma" className="btn-ghost"><ArrowLeft size={16} /> {t("reader.back")}</Link>
      </div>
    );
  }

  if (!khatma || !surah) {
    return <PageLoader label={t("common.loadingShort")} />;
  }

  const meta = getSurah(surah);
  const atStart = surah <= 1 && Math.min(...shown) === 0;
  const atEnd = surah >= 114 && Math.max(...shown) >= pages.length - 1;
  const lastOfSurah = Math.max(...shown) >= pages.length - 1;
  const firstOfSurah = Math.min(...shown) === 0;
  const pagePct = pages.length ? ((Math.max(...shown) + 1) / pages.length) * 100 : 0;
  const tj = prefs.tajweed && tajweed?.surah === surah ? tajweed.map : null;
  const isCp = (id: number) => khatma.currentSurah === surah && khatma.currentAyah === id && hasStarted;
  const currentPageNo = page?.page ?? pageOf(surah, 1);
  const currentJuz = juzOf(surah, page?.from ?? 1);
  const goPage = (n: number) => {
    if (!Number.isFinite(n)) return;
    const st = pageStart(Math.min(TOTAL_PAGES, Math.max(1, Math.round(n))));
    goSurah(st.surah, st.ayah);
    setGotoOpen(false);
    setGotoPage("");
  };
  const goJuz = (j: number) => { const st = juzStart(j); goSurah(st.surah, st.ayah); setGotoOpen(false); };

  /** Text dyal aya: tajweed (b l-alwan) / kelma b kelma (hover) / 3adi */
  const ayahText = (v: Verse) => {
    const segs = tj?.[v.id];
    if (segs) return segs.map((s, i) => (s.rule ? <span key={i} className={`tj tj-${s.rule}`}>{s.text}</span> : <React.Fragment key={i}>{s.text}</React.Fragment>));
    if (prefs.wordHover) return v.text.split(" ").map((w, i) => <React.Fragment key={i}>{i > 0 && " "}<span className={styles.w}>{w}</span></React.Fragment>);
    return v.text;
  };

  /** Wr9a wa7da dyal l-mushaf */
  const renderLeaf = (idx: number, side: "single" | "right" | "left") => {
    const p = pages[idx];
    if (!p) return null;
    const verses = versesOf(p);
    const first = p.from === 1;
    const loading = !chapter || chapter.id !== surah;
    return (
      <div key={p.page} className={`${styles.leaf} ${styles[`leaf_${side}`]} ${prefs.ornaments ? "" : styles.plain}`}>
        <div className={styles.sheen} aria-hidden />
        <div className={styles.frame} aria-hidden>
          {(["tl", "tr", "bl", "br"] as const).map((c) => <CornerOrnament key={c} className={`${styles.corner} ${styles[`corner_${c}`]}`} />)}
        </div>
        {/* Running header b7al l-mushaf: juz · s-sourate · ra9m la page */}
        <div className={styles.runHead}>
          <span>{t("common.juz")} {juzOf(surah, p.from)}</span>
          <span className="quran-text">سُورَةُ {meta.ar}</span>
          <span>{t("reader.page")} {p.page}</span>
        </div>

        {first && (
          <motion.header className={styles.surahHead} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: EASE }}>
            <div className={styles.banner}>
                            <SurahBanner name={`سُورَةُ ${meta.ar}`} left={`${toArabicDigits(meta.verses)} آية`} right={meta.type === "mk" ? "مكية" : "مدنية"} />
            </div>
            <p className={styles.surahInfo}>
              {meta.id}. {meta.translit}{lang !== "ar" && <> — {surahMeaning(meta)}</>} · {meta.verses} {t("common.ayahs")} · {t(`common.${meta.type}` as DictKey)}
            </p>
          </motion.header>
        )}
        {first && surah !== 1 && surah !== 9 && <p className={`quran-text ${styles.basmala}`}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>}

        {loading ? (
          <div className={styles.textLoading}>
            {[0, 1, 2, 3, 4].map((i) => <span key={i} style={{ width: `${92 - i * 11}%` }} />)}
          </div>
        ) : viewMode === "mushaf" ? (
          <p className={`quran-text ${styles.mushaf} ${prefs.wordHover && !tj ? styles.wordMode : ""} ${prefs.ayahLines ? styles.ayahLines : ""} ${prefs.spotlight ? styles.spot : ""} ${prefs.dimRead ? styles.dimRead : ""} ${prefs.ayahNumbers ? "" : styles.noNums}`}
            style={{
              fontSize: `${spreadOn ? prefs.fontSize * 0.86 : prefs.fontSize}rem`, lineHeight: prefs.lineHeight,
              textAlign: prefs.align, textAlignLast: "center",
              wordSpacing: prefs.wordSpacing ? `${prefs.wordSpacing}em` : undefined, paddingInline: 6 + prefs.pagePad,
            }}>
            {verses.map((v) => {
              const qs = prefs.markers ? quarterStart(surah, v.id) : null;
              const fav = favorites.has(surah, v.id);
              const hlc = highlights.get(surah, v.id);
              const veiled = prefs.hide !== "off" && !revealedIds.has(v.id);
              const words = veiled && prefs.hide === "first" ? v.text.split(" ") : null;
              return (
                <span
                  key={v.id}
                  id={`ayah-${v.id}`}
                  className={`${styles.ayah} ${ayahState(v.id)} ${selected?.id === v.id ? styles.isSelected : ""} ${playingAyah === v.id ? styles.isPlaying : ""} ${fav ? styles.isFav : ""} ${hlc ? styles[`hl_${hlc}`] : ""}`}
                  onClick={(e) => pickAyah(v, e)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && pickAyah(v)}
                >
                  {qs && (v.id !== 1 || surah === 1) && (
                    <span className={styles.rub} title={`${t("studio.hizb")} ${qs.hizb} ${QUARTER_GLYPH[qs.quarter]}`}>
                      ۞<small>{qs.quarter === 0 ? `${t("studio.hizb")} ${qs.hizb}` : QUARTER_GLYPH[qs.quarter]}</small>
                    </span>
                  )}
                  {!veiled ? ayahText(v) : words
                    ? <>{words[0]} <span className={styles.veil}>{words.slice(1).join(" ")}</span></>
                    : <span className={styles.veil}>{v.text}</span>}
                  <AyahMarker n={v.id} className={styles.marker2}>
                    {isCp(v.id) && <Bookmark className={styles.ribbon} size={18} />}
                    {fav && <i className={styles.favDot} aria-hidden />}
                    {burst === v.id && <Burst />}
                  </AyahMarker>
                  {prefs.markers && isSajda(surah, v.id) && <span className={styles.sajda} title={t("studio.sajda")}>۩</span>}{" "}
                  {prefs.inlineTr && !veiled && v.translation && <span className={styles.inTr} dir="auto">{v.translation}</span>}
                </span>
              );
            })}
          </p>
        ) : (
          <ol className={styles.list}>
            {verses.map((v, i) => (
              <motion.li
                key={v.id}
                id={`ayah-${v.id}`}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: Math.min(i, 6) * 0.03 }}
                className={`${styles.card} ${ayahState(v.id)} ${selected?.id === v.id ? styles.isSelected : ""} ${playingAyah === v.id ? styles.isPlaying : ""}`}
                onClick={(e) => pickAyah(v, e)}
              >
                <div className={styles.cardHead}>
                  <AyahMarker n={v.id} className={styles.num} />
                  {isCp(v.id) && <span className={styles.cpTag}><Bookmark size={12} /> {t("card.at")}</span>}
                  {favorites.has(surah, v.id) && <i className={styles.favDot} aria-hidden />}
                  {burst === v.id && <Burst />}
                </div>
                <p className="quran-text" style={{ fontSize: `${prefs.fontSize * 0.9}rem` }}>{ayahText(v)}</p>
                {v.translation && <p className={styles.trans}>{v.translation}</p>}
              </motion.li>
            ))}
          </ol>
        )}

        <footer className={styles.pageFoot}>
          <span className={styles.pageNum}>{toArabicDigits(p.page)}</span>
          {first && side !== "left" && <p className={styles.hint}>{t("reader.hint")}</p>}
        </footer>
      </div>
    );
  };

  return (
    <div className={`${styles.wrap} ${focus ? styles.focus : ""}`} style={{
      ["--acc" as string]: tpl.accent, ["--glow" as string]: tpl.glow,
      ["--tpl-from" as string]: tpl.from, ["--tpl-to" as string]: tpl.to,
    }}>
      <motion.div className={styles.readBar} initial={false} animate={{ scaleX: pagePct / 100 }} transition={{ duration: 0.6, ease: EASE }} aria-hidden />
      {ripples.map((r) => (
        <motion.span key={r.id} className={styles.ripple} style={{ left: r.x, top: r.y }}
          initial={{ scale: 0, opacity: 0.9 }} animate={{ scale: 1, opacity: 0 }} transition={{ duration: 0.85, ease: EASE }} aria-hidden />
      ))}

      {/* ===== Barre dyal l-khatma ===== */}
      <motion.section initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className={`glass-panel ${styles.top}`}>
        <div className={styles.topRow}>
          <Link href="/khatma" className={styles.back}><ArrowLeft size={16} /> {t("reader.back")}</Link>
          <div className={styles.titleBox}>
            <span className={styles.tplName}>{tpl.glyph} {t(`tpl.${tpl.id}` as DictKey)}</span>
            <h1 className={styles.title}>{khatma.title}</h1>
          </div>
          <div className={styles.topActions}>
            <div className={styles.members}>
              {khatma.members.slice(0, 5).map((m) => (
                <span key={m.id} title={m.username} className={styles.mAvatar}>
                  {m.username.slice(0, 1).toUpperCase()}
                  {m.owner && <Crown size={9} className={styles.crown} />}
                </span>
              ))}
            </div>
            <button className="icon-btn" onClick={() => setActivityOpen((v) => !v)} title={t("reader.activity")}><ActivityIcon size={17} /></button>
            <button className="btn-gold" onClick={() => setShareOpen(true)}><Share2 size={16} /> <span className={styles.hideSm}>{t("share.title")}</span></button>
          </div>
        </div>

        <div className={styles.progress}>
          <div className={styles.track}>
            <motion.div className={styles.fill} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.4, ease: EASE }} />
            <motion.span className={styles.marker} initial={{ left: 0 }} animate={{ left: `${progress}%` }} transition={{ duration: 1.4, ease: EASE }} />
          </div>
          <div className={styles.progressMeta}>
            <span><Bookmark size={13} /> {surahName(getSurah(khatma.currentSurah))} · {khatma.currentAyah} · {t("common.juz")} {juzOf(khatma.currentSurah, khatma.currentAyah)}</span>
            <strong>{progress.toFixed(1)}%</strong>
          </div>
        </div>
        {khatma.completed && <div className={styles.completed}>✦ {t("reader.completedBanner")} ✦</div>}
      </motion.section>

      {/* ===== Toolbar ===== */}
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
        <button className="btn-ghost" onClick={() => setDrawer(true)}><List size={16} /> {t("reader.surahs")}</button>
        <div className={styles.gotoWrap} ref={gotoBox}>
          <button className={`btn-ghost ${gotoOpen ? styles.toolOn : ""}`} onClick={() => setGotoOpen((v) => !v)} aria-expanded={gotoOpen}>
            <Compass size={16} /> <span className={styles.hideSm}>{t("reader.goto")}</span>
          </button>
          <AnimatePresence>
            {gotoOpen && (
              <motion.div className={styles.gotoPanel} role="dialog" aria-label={t("reader.goto")}
                initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.22, ease: EASE }}>
                <form className={styles.gotoForm} onSubmit={(e) => { e.preventDefault(); goPage(Number(gotoPage)); }}>
                  <label htmlFor="goto-page">{t("reader.goto.page")}</label>
                  <div>
                    <input id="goto-page" autoFocus type="number" inputMode="numeric" min={1} max={TOTAL_PAGES} value={gotoPage}
                      placeholder={String(currentPageNo)} onChange={(e) => setGotoPage(e.target.value)} />
                    <button className="btn-gold" type="submit" disabled={!gotoPage}>{t("reader.goto.go")}</button>
                  </div>
                </form>
                <span className={styles.gotoLabel}>{t("reader.goto.juz")}</span>
                <div className={styles.juzGrid}>
                  {Array.from({ length: 30 }, (_, i) => (
                    <button key={i} className={currentJuz === i + 1 ? styles.juzOn : ""} onClick={() => goJuz(i + 1)}>{i + 1}</button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
        {lang !== "ar" && (
          <div className={styles.segment}>
            {(["mushaf", "translation"] as Mode[]).map((m) => (
              <button key={m} className={mode === m ? styles.segOn : ""} onClick={() => setMode(m)}>
                {mode === m && <motion.span layoutId="modePill" className={styles.segPill} />}
                <span>{t(`reader.mode.${m}` as DictKey)}</span>
              </button>
            ))}
          </div>
        )}
        <div className={styles.toolGroup}>
          <SessionChip pages={sessionPages} onTick={logSeconds} />
          <span className={`${styles.session} ${wirdDone >= wirdGoal ? styles.wirdDone : ""}`} title={t("reader.wird")}>
            <Target size={14} /> {t("reader.wird.pages", { done: Math.min(wirdDone, wirdGoal), goal: wirdGoal })}
            <i className={styles.wirdBar}><b style={{ transform: `scaleX(${Math.min(1, wirdDone / wirdGoal)})` }} /></i>
          </span>
          {resume && pageOf(resume.surah, resume.ayah) !== pageOf(khatma.currentSurah, khatma.currentAyah) && (
            <button className="btn-ghost" onClick={() => { goSurah(resume.surah, resume.ayah); setResume(null); }}>
              <History size={16} /> {t("reader.resume", { n: pageOf(resume.surah, resume.ayah) })}
            </button>
          )}
          <ReaderSettings prefs={prefs} onChange={setPrefs} onReset={resetPrefs} canSpread={wide} />
          <button className={`icon-btn ${autoScroll ? styles.toolOn : ""}`} onClick={() => setAutoScroll((v) => !v)}
            title={t("reader.autoScroll")} aria-label={t("reader.autoScroll")} aria-pressed={autoScroll}>
            <ChevronsDown size={17} className={autoScroll ? styles.scrolling : ""} />
          </button>
          <button className="btn-ghost" onClick={() => startRecitation(khatma.currentSurah === surah && hasStarted ? khatma.currentAyah : (page?.from ?? 1))}>
            <Headphones size={16} /> <span className={styles.hideSm}>{t("audio.play")}</span>
          </button>
          <button className="btn-ghost" disabled={!firstShownPage} onClick={() => firstShownPage && setTasmia({
            items: Array.from({ length: lastShownPage.to - firstShownPage.from + 1 }, (_, i) => ({ surah, ayah: firstShownPage.from + i })),
            title: `${t("tasmia.title")} · ${t("reader.page")} ${firstShownPage.page}${shown.length > 1 ? `–${lastShownPage.page}` : ""}`,
          })}>
            <Mic size={16} /> <span className={styles.hideSm}>{t("reader.tasmiaPage")}</span>
          </button>
          <button className="btn-ghost" onClick={() => goSurah(khatma.currentSurah, khatma.currentAyah)}>
            <Bookmark size={16} /> <span className={styles.hideSm}>{t("reader.goCheckpoint")}</span>
          </button>
          <button className="icon-btn" onClick={() => setFocus((v) => !v)} title={t("reader.focus")} aria-label={t("reader.focus")} aria-pressed={focus}>
            {focus ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {prefs.hide !== "off" && <p className={styles.hideHint}><EyeOff size={15} /> {t("reader.hideHint")}</p>}

      {/* ===== Page(s) dyal l-Mushaf ===== */}
      <div className={styles.stage} data-theme={prefs.autoNight && night ? "night" : prefs.theme} style={{
        opacity: prefs.brightness, ["--font-quran" as string]: MUSHAF_FONTS[prefs.font],
        maxWidth: prefs.narrow && !spreadOn ? 820 : undefined, width: "100%", marginInline: "auto",
      }}>
        {prefs.tapZones && (
          <>
            <button className={`${styles.tap} ${styles.tapL}`} onClick={() => turnPage(lang === "ar" ? 1 : -1)} aria-label={lang === "ar" ? t("reader.tapNext") : t("reader.tapPrev")} />
            <button className={`${styles.tap} ${styles.tapR}`} onClick={() => turnPage(lang === "ar" ? -1 : 1)} aria-label={lang === "ar" ? t("reader.tapPrev") : t("reader.tapNext")} />
          </>
        )}
        <AnimatePresence mode="wait" custom={dir}>
          <motion.article
            key={`${surah}-${shown.join("-")}-${viewMode}-${lang}`}
            className={`${styles.page} ${spreadOn && shown.length === 2 ? styles.spread : ""}`}
            custom={dir}
            variants={FLIP_VARIANTS[prefs.flip]}
            initial="enter"
            animate="center"
            exit="exit"
            onPanEnd={onPanEnd}
            style={{ transformPerspective: 2200, touchAction: "pan-y" }}
          >
            <span className={styles.curlShade} aria-hidden />
            {/* L-page l-impaire 3la l-limn (b7al l-ktab l-3arabi) */}
            {shown.length === 2 ? (
              <div className={styles.book}>
                {renderLeaf(shown[0], "right")}
                <span className={styles.spine} aria-hidden />
                {renderLeaf(shown[1], "left")}
              </div>
            ) : renderLeaf(shown[0], "single")}
          </motion.article>
        </AnimatePresence>
      </div>

      {/* ===== Navigation pages ===== */}
      <nav className={styles.pager}>
        <button className="btn-ghost" disabled={atStart} onClick={() => turnPage(-1)}>
          <ChevronLeft size={16} className={styles.flip} /> {firstOfSurah ? t("reader.prevSurah") : t("reader.prevPage")}
        </button>
        <div className={styles.pagerMid}>
          <span className={styles.pagerNum}>
            {t("reader.pageOf", { i: shown.map((s) => s + 1).join("–"), n: pages.length })}
          </span>
          {pages.length > 1 && pages.length <= 60 && (
            <div className={styles.dots}>
              {pages.map((p, i) => (
                <button key={p.page} aria-label={`${t("reader.page")} ${p.page}`}
                  className={`${styles.dot} ${shown.includes(i) ? styles.dotOn : ""} ${i < Math.min(...shown) ? styles.dotPast : ""}`}
                  onClick={() => { setDir(i > safeIdx ? 1 : -1); setPageIdx(i); setSelected(null); }} />
              ))}
            </div>
          )}
        </div>
        <button className="btn-ghost" disabled={atEnd} onClick={() => turnPage(1)}>
          {lastOfSurah ? t("reader.nextSurah") : t("reader.nextPage")} <ChevronRight size={16} className={styles.flip} />
        </button>
      </nav>

      {/* ===== Scrubber: l-mushaf kaml (604 page) b 3alamat dyal l-ajza2 ===== */}
      <div className={styles.scrub}>
        <span className={styles.scrubLabel}>{t("reader.scrub", { p: scrub ?? currentPageNo, j: juzOf(pageStart(scrub ?? currentPageNo).surah, pageStart(scrub ?? currentPageNo).ayah) })}</span>
        <div className={styles.scrubTrack} dir="ltr">
          {JUZ_PAGES.map((pg, i) => <i key={i} style={{ left: `${((pg - 1) / (TOTAL_PAGES - 1)) * 100}%` }} title={`${t("common.juz")} ${i + 1}`} />)}
          <input type="range" min={1} max={TOTAL_PAGES} step={1} value={scrub ?? currentPageNo} aria-label={t("reader.goto.page")}
            style={{ ["--p" as string]: `${(((scrub ?? currentPageNo) - 1) / (TOTAL_PAGES - 1)) * 100}%` }}
            onChange={(e) => setScrub(Number(e.target.value))}
            onPointerUp={() => { if (scrub != null) { goPage(scrub); setScrub(null); } }}
            onKeyUp={() => { if (scrub != null) { goPage(scrub); setScrub(null); } }}
            onBlur={() => setScrub(null)} />
        </div>
      </div>

      {/* Mode focus: bouton sghir bach nkhrjo */}
      <AnimatePresence>
        {focus && (
          <motion.button className={styles.focusExit} onClick={() => setFocus(false)}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Minimize2 size={15} /> {t("reader.focusExit")}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ===== Drawer dyal s-souwar ===== */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div className={styles.scrim} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <motion.aside
              className={styles.drawer}
              initial={{ x: lang === "ar" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: lang === "ar" ? "100%" : "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 34 }}
            >
              <div className={styles.drawerHead}>
                <h3>{t("reader.surahs")}</h3>
                <button className="icon-btn" onClick={() => setDrawer(false)}><X size={17} /></button>
              </div>
              <div className={styles.dTabs} role="tablist">
                {(["surahs", "ayat", "fav", "marks"] as const).map((tb) => (
                  <button key={tb} role="tab" aria-selected={drawerTab === tb} className={drawerTab === tb ? styles.dTabOn : ""} onClick={() => setDrawerTab(tb)}>
                    {drawerTab === tb && <motion.span layoutId="drawerTab" className={styles.dTabPill} transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                    <span>{tb === "fav" && <Heart size={13} />}{tb === "marks" && <Highlighter size={13} />} {t(`reader.tab.${tb}` as DictKey)}{tb === "fav" && favorites.list.length > 0 ? ` · ${favorites.list.length}` : ""}</span>
                  </button>
                ))}
              </div>
              {drawerTab === "surahs" && (
                <>
              <label className={styles.search}>
                <Search size={16} />
                <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("reader.search")} />
              </label>
              <ul className={styles.surahList}>
                {filtered.map((s) => {
                  const done = hasStarted && (s.id < khatma.currentSurah || (s.id === khatma.currentSurah && khatma.currentAyah >= s.verses));
                  const cp = s.id === khatma.currentSurah && hasStarted;
                  return (
                    <li key={s.id}>
                      <button className={`${styles.surahItem} ${s.id === surah ? styles.surahOn : ""}`} onClick={() => goSurah(s.id)}>
                        <span className={styles.diamond}><span>{s.id}</span></span>
                        <span className={styles.sName}>
                          <strong>{surahName(s)}</strong>
                          <small>{lang !== "ar" ? surahMeaning(s) : s.translit} · {s.verses}</small>
                        </span>
                        {cp ? <Bookmark size={15} className={styles.sCp} /> : done ? <Check size={15} className={styles.sDone} /> : null}
                        <span className={`quran-text ${styles.sAr}`}>{s.ar}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
                </>
              )}
              {drawerTab === "ayat" && (
                <>
                  <label className={styles.search}>
                    <Search size={16} />
                    <input autoFocus value={ayahQuery} onChange={(e) => setAyahQuery(e.target.value)} placeholder={t("reader.searchAyah")} />
                  </label>
                  <ul className={styles.surahList}>
                    {ayahQuery.trim() && ayahResults.length === 0 && <li className={styles.muted}>{t("reader.noResult")}</li>}
                    {ayahResults.map((v) => (
                      <li key={v.id}>
                        <button className={styles.resItem} onClick={() => goSurah(surah, v.id)}>
                          <span className={styles.diamond}><span>{v.id}</span></span>
                          <span className={styles.resText}>
                            <span className="quran-text">{v.text}</span>
                            {v.translation && <small>{v.translation}</small>}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {drawerTab === "fav" && (
                <ul className={styles.surahList}>
                  {favorites.list.length === 0 && <li className={styles.muted}>{t("reader.noFav")}</li>}
                  {favorites.list.map((f) => {
                    const [fs, fa] = f.split(":").map(Number);
                    const sm = getSurah(fs);
                    return (
                      <li key={f}>
                        <button className={styles.surahItem} onClick={() => goSurah(fs, fa)}>
                          <span className={styles.diamond}><span>{fa}</span></span>
                          <span className={styles.sName}>
                            <strong>{surahName(sm)}</strong>
                            <small>{t("common.ayah")} {fa} · {t("reader.page")} {pageOf(fs, fa)}</small>
                          </span>
                          <Heart size={15} className={styles.sCp} />
                          <span className={`quran-text ${styles.sAr}`}>{sm.ar}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {drawerTab === "marks" && (
                <ul className={styles.surahList}>
                  {Object.keys(highlights.map).length === 0 && <li className={styles.muted}>{t("reader.noMarks")}</li>}
                  {Object.entries(highlights.map).map(([key, color]) => {
                    const [hs, ha] = key.split(":").map(Number);
                    const sm = getSurah(hs);
                    return (
                      <li key={key}>
                        <button className={styles.surahItem} onClick={() => goSurah(hs, ha)}>
                          <span className={`${styles.hlDot} ${styles[`hl_${color}`]}`} />
                          <span className={styles.sName}>
                            <strong>{surahName(sm)}</strong>
                            <small>{t("common.ayah")} {ha} · {t("reader.page")} {pageOf(hs, ha)}</small>
                          </span>
                          <span className={`quran-text ${styles.sAr}`}>{sm.ar}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ===== Activité ===== */}
      <AnimatePresence>
        {activityOpen && (
          <motion.aside
            className={`glass-panel ${styles.activity}`}
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className={styles.drawerHead}>
              <h3>{t("reader.activity")}</h3>
              <button className="icon-btn" onClick={() => setActivityOpen(false)}><X size={17} /></button>
            </div>
            {activity.length === 0 ? <p className={styles.muted}>{t("reader.noActivity")}</p> : (
              <ul className={styles.feed}>
                {activity.map((a) => (
                  <li key={a.id}>
                    <span className={styles.mAvatar}>{a.username.slice(0, 1).toUpperCase()}</span>
                    <div>
                      <p><strong>{a.username}</strong> {t(`act.${a.type}` as DictKey, { surah: surahName(getSurah(a.surah ?? 1)), ayah: a.ayah ?? 1 })}</p>
                      <small>{new Date(a.createdAt).toLocaleString(lang === "ar" ? "ar-MA" : lang === "en" ? "en-GB" : "fr-FR", { dateStyle: "medium", timeStyle: "short" })}</small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      <AyahActionSheet
        surah={surah}
        verse={selected}
        isCheckpoint={!!selected && isCp(selected.id)}
        pointsIfCheckpoint={selected ? pointsFor(selected.id) : 0}
        accent={tpl.accent}
        busy={busy}
        reciter={reciter}
        onReciterChange={changeReciter}
        onHifd={doHifd}
        onCheckpoint={doCheckpoint}
        onSaveKhatira={saveKhatira}
        onPlayFrom={startRecitation}
        onTasmia={openTasmia}
        pageEnd={selected ? (pages[pageIdxOf(surah, selected.id)]?.to ?? 0) : 0}
        onClose={() => setSelected(null)}
      />

      {/* key={surah}: dock jdid m3a kol sourate (kaywqef l-audio l-9dim) */}
      <RecitationDock key={surah} ref={dock} surah={surah} reciter={reciter} onReciterChange={changeReciter} onAyah={onRecitedAyah} />

      <TasmiaModal open={!!tasmia} items={tasmia?.items ?? []} title={tasmia?.title} reciter={reciter} onClose={() => setTasmia(null)} />

      <ShareKhatmaModal open={shareOpen} onClose={() => setShareOpen(false)} khatma={khatma} onUpdated={setKhatma} />
    </div>
  );
};

/** Explosion sghira dyal nour mli kaytsjel checkpoint */
const Burst = () => (
  <span className={styles.burst} aria-hidden>
    {Array.from({ length: 12 }).map((_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return (
        <motion.i
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: Math.cos(a) * 46, y: Math.sin(a) * 46, opacity: 0, scale: 0.3 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      );
    })}
  </span>
);