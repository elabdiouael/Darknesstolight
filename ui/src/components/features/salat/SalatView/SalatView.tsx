"use client";

// Page dyal s-salat: aw9at (7sab falaki), 3add tanazoli l s-salat l-jaya, tanbih, qibla, suivi,
// 3alamat n-nhar w l-lil, rak'at, w a7adith.
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sunrise, Sun, CloudSun, Sunset, Moon, MoonStar, MapPin, LocateFixed, Settings2, Bell, BellOff, Check, Compass,
  ChevronLeft, ChevronRight, Copy, Minus, Plus, HandHeart, Flame, Search,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { DictKey } from "@/i18n/dictionaries";
import { useToast } from "@/components/common/Toast/Toast";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { dayKey } from "@/lib/adhkarStore";
import {
  CITIES, FARD, METHOD_IDS, MethodId, PRAYERS, PrayerId, distanceToKaaba, qiblaBearing, timesForDate,
} from "@/lib/prayerTimes";
import { toPrayerInput, useSalatLog, useSalatSettings } from "@/lib/salatStore";
import { HADITHS_SALAT, HADITH_TOPICS, HadithTopic } from "@/lib/hadithSalat";
import { playAdhan } from "@/lib/adhan";
import { DEFAULT_IQAMA } from "@/lib/salatStore";
import { AdhanPanel, AdhanRinging } from "../AdhanPanel/AdhanPanel";
import styles from "./SalatView.module.css";

const EASE = [0.22, 1, 0.36, 1] as const;
const DAY = 86_400_000;
const ICONS: Record<PrayerId, React.ElementType> = { fajr: MoonStar, sunrise: Sunrise, dhuhr: Sun, asr: CloudSun, maghrib: Sunset, isha: Moon };
const RAKAT: Record<Exclude<PrayerId, "sunrise">, [number, number, number]> = {
  fajr: [2, 2, 0], dhuhr: [4, 4, 2], asr: [0, 4, 0], maghrib: [0, 3, 2], isha: [0, 4, 2],
};

const stripAr = (x: string) => x.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "").replace(/[ٱأإآ]/g, "ا").toLowerCase();

const pad = (n: number) => String(n).padStart(2, "0");

/** 3add tanazoli (component bo7do: l-page kamla ma kat-re-renderich kol tanya) */
const Countdown = ({ to, from }: { to: number; from: number }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const left = Math.max(0, Math.floor((to - now) / 1000));
  const pct = to > from ? Math.min(1, Math.max(0, (now - from) / (to - from))) : 0;
  return (
    <>
      <span className={styles.count} aria-live="off">{pad(Math.floor(left / 3600))}:{pad(Math.floor((left % 3600) / 60))}:{pad(left % 60)}</span>
      <div className={styles.countBar}><i style={{ transform: `scaleX(${pct})` }} /></div>
    </>
  );
};

