"use client";

// Home: "astrolabe" 3D dyal n-nhar (s-salawat l-khams dayrin 3la 24 sa3a, l-3alama d-dhahabiya = daba),
// bento dyal l-yawm (9raya, salat, wird, hifd, dou3a, 7adith, niveau) w abwab l kol 9ism.
// L-3D kolo b CSS transforms (compositor): bla canvas tani, khfif 7ta f l-jihaz d-d3if.
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, BookOpen, Brain, Clock, HandHeart, HeartHandshake, User, Sparkles, Flame, Target, Check, MoonStar, Sunrise, Sun, CloudSun,
  Sunset, Moon, Quote, RotateCcw,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { DictKey } from "@/i18n/dictionaries";
import { useMe } from "@/components/layout/AppShell/AppShell";
import { HifdSurah, Khatma, hifdService, khatmaService } from "@/services/api/khatmaService";
import { getSurah, khatmaProgress } from "@/lib/quran";
import { TOTAL_PAGES } from "@/lib/mushafPages";
import { getTemplate } from "@/lib/templates";
import { FARD, PRAYERS, PrayerId, timesForDate } from "@/lib/prayerTimes";
import { toPrayerInput, useSalatLog, useSalatSettings } from "@/lib/salatStore";
import { useReadingLog } from "@/lib/readingLog";
import { dayKey } from "@/lib/adhkarStore";
import { DUAS } from "@/lib/duas";
import { HADITHS_SALAT } from "@/lib/hadithSalat";
import { ProgressRing } from "@/components/common/ProgressRing/ProgressRing";
import { CountUp, Tilt3D } from "@/components/common/Motion/Motion";
import { AdhkarNow } from "@/components/features/adhkar/AdhkarNow/AdhkarNow";
import { AyahOfDay } from "@/components/features/khatma/AyahOfDay/AyahOfDay";
import { levelOf } from "@/components/features/profile/ProfileDashboard/ProfileDashboard";
import { PerfSwitch } from "@/components/common/Perf/Perf";
import styles from "./HomeView.module.css";

const EASE = [0.22, 1, 0.36, 1] as const;
const DAY = 86_400_000;
const ICONS: Record<PrayerId, React.ElementType> = { fajr: MoonStar, sunrise: Sunrise, dhuhr: Sun, asr: CloudSun, maghrib: Sunset, isha: Moon };
const pad = (n: number) => String(n).padStart(2, "0");

const Countdown = ({ to }: { to: number }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const left = Math.max(0, Math.floor((to - now) / 1000));
  return <span className={styles.count}>{pad(Math.floor(left / 3600))}:{pad(Math.floor((left % 3600) / 60))}:{pad(left % 60)}</span>;
};

/** Kelma b kelma: kol kelma kat-tla3 mn t7t */
const Reveal = ({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) => (
  <span className={className}>
    {text.split(" ").map((w, i) => (
      <span key={i} className={styles.word}>
        <motion.span initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 0.9, delay: delay + i * 0.08, ease: EASE }}>{w}</motion.span>{" "}
      </span>
    ))}
  </span>
);