export const SalatView = () => {
  const { t, lang } = useI18n();
  const toast = useToast();
  const [settings, setSettings] = useSalatSettings();
  const salatLog = useSalatLog();
  const [now, setNow] = useState(() => Date.now());
  const [panel, setPanel] = useState(false);
  const [locating, setLocating] = useState(false);
  const [hIdx, setHIdx] = useState(() => Math.floor(Date.now() / DAY) % HADITHS_SALAT.length);
  const [hDir, setHDir] = useState(1);
  const [hTopic, setHTopic] = useState<HadithTopic | "all">("all");
  const [hQuery, setHQuery] = useState("");
  const [ringing, setRinging] = useState<{ id: PrayerId; at: number } | null>(null);
  const locale = lang === "ar" ? "ar-MA" : lang === "en" ? "en-GB" : "fr-FR";

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 20_000); return () => clearInterval(id); }, []);

  const input = toPrayerInput(settings);
  const cityTz = input.timeZone;
  const today = dayKey(new Date(now));

  // 7sab khfif (8 ayam): kayt3awd m3a kol render, l-compilateur dyal React howa li kay-memoizi
  const base = new Date(`${today}T12:00:00`);
  const days = Array.from({ length: 8 }, (_, i) => { const d = new Date(base.getTime() + i * DAY); return { date: d, t: timesForDate(d, input) }; });
  const times = days[0].t, tomorrow = days[1].t, week = days.slice(0, 7);

  const seq = [
    ...PRAYERS.map((id) => ({ id, at: times[id]?.getTime() ?? NaN })),
    { id: "fajr" as PrayerId, at: tomorrow.fajr?.getTime() ?? NaN },
  ].filter((e) => Number.isFinite(e.at));
  const next = seq.find((e) => e.at > now) ?? null;
  const past = seq.filter((e) => e.at <= now);
  const current: PrayerId = past.length ? past[past.length - 1].id : "isha";
  const prevAt = past.length ? past[past.length - 1].at : now - 3_600_000;
  const isFriday = new Date(now).getDay() === 5;
  const pName = (id: PrayerId) => (id === "dhuhr" && isFriday ? t("salat.jumua") : t(`salat.p.${id}` as DictKey));
  const fmt = (d: Date | null | number) => d == null || Number.isNaN(d) ? "—"
    : new Date(d).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: !settings.h24, timeZone: cityTz });

  // ---------- Tanbih: tadkir 9bel l-we9t + l-adhan f l-we9t (ma dam l-onglet m7loul) ----------
  const upcoming = seq.filter((e) => e.id !== "sunrise" && settings.alertFor[e.id] !== false);
  const events = settings.alert ? [
    ...upcoming.map((e) => ({ kind: "adhan", id: e.id, fire: e.at, at: e.at })),
    ...(settings.preMin > 0 ? upcoming.map((e) => ({ kind: "pre", id: e.id, fire: e.at - settings.preMin * 60_000, at: e.at })) : []),
  ].filter((e) => e.fire > now).sort((x, y) => x.fire - y.fire) : [];
  const alertKey = events[0] ? `${events[0].kind}:${events[0].id}:${events[0].fire}:${events[0].at}` : "";
  const sound = { voice: settings.voice, fajrVoice: settings.fajrVoice, volume: settings.volume, customUrl: settings.customUrl, fadeIn: settings.fadeIn, vibrate: settings.vibrate, preMin: settings.preMin };
  const soundKey = JSON.stringify(sound);
  useEffect(() => {
    if (!alertKey) return;
    const [kind, id, fire, at] = alertKey.split(":");
    const ms = Number(fire) - Date.now();
    if (ms <= 0 || ms > 2_000_000_000) return;
    const cfg = JSON.parse(soundKey) as typeof sound;
    const timer = setTimeout(() => {
      const name = t(`salat.p.${id}` as DictKey);
      if (kind === "pre") {
        toast(t("adhan.pre.toast", { p: name, n: cfg.preMin }));
      } else {
        const title = t("salat.alert.title", { p: name });
        playAdhan(id === "fajr" && cfg.fajrVoice !== "same" ? cfg.fajrVoice : cfg.voice, { volume: cfg.volume, customUrl: cfg.customUrl, fadeIn: cfg.fadeIn });
        if (cfg.vibrate) { try { navigator.vibrate?.([300, 150, 300, 150, 600]); } catch { /* ma-kaynch */ } }
        try { if (Notification.permission === "granted") new Notification(title, { body: t("salat.alert.body") }); } catch { /* ma-kaynch */ }
        setRinging({ id: id as PrayerId, at: Number(at) });
      }
      setNow(Date.now());
    }, ms);
    return () => clearTimeout(timer);
  }, [alertKey, soundKey, t, toast]);

  const toggleAlert = async () => {
    if (!settings.alert) {
      try { if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission(); } catch { /* ignore */ }
    }
    setSettings({ alert: !settings.alert });
  };

  const locate = () => {
    if (!navigator.geolocation) { toast(t("salat.locateError"), "error"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setSettings({ coords: { lat: +p.coords.latitude.toFixed(4), lng: +p.coords.longitude.toFixed(4) } }); setLocating(false); },
      () => { toast(t("salat.locateError"), "error"); setLocating(false); },
      { timeout: 10_000, maximumAge: 600_000 },
    );
  };

  // ---------- 3alamat n-nhar w l-lil ----------
  const sunrise = times.sunrise?.getTime(), maghrib = times.maghrib?.getTime(), fajrNext = tomorrow.fajr?.getTime();
  const night = maghrib && fajrNext ? fajrNext - maghrib : null;
  const dayLen = sunrise && maghrib ? maghrib - sunrise : null;
  const extras: { label: DictKey; value: string; icon: React.ElementType }[] = [
    { label: "salat.extra.duha", value: fmt(sunrise ? sunrise + 15 * 60_000 : null), icon: Sunrise },
    { label: "salat.extra.zawal", value: fmt(times.dhuhr), icon: Sun },
    { label: "salat.extra.midnight", value: fmt(maghrib && night ? maghrib + night / 2 : null), icon: Moon },
    { label: "salat.extra.lastThird", value: fmt(maghrib && night ? maghrib + (night * 2) / 3 : null), icon: MoonStar },
    { label: "salat.extra.dayLength", value: dayLen ? `${Math.floor(dayLen / 3_600_000)} h ${pad(Math.round((dayLen % 3_600_000) / 60_000))}` : "—", icon: Sunset },
  ];

  // ---------- Chrit dyal n-nhar (00:00 -> 24:00) ----------
  const dayStart = new Date(`${today}T00:00:00`).getTime();
  const pos = (ms: number | undefined | null) => (ms == null ? 0 : Math.min(100, Math.max(0, ((ms - dayStart) / DAY) * 100)));
  const g = { fajr: pos(times.fajr?.getTime()), rise: pos(sunrise), mag: pos(maghrib), isha: pos(times.isha?.getTime()) };
  const dayGradient = `linear-gradient(90deg, #04100b 0%, #04100b ${g.fajr}%, #1c4d5c ${g.rise}%, #c9a02c ${(g.rise + g.mag) / 2}%, #8a5a2b ${g.mag}%, #10283a ${g.isha}%, #04100b 100%)`;

  const hijri = useMemo(() => {
    try { return new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, { day: "numeric", month: "long", year: "numeric" }).format(new Date(now)); }
    catch { return ""; }
  }, [locale, now]);
  const gregorian = new Date(now).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });

  const doneToday = FARD.filter((p) => salatLog.has(today, p)).length;
  const last7 = Array.from({ length: 7 }, (_, i) => new Date(now - (6 - i) * DAY));
  const hadith = HADITHS_SALAT[hIdx];
  const moveHadith = (d: number) => { setHDir(d); setHIdx((i) => (i + d + HADITHS_SALAT.length) % HADITHS_SALAT.length); };
  const copyHadith = async (h: typeof hadith) => {
    const tr = lang === "ar" ? "" : `\n\n${lang === "en" ? h.en : h.fr}`;
    try { await navigator.clipboard.writeText(`${h.ar}${tr}\n\n— ${lang === "ar" ? h.srcAr : h.src}`); toast(t("common.copied")); } catch { /* bloqué */ }
  };
  const hq = stripAr(hQuery.trim());
  const shownHadiths = HADITHS_SALAT.filter((h) => (hTopic === "all" || h.topic === hTopic)
    && (!hq || stripAr(h.ar).includes(hq) || h.fr.toLowerCase().includes(hq) || h.en.toLowerCase().includes(hq) || h.src.toLowerCase().includes(hq)));
  const place = settings.coords ? `${t("salat.myPosition")} (${settings.coords.lat.toFixed(2)}, ${settings.coords.lng.toFixed(2)})` : lang === "ar" ? input.labelAr : input.label;
  const NextIcon = next ? ICONS[next.id] : Moon;

  return (
    <div className={styles.page}>
      {/* ===== Hero ===== */}
      <section className={styles.hero}>
        <div className={styles.heroTxt}>
          <motion.span className={`quran-text ${styles.kicker}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
            {t("salat.kicker")}
          </motion.span>
          <motion.h1 className={`${styles.title} gold-text`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.08, ease: EASE }}>
            {t("salat.title")}
          </motion.h1>
          <motion.p className={styles.sub} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.16, ease: EASE }}>
            {t("salat.subtitle")}
          </motion.p>
          <motion.div className={styles.meta} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.24, ease: EASE }}>
            <button className={styles.chip} onClick={() => setPanel(true)}><MapPin size={14} /> {place}</button>
            <span className={styles.chip}>{gregorian}</span>
            {hijri && <span className={`${styles.chip} ${styles.chipGold}`}>{hijri}</span>}
          </motion.div>
          <motion.div className={styles.heroBtns} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3, ease: EASE }}>
            <button className={settings.alert ? "btn-gold" : "btn-ghost"} onClick={toggleAlert} aria-pressed={settings.alert}>
              {settings.alert ? <Bell size={16} /> : <BellOff size={16} />} {t("salat.alert")}
            </button>
            <button className={`btn-ghost ${panel ? styles.on : ""}`} onClick={() => setPanel((v) => !v)} aria-expanded={panel}>
              <Settings2 size={16} /> {t("salat.settings")}
            </button>
          </motion.div>
        </div>

        <motion.div className={`glass-panel nour-border ${styles.nextCard}`} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.2, ease: EASE }}>
          <span className={styles.nextGlow} aria-hidden />
          <span className={styles.nextLabel}>{t("salat.next")}</span>
          {next ? (
            <>
              <div className={styles.nextName}><NextIcon size={30} /> <strong>{pName(next.id)}</strong></div>
              <span className={styles.nextAt}>{fmt(next.at)}</span>
              <span className={styles.nextIn}>{t("salat.in")}</span>
              <Countdown key={next.at} to={next.at} from={prevAt} />
            </>
          ) : <span className={styles.nextAt}>—</span>}
          <span className={styles.nowIs}>{t("salat.now", { p: pName(current) })}</span>
        </motion.div>
      </section>

      {/* ===== Réglages ===== */}
      <AnimatePresence initial={false}>
        {panel && (
          <motion.section className={styles.settingsWrap} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: EASE }}>
            <div className={`glass-panel ${styles.settings}`}>
              <div className={styles.field}>
                <label htmlFor="salat-city">{t("salat.location")}</label>
                <div className={styles.fieldRow}>
                  <select id="salat-city" value={settings.coords ? "" : settings.cityId}
                    onChange={(e) => { const c = CITIES.find((x) => x.id === e.target.value); if (c) setSettings({ cityId: c.id, coords: null, method: c.method }); }}>
                    {settings.coords && <option value="">{t("salat.myPosition")}</option>}
                    {CITIES.map((c) => <option key={c.id} value={c.id}>{lang === "ar" ? c.ar : c.name}</option>)}
                  </select>
                  <button className="btn-ghost" onClick={locate} disabled={locating}><LocateFixed size={15} /> {locating ? t("salat.locating") : t("salat.locate")}</button>
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="salat-method">{t("salat.method")}</label>
                <select id="salat-method" value={settings.method} onChange={(e) => setSettings({ method: e.target.value as MethodId })}>
                  {METHOD_IDS.map((m) => <option key={m} value={m}>{t(`salat.method.${m}` as DictKey)}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>{t("salat.asr")}</span>
                <div className={styles.segs}>
                  {(["standard", "hanafi"] as const).map((a) => (
                    <button key={a} className={settings.asr === a ? styles.segOn : ""} onClick={() => setSettings({ asr: a })} aria-pressed={settings.asr === a}>{t(`salat.asr.${a}` as DictKey)}</button>
                  ))}
                </div>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>{t("salat.offsets")}</span>
                <div className={styles.offsets}>
                  {FARD.map((p) => {
                    const v = settings.offsets[p] ?? 0;
                    const set = (n: number) => setSettings({ offsets: { ...settings.offsets, [p]: Math.max(-30, Math.min(30, n)) } });
                    return (
                      <div key={p} className={styles.offset}>
                        <small>{t(`salat.p.${p}` as DictKey)}</small>
                        <div>
                          <button onClick={() => set(v - 1)} aria-label={`${t(`salat.p.${p}` as DictKey)} −1`}><Minus size={13} /></button>
                          <b>{v > 0 ? `+${v}` : v}</b>
                          <button onClick={() => set(v + 1)} aria-label={`${t(`salat.p.${p}` as DictKey)} +1`}><Plus size={13} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className={styles.field}>
                <div className={styles.fieldRow}>
                  <button className={`btn-ghost ${settings.h24 ? styles.on : ""}`} onClick={() => setSettings({ h24: !settings.h24 })} aria-pressed={settings.h24}>{t("salat.h24")}</button>
                </div>
                <small className={styles.hint}>{t("salat.alert.hint")}</small>
              </div>
              <p className={styles.note}>{t("salat.note")}</p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ===== Adhan ===== */}
      <AdhanPanel settings={settings} onChange={setSettings} />

      {/* ===== Chrit dyal n-nhar ===== */}
      <div className={`glass-panel ${styles.dayBar}`}>
        <div className={styles.dayTrack} style={{ background: dayGradient }}>
          {PRAYERS.map((id) => times[id] && (
            <span key={id} className={`${styles.dayMark} ${id === current ? styles.dayMarkOn : ""}`} style={{ insetInlineStart: `${pos(times[id]?.getTime())}%` }} title={`${pName(id)} · ${fmt(times[id])}`}>
              <i /><small>{pName(id)}</small>
            </span>
          ))}
          <span className={styles.dayNow} style={{ insetInlineStart: `${pos(now)}%` }} aria-hidden />
        </div>
      </div>

      {/* ===== Aw9at + Qibla ===== */}
      <div className={styles.row}>
        <section className={`glass-panel ${styles.panel}`}>
          <header className={styles.panelHead}>
            <h2>{t("salat.today")}</h2>
            <small>{t("salat.tracker.today", { n: doneToday })}</small>
          </header>
          <ul className={styles.times}>
            {PRAYERS.map((id, i) => {
              const Icon = ICONS[id];
              const at = times[id]?.getTime();
              const isNext = next?.id === id && next.at === at;
              const fard = id !== "sunrise";
              const prayed = fard && salatLog.has(today, id);
              const passed = at != null && at <= now;
              return (
                <motion.li key={id} className={`${styles.time} ${id === current ? styles.timeNow : ""} ${isNext ? styles.timeNext : ""} ${!fard ? styles.timeSoft : ""}`}
                  initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.05, ease: EASE }}>
                  <span className={styles.timeIcon}><Icon size={18} /></span>
                  <strong>{pName(id)}</strong>
                  {isNext && <span className={styles.tag}>{t("salat.next")}</span>}
                  <span className={styles.timeAt}>
                    {fmt(times[id])}
                    {fard && settings.showIqama && at != null && <small>{t("adhan.iqama")} {fmt(at + (settings.iqama[id] ?? DEFAULT_IQAMA[id]) * 60_000)}</small>}
                  </span>
                  {fard ? (
                    <motion.button whileTap={{ scale: 0.8 }} className={`${styles.check} ${prayed ? styles.checkOn : ""}`} disabled={!passed && !prayed}
                      onClick={() => salatLog.toggle(today, id)} aria-pressed={prayed} title={prayed ? t("salat.prayed") : t("salat.markPrayed")} aria-label={`${pName(id)} · ${t("salat.markPrayed")}`}>
                      <Check size={15} />
                    </motion.button>
                  ) : <span className={styles.checkGap} />}
                </motion.li>
              );
            })}
          </ul>
          <Link href="/adhkar/salat" className={`btn-ghost ${styles.adhkarLink}`}><HandHeart size={15} /> {t("salat.afterAdhkar")}</Link>
        </section>

        <QiblaCompass lat={input.lat} lng={input.lng} />
      </div>

      {/* ===== Suivi + 3alamat ===== */}
      <div className={styles.row}>
        <section className={`glass-panel ${styles.panel}`}>
          <header className={styles.panelHead}>
            <h2>{t("salat.tracker")}</h2>
            <small className={styles.streak}><Flame size={14} /> {t("salat.tracker.streak", { n: salatLog.streak })}</small>
          </header>
          <div className={styles.grid7}>
            <span />
            {last7.map((d) => <small key={d.getTime()} className={dayKey(d) === today ? styles.gridToday : ""}>{d.toLocaleDateString(locale, { weekday: "short" })}</small>)}
            {FARD.map((p) => (
              <React.Fragment key={p}>
                <small className={styles.gridLabel}>{t(`salat.p.${p}` as DictKey)}</small>
                {last7.map((d) => {
                  const k = dayKey(d);
                  const on = salatLog.has(k, p);
                  const future = k === today && (times[p]?.getTime() ?? 0) > now;
                  return (
                    <button key={k} className={`${styles.dot} ${on ? styles.dotOn : ""}`} disabled={future && !on} onClick={() => salatLog.toggle(k, p)}
                      aria-pressed={on} aria-label={`${t(`salat.p.${p}` as DictKey)} · ${d.toLocaleDateString(locale, { weekday: "long", day: "numeric" })}`}>
                      {on && <Check size={12} />}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </section>

        <section className={`glass-panel ${styles.panel}`}>
          <header className={styles.panelHead}><h2>{t("salat.extra")}</h2></header>
          <ul className={styles.extras}>
            {extras.map((e) => (
              <li key={e.label} className="fx-card"><e.icon size={17} className="fx-icon" /><span>{t(e.label)}</span><b>{e.value}</b></li>
            ))}
          </ul>
        </section>
      </div>

      {/* ===== Hadith dyal l-yawm ===== */}
      <section className={`glass-panel nour-border ${styles.hadithDay}`}>
        <header className={styles.panelHead}>
          <h2>{t("salat.hadith.today")}</h2>
          <div className={styles.hNav}>
            <button className="icon-btn" onClick={() => moveHadith(-1)} aria-label={t("salat.hadith.prev")}><ChevronLeft size={17} className={styles.flip} /></button>
            <small>{hIdx + 1} / {HADITHS_SALAT.length}</small>
            <button className="icon-btn" onClick={() => moveHadith(1)} aria-label={t("salat.hadith.next")}><ChevronRight size={17} className={styles.flip} /></button>
            <button className="icon-btn" onClick={() => copyHadith(hadith)} aria-label={t("common.copy")} title={t("common.copy")}><Copy size={15} /></button>
          </div>
        </header>
        <AnimatePresence mode="wait" custom={hDir}>
          <motion.blockquote key={hadith.id} custom={hDir}
            initial={{ opacity: 0, x: hDir * 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: hDir * -30 }} transition={{ duration: 0.35, ease: EASE }}>
            <p className={`quran-text ${styles.hAr}`}>{hadith.ar}</p>
            {lang !== "ar" && <p className={styles.hTr}>{lang === "en" ? hadith.en : hadith.fr}</p>}
            <cite>{lang === "ar" ? hadith.srcAr : hadith.src}</cite>
          </motion.blockquote>
        </AnimatePresence>
      </section>

      {/* ===== Rak'at + 7 ayam ===== */}
      <div className={styles.row}>
        <section className={`glass-panel ${styles.panel}`}>
          <header className={styles.panelHead}><h2>{t("salat.rakat")}</h2></header>
          <table className={styles.table}>
            <thead><tr><th /><th>{t("salat.rakat.before")}</th><th>{t("salat.rakat.fard")}</th><th>{t("salat.rakat.after")}</th></tr></thead>
            <tbody>
              {FARD.map((p) => (
                <tr key={p}>
                  <th scope="row">{t(`salat.p.${p}` as DictKey)}</th>
                  <td>{RAKAT[p][0] || "·"}</td>
                  <td><b>{RAKAT[p][1]}</b></td>
                  <td>{RAKAT[p][2] || "·"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.note}>{t("salat.rakat.note")}</p>
        </section>

        <section className={`glass-panel ${styles.panel}`}>
          <header className={styles.panelHead}><h2>{t("salat.week")}</h2></header>
          <div className={styles.tableScroll}>
            <table className={`${styles.table} ${styles.weekTable}`}>
              <thead><tr><th>{t("salat.date")}</th>{PRAYERS.map((p) => <th key={p}>{t(`salat.p.${p}` as DictKey)}</th>)}</tr></thead>
              <tbody>
                {week.map((w, i) => (
                  <tr key={w.date.getTime()} className={i === 0 ? styles.rowToday : ""}>
                    <th scope="row">{w.date.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })}</th>
                    {PRAYERS.map((p) => <td key={p}>{fmt(w.t[p])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ===== Ga3 l-a7adith ===== */}
      <section>
        <h2 className={styles.h2}>{t("salat.hadith.all")} <small>{HADITHS_SALAT.length}</small></h2>
        <div className={styles.hFilters}>
          <label className={styles.hSearch}>
            <Search size={16} />
            <input value={hQuery} onChange={(e) => setHQuery(e.target.value)} placeholder={t("hadith.search")} aria-label={t("hadith.search")} />
          </label>
          <div className={styles.hTopics}>
            {(["all", ...HADITH_TOPICS] as const).map((tp) => (
              <button key={tp} className={hTopic === tp ? styles.hTopicOn : ""} aria-pressed={hTopic === tp} onClick={() => setHTopic(tp)}>{t(`hadith.topic.${tp}` as DictKey)}</button>
            ))}
          </div>
        </div>
        {shownHadiths.length === 0 && <p className={styles.note}>{t("hadith.none")}</p>}
        <div className={`fx-rail ${styles.hadiths}`}>
          {shownHadiths.map((h, i) => (
            <motion.article key={h.id} className={`glass-panel fx-card ${styles.hadith}`}
              initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-30px" }} transition={{ duration: 0.55, delay: (i % 3) * 0.06, ease: EASE }}>
              <p className={`quran-text ${styles.hAr}`}>{h.ar}</p>
              {lang !== "ar" && <p className={styles.hTr}>{lang === "en" ? h.en : h.fr}</p>}
              <footer>
                <cite>{lang === "ar" ? h.srcAr : h.src}</cite>
                <span className={styles.hTag}>{t(`hadith.topic.${h.topic}` as DictKey)}</span>
                <button className="icon-btn" onClick={() => copyHadith(h)} aria-label={t("common.copy")} title={t("common.copy")}><Copy size={14} /></button>
              </footer>
            </motion.article>
          ))}
        </div>
      </section>

      <AdhanRinging prayer={ringing ? pName(ringing.id) : null} time={ringing ? fmt(ringing.at) : ""}
        iqama={ringing && settings.showIqama ? fmt(ringing.at + (settings.iqama[ringing.id] ?? DEFAULT_IQAMA[ringing.id]) * 60_000) : null}
        onClose={() => setRinging(null)} />
    </div>
  );
};

/* ================= Qibla ================= */
type CompassEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };

const QiblaCompass = ({ lat, lng }: { lat: number; lng: number }) => {
  const { t, lang } = useI18n();
  const cardinals = lang === "ar" ? ["ش", "ق", "ج", "غ"] : lang === "en" ? ["N", "E", "S", "W"] : ["N", "E", "S", "O"];
  const touch = useMediaQuery("(pointer: coarse)");
  const bearing = qiblaBearing(lat, lng);
  const km = Math.round(distanceToKaaba(lat, lng));
  const [on, setOn] = useState(false);
  const [denied, setDenied] = useState(false);
  const [heading, setHeading] = useState<number | null>(null);

  const enable = async () => {
    try {
      const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined;
      if (!DOE) throw new Error("no sensor");
      if (typeof DOE.requestPermission === "function" && (await DOE.requestPermission()) !== "granted") throw new Error("denied");
      setDenied(false);
      setOn(true);
    } catch { setDenied(true); }
  };

  useEffect(() => {
    if (!on) return;
    let got = false;
    const onMove = (ev: Event) => {
      const e = ev as CompassEvent;
      const h = typeof e.webkitCompassHeading === "number" ? e.webkitCompassHeading : e.absolute && e.alpha != null ? 360 - e.alpha : null;
      if (h == null) return;
      got = true;
      setHeading(h);
    };
    window.addEventListener("deviceorientationabsolute", onMove);
    window.addEventListener("deviceorientation", onMove);
    // Ila ma ja 7ta chi 9ira2a: l-jihaz ma fihch boussole
    const timer = setTimeout(() => { if (!got) { setDenied(true); setOn(false); } }, 3000);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("deviceorientationabsolute", onMove);
      window.removeEventListener("deviceorientation", onMove);
    };
  }, [on]);

  const live = heading != null;
  const diff = live ? Math.abs(((bearing - heading + 540) % 360) - 180) : 180;
  const aligned = live && diff < 4;

  return (
    <section className={`glass-panel ${styles.panel} ${styles.qibla} ${aligned ? styles.qiblaAligned : ""}`}>
      <header className={styles.panelHead}>
        <h2><Compass size={20} /> {t("salat.qibla")}</h2>
        <small>{t("salat.qibla.distance", { km: km.toLocaleString() })}</small>
      </header>
      <div className={styles.compass}>
        {live && <span className={styles.compassTop} aria-hidden />}
        <svg viewBox="0 0 200 200" className={styles.dial} style={{ transform: `rotate(${live ? -heading : 0}deg)` }} role="img"
          aria-label={t("salat.qibla.bearing", { deg: Math.round(bearing) })}>
          <circle cx="100" cy="100" r="92" className={styles.dialRing} />
          <circle cx="100" cy="100" r="74" className={styles.dialInner} />
          {Array.from({ length: 72 }, (_, i) => (
            <line key={i} x1="100" y1="10" x2="100" y2={i % 18 === 0 ? 24 : i % 6 === 0 ? 19 : 15} transform={`rotate(${i * 5} 100 100)`}
              className={i % 18 === 0 ? styles.tickMajor : styles.tick} />
          ))}
          {cardinals.map((c, i) => (
            <text key={c} x="100" y="40" transform={`rotate(${i * 90} 100 100)`} className={i === 0 ? styles.cardN : styles.card}>{c}</text>
          ))}
          <g transform={`rotate(${bearing} 100 100)`} className={styles.needle}>
            <line x1="100" y1="100" x2="100" y2="46" />
            <path d="M100 28 L108 46 L92 46 Z" />
            {/* Kaaba sghira f ras s-sehm */}
            <rect x="93" y="12" width="14" height="14" rx="2" className={styles.kaaba} />
            <rect x="93" y="16" width="14" height="2.4" className={styles.kaabaBand} />
          </g>
          <circle cx="100" cy="100" r="5" className={styles.pivot} />
        </svg>
      </div>
      <strong className={styles.bearing}>{aligned ? t("salat.qibla.aligned") : t("salat.qibla.bearing", { deg: Math.round(bearing) })}</strong>
      <p className={styles.note}>{denied ? t("salat.qibla.denied") : live ? t("salat.qibla.live") : t("salat.qibla.static")}</p>
      {touch && !live && <button className="btn-gold" onClick={enable}><Compass size={16} /> {t("salat.qibla.enable")}</button>}
    </section>
  );
};