export const HomeView = () => {
  const { t, lang, surahName } = useI18n();
  const { me } = useMe();
  const [settings] = useSalatSettings();
  const salatLog = useSalatLog();
  const { log } = useReadingLog();
  const [list, setList] = useState<Khatma[] | null>(null);
  const [hifd, setHifd] = useState<HifdSurah[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const astro = useRef<HTMLDivElement>(null);
  const locale = lang === "ar" ? "ar-MA" : lang === "en" ? "en-GB" : "fr-FR";

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(id); }, []);
  useEffect(() => {
    let alive = true;
    Promise.all([khatmaService.list(), hifdService.summary()])
      .then(([k, h]) => { if (alive) { setList(k); setHifd(h); } })
      .catch(() => { if (alive) setList([]); });
    return () => { alive = false; };
  }, []);

  // L-astrolabe kay-mil m3a souris (CSS vars, rAF, bla re-render)
  useEffect(() => {
    const el = astro.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0, x = 0, y = 0;
    const apply = () => { raf = 0; el.style.setProperty("--tx", `${x * 10}deg`); el.style.setProperty("--ty", `${y * -8}deg`); };
    const onMove = (e: PointerEvent) => {
      x = (e.clientX / window.innerWidth - 0.5) * 2;
      y = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);

  // ---------- Aw9at ----------
  const input = toPrayerInput(settings);
  const today = dayKey(new Date(now));
  const times = timesForDate(new Date(now), input);
  const tomorrow = timesForDate(new Date(now + DAY), input);
  const fmt = (d: Date | number | null) => d == null ? "—" : new Date(d).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: !settings.h24, timeZone: input.timeZone });
  const seq = [...PRAYERS.map((id) => ({ id, at: times[id]?.getTime() ?? NaN })), { id: "fajr" as PrayerId, at: tomorrow.fajr?.getTime() ?? NaN }].filter((e) => Number.isFinite(e.at));
  const next = seq.find((e) => e.at > now) ?? null;
  const dayStart = new Date(`${today}T00:00:00`).getTime();
  /** Zawiya f d-dayra: nos l-lil l-ta7t, d-dohr l-fo9 */
  const angle = (ms: number) => ((ms - dayStart) / DAY) * 360 + 90;
  const isNight = !!times.maghrib && !!times.fajr && (now >= times.maghrib.getTime() || now < times.fajr.getTime());
  const hour = new Date(now).getHours();
  const greet = t(hour < 5 ? "home.night" : hour < 12 ? "home.morning" : hour < 18 ? "home.afternoon" : hour < 22 ? "home.evening" : "home.night");
  let hijri = "";
  try { hijri = new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, { day: "numeric", month: "long", year: "numeric" }).format(new Date(now)); } catch { /* ma-kaynch */ }
  const gregorian = new Date(now).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });

  // ---------- Data dyal l-yawm ----------
  const active = (list ?? []).filter((k) => !k.completed);
  const latest = active[0];
  const progress = latest ? khatmaProgress(latest.currentSurah, latest.currentAyah, latest.completed) : 0;
  const tpl = getTemplate(latest?.template);
  const wirdGoal = latest ? Math.max(1, Math.ceil(TOTAL_PAGES / Math.max(1, latest.targetDays))) : 0;
  const wirdDone = log[today]?.pages ?? 0;
  const prayed = FARD.filter((p) => salatLog.has(today, p)).length;
  const due = hifd.reduce((s, h) => s + h.due, 0);
  const lv = levelOf(me?.nourPoints ?? 0);
  const dua = DUAS[(Math.floor(now / DAY) * 4 + Math.floor(hour / 6)) % DUAS.length];
  const hadith = HADITHS_SALAT[Math.floor(now / DAY) % HADITHS_SALAT.length];
  const NextIcon = next ? ICONS[next.id] : Moon;

  const tiles: { href: string; icon: React.ElementType; title: string; desc: DictKey; hue: number }[] = [
    { href: "/khatma", icon: BookOpen, title: t("nav.khatmas"), desc: "home.tile.khatma", hue: 42 },
    { href: "/hifd", icon: Brain, title: t("nav.hifd"), desc: "home.tile.hifd", hue: 150 },
    { href: "/salat", icon: Clock, title: t("nav.salat"), desc: "home.tile.salat", hue: 200 },
    { href: "/adhkar", icon: HandHeart, title: t("nav.adhkar"), desc: "home.tile.adhkar", hue: 280 },
    { href: "/dua", icon: HeartHandshake, title: t("nav.dua"), desc: "home.tile.dua", hue: 340 },
    { href: "/profile", icon: User, title: t("nav.profile"), desc: "home.tile.profile", hue: 20 },
  ];
  const fade = (i: number) => ({ initial: { opacity: 0, y: 26 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-40px" }, transition: { duration: 0.7, delay: i * 0.06, ease: EASE } });

  return (
    <div className={styles.page}>
      {/* ===================== HERO ===================== */}
      <section className={styles.hero}>
        <div className={styles.heroTxt}>
          <motion.p className={styles.greet} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
            {greet}{me?.username ? `, ${me.username}` : ""}
          </motion.p>
          <h1 className={styles.title}>
            <Reveal text="From Darknesses" className={styles.dark} />
            <Reveal text="to Light" className={`${styles.light} gold-text`} delay={0.25} />
          </h1>
          <motion.span className={`quran-text ${styles.ayah}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, delay: 0.7 }}>
            يُخْرِجُهُم مِّنَ ٱلظُّلُمَٰتِ إِلَى ٱلنُّورِ
          </motion.span>
          <motion.p className={styles.sub} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.5, ease: EASE }}>{t("home.tagline")}</motion.p>
          <motion.div className={styles.chips} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.6, ease: EASE }}>
            <span>{gregorian}</span>
            {hijri && <span className={styles.chipGold}>{hijri}</span>}
          </motion.div>
          <motion.div className={styles.ctas} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.7, ease: EASE }}>
            <Link href={latest ? `/khatma/${latest.id}` : "/khatma"} className="btn-gold"><BookOpen size={17} /> {latest ? t("home.continue") : t("home.noKhatma")}</Link>
            <Link href="/salat" className="btn-ghost"><Clock size={16} /> {t("nav.salat")}</Link>
          </motion.div>
        </div>

        {/* ---- Astrolabe 3D ---- */}
        <motion.div className={`${styles.astro} ${isNight ? styles.night : ""}`} ref={astro} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.3, delay: 0.2, ease: EASE }}>
          <div className={styles.scene}>
            <span className={styles.disc} aria-hidden style={{
              background: `conic-gradient(from 180deg, rgba(4,16,11,0.9) 0deg, rgba(4,16,11,0.9) ${angle(times.fajr?.getTime() ?? dayStart) - 90}deg, rgba(212,175,55,0.22) ${angle(times.sunrise?.getTime() ?? dayStart) - 90}deg, rgba(243,220,154,0.3) 180deg, rgba(212,175,55,0.22) ${angle(times.maghrib?.getTime() ?? dayStart) - 90}deg, rgba(4,16,11,0.9) ${angle(times.isha?.getTime() ?? dayStart) - 90}deg, rgba(4,16,11,0.9) 360deg)`,
            }} />
            <span className={`${styles.ring} ${styles.r1}`} aria-hidden />
            <span className={`${styles.ring} ${styles.r2}`} aria-hidden />
            <span className={`${styles.ring} ${styles.r3}`} aria-hidden />
            {PRAYERS.map((id) => {
              const at = times[id]?.getTime();
              if (at == null) return null;
              const Icon = ICONS[id];
              const isNext = next?.id === id && next.at === at;
              return (
                <span key={id} className={styles.arm} style={{ transform: `rotateZ(${angle(at)}deg)` }}>
                  <span className={`${styles.node} ${isNext ? styles.nodeNext : ""} ${at <= now ? styles.nodePast : ""}`} style={{ ["--a" as string]: `${-angle(at)}deg` }}>
                    <i><Icon size={15} /></i>
                    <b>{t(`salat.p.${id}` as DictKey)}</b>
                    <small>{fmt(at)}</small>
                  </span>
                </span>
              );
            })}
            <span className={styles.arm} style={{ transform: `rotateZ(${angle(now)}deg)` }} aria-hidden>
              <span className={styles.beam} />
              <span className={styles.nowDot} />
            </span>
          </div>
          <div className={styles.core}>
            <svg viewBox="0 0 100 100" className={styles.star} aria-hidden>
              <defs><linearGradient id="hs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff4d6" /><stop offset="0.5" stopColor="#d4af37" /><stop offset="1" stopColor="#8a6a1c" /></linearGradient></defs>
              <rect x="20" y="20" width="60" height="60" fill="none" stroke="url(#hs)" strokeWidth="1.2" />
              <rect x="20" y="20" width="60" height="60" fill="none" stroke="url(#hs)" strokeWidth="1.2" transform="rotate(45 50 50)" />
            </svg>
            <span className={styles.coreLabel}>{t("salat.next")}</span>
            {next ? (
              <>
                <strong className={styles.coreName}><NextIcon size={20} /> {t(`salat.p.${next.id}` as DictKey)}</strong>
                <Countdown key={next.at} to={next.at} />
                <small className={styles.coreAt}>{fmt(next.at)}</small>
              </>
            ) : <strong className={styles.coreName}>—</strong>}
          </div>
          <p className={styles.astroHint}>{t("home.astro.hint")}</p>
        </motion.div>
      </section>

      {/* ===================== Chrit ===================== */}
      <div className={styles.marquee} aria-hidden>
        <div>
          {[0, 1].map((k) => (
            <span key={k} className="quran-text">
              ٱللَّهُ نُورُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ ✦ أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ ✦ وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا ✦ إِنَّ ٱلصَّلَوٰةَ كَانَتْ عَلَى ٱلْمُؤْمِنِينَ كِتَٰبًا مَّوْقُوتًا ✦ ٱدْعُونِىٓ أَسْتَجِبْ لَكُمْ ✦&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ===================== Bento dyal l-yawm ===================== */}
      <section>
        <h2 className={styles.h2}>{t("home.today")}</h2>
        <div className={styles.bento}>
          <motion.div {...fade(0)} className={styles.span2}>
            <Link href={latest ? `/khatma/${latest.id}` : "/khatma"} className={`glass-panel nour-border fx-card ${styles.card} ${styles.continue}`} style={{ ["--acc" as string]: tpl.accent }}>
              <ProgressRing value={progress} size={104} stroke={7} color={tpl.accent}>
                <div className={styles.pct}>{Math.floor(progress)}<small>%</small></div>
              </ProgressRing>
              <div className={styles.cardTxt}>
                <span className={styles.label}>{latest ? t("home.continue") : t("home.noKhatma")}</span>
                <strong>{latest ? latest.title : t("nav.khatmas")}</strong>
                {latest && <small>{surahName(getSurah(latest.currentSurah))} · {t("common.ayah")} {latest.currentAyah}</small>}
              </div>
              {latest && <span className={`quran-text ${styles.contAr}`}>{getSurah(latest.currentSurah).ar}</span>}
              <span className={styles.go}><ArrowRight size={18} /></span>
            </Link>
          </motion.div>

          <motion.div {...fade(1)}>
            <Link href="/salat" className={`glass-panel fx-card ${styles.card} ${styles.col}`}>
              <span className={styles.label}><Clock size={13} /> {t("home.prayers")}</span>
              <div className={styles.dots}>
                {FARD.map((p) => {
                  const done = salatLog.has(today, p);
                  return <span key={p} className={`${styles.pdot} ${done ? styles.pdotOn : ""}`} title={`${t(`salat.p.${p}` as DictKey)} · ${fmt(times[p])}`}>{done ? <Check size={13} /> : t(`salat.p.${p}` as DictKey).slice(0, 1)}</span>;
                })}
              </div>
              <strong className={styles.big}>{t("home.prayers.done", { n: prayed })}</strong>
            </Link>
          </motion.div>

          <motion.div {...fade(2)}>
            <Link href={latest ? `/khatma/${latest.id}` : "/khatma"} className={`glass-panel fx-card ${styles.card} ${styles.col}`}>
              <span className={styles.label}><Target size={13} /> {t("home.wird")}</span>
              <strong className={styles.num}><CountUp value={Math.min(wirdDone, wirdGoal || wirdDone)} /><small> / {wirdGoal || "—"}</small></strong>
              <div className={styles.bar}><motion.i initial={{ scaleX: 0 }} whileInView={{ scaleX: wirdGoal ? Math.min(1, wirdDone / wirdGoal) : 0 }} viewport={{ once: true }} transition={{ duration: 1.2, ease: EASE }} /></div>
              <small>{t("home.wird.pages", { done: Math.min(wirdDone, wirdGoal || wirdDone), goal: wirdGoal || "—" })}</small>
            </Link>
          </motion.div>

          <motion.div {...fade(3)} className={styles.span2}>
            <Link href="/dua" className={`glass-panel fx-card ${styles.card} ${styles.quote}`}>
              <span className={styles.label}><HeartHandshake size={13} /> {t("home.dua")}</span>
              <p className={`quran-text ${styles.quoteAr}`}>{dua.ar}</p>
              {lang !== "ar" && <p className={styles.quoteTr}>{lang === "en" ? dua.en : dua.fr}</p>}
              <cite>{lang === "ar" ? dua.srcAr : dua.src}</cite>
            </Link>
          </motion.div>

          <motion.div {...fade(4)}>
            <Link href="/hifd" className={`glass-panel fx-card ${styles.card} ${styles.col}`}>
              <span className={styles.label}><RotateCcw size={13} /> {t("home.hifd")}</span>
              <strong className={styles.num}><CountUp value={due} /></strong>
              <small>{due > 0 ? t("home.hifd.due", { n: due }) : t("home.hifd.none")}</small>
            </Link>
          </motion.div>

          <motion.div {...fade(5)}>
            <Link href="/profile" className={`glass-panel fx-card ${styles.card} ${styles.col}`}>
              <span className={styles.label}><Sparkles size={13} /> {t("home.level", { n: lv.level })}</span>
              <strong className={styles.rank}>{lang === "ar" ? lv.rank.ar : lv.rank.latin}</strong>
              <div className={styles.bar}><motion.i initial={{ scaleX: 0 }} whileInView={{ scaleX: lv.pct / 100 }} viewport={{ once: true }} transition={{ duration: 1.2, ease: EASE }} /></div>
              <div className={styles.mini}>
                <span><Sparkles size={13} /> <CountUp value={me?.nourPoints ?? 0} /></span>
                <span><Flame size={13} /> <CountUp value={me?.currentStreak ?? 0} /></span>
              </div>
            </Link>
          </motion.div>

          <motion.div {...fade(6)} className={styles.span2}>
            <Link href="/salat" className={`glass-panel fx-card ${styles.card} ${styles.quote}`}>
              <span className={styles.label}><Quote size={13} /> {t("home.hadith")}</span>
              <p className={`quran-text ${styles.quoteAr}`}>{hadith.ar}</p>
              {lang !== "ar" && <p className={styles.quoteTr}>{lang === "en" ? hadith.en : hadith.fr}</p>}
              <cite>{lang === "ar" ? hadith.srcAr : hadith.src}</cite>
            </Link>
          </motion.div>

          <motion.div {...fade(7)} className={styles.span2}><AdhkarNow compact /></motion.div>
        </div>
      </section>

      {/* ===================== Abwab ===================== */}
      <section>
        <h2 className={styles.h2}>{t("home.explore")}</h2>
        <div className={styles.tiles}>
          {tiles.map((x, i) => (
            <motion.div key={x.href} {...fade(i)}>
              <Tilt3D max={9} depth={26}>
                <Link href={x.href} className={styles.tile} style={{ ["--h" as string]: x.hue }}>
                  <span className={styles.tileIcon}><x.icon size={24} /></span>
                  <strong>{x.title}</strong>
                  <p>{t(x.desc)}</p>
                  <span className={styles.tileGo}><ArrowRight size={16} /></span>
                </Link>
              </Tilt3D>
            </motion.div>
          ))}
        </div>
      </section>

      <AyahOfDay />

      <footer className={styles.foot}><PerfSwitch /></footer>
    </div>
  );
};
