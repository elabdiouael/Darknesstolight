"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { BookOpen, Brain, User, LogOut, Sparkles, Flame, HandHeart, Clock, HeartHandshake, Home } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { getToken, logout } from "@/services/api/axiosConfig";
import { Me, userService } from "@/services/api/khatmaService";
import { NourMood } from "@/components/three/NourMood";
import { LangSwitcher } from "@/components/common/LangSwitcher/LangSwitcher";
import { useHydrated } from "@/lib/useHydrated";
import { PageLoader } from "@/components/common/NourLoader/NourLoader";
import styles from "./AppShell.module.css";

let meCache: Me | null = null;

interface MeCtx { me: Me | null; refreshMe: () => Promise<void> }
const MeContext = createContext<MeCtx>({ me: null, refreshMe: async () => {} });
export const useMe = () => useContext(MeContext);

export const AppShell = ({ children, calm = false, star = true }: { children: React.ReactNode; calm?: boolean; star?: boolean }) => {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  // meCache: l-shell kay-t3awd y-monta f kol page -> bla cache l-stats kay-ghebrou w y-rej3ou f kol navigation
  const [me, setMeState] = useState<Me | null>(meCache);
  const setMe = useCallback((m: Me) => { meCache = m; setMeState(m); }, []);
  const hydrated = useHydrated();
  // Token kayt9ra ghir mn ba3d l-hydration (localStorage ma kaynch f server)
  const ready = hydrated && !!getToken();
  // Navbar kat-sghar (compact) mli kan-scrolliw + khett dyal progress dyal scroll
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.4 });
  const [compact, setCompact] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setCompact(y > 40));
  // Pill dyal hover kat-tbe3 souris bin les liens
  const [hovered, setHovered] = useState<string | null>(null);
  // Spotlight: d-dow kaytbe3 souris fo9 l-bar (CSS vars, bla re-render)
  const barRef = useRef<HTMLDivElement>(null);
  const onBarMove = (e: React.PointerEvent) => {
    const el = barRef.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const refreshMe = useCallback(
    () => userService.me().then(setMe).catch(() => { /* 401 kayt-gera f interceptor */ }),
    [setMe],
  );

  useEffect(() => {
    if (!getToken()) { meCache = null; router.replace("/auth"); return; }
    let alive = true;
    userService.me().then((m) => { if (alive) setMe(m); }).catch(() => {});
    return () => { alive = false; };
  }, [router, setMe]);

  const links = [
    { href: "/home", label: t("nav.home"), icon: Home },
    { href: "/khatma", label: t("nav.khatmas"), icon: BookOpen },
    { href: "/hifd", label: t("nav.hifd"), icon: Brain },
    { href: "/salat", label: t("nav.salat"), icon: Clock },
    { href: "/adhkar", label: t("nav.adhkar"), icon: HandHeart },
    { href: "/dua", label: t("nav.dua"), icon: HeartHandshake },
    { href: "/profile", label: t("nav.profile"), icon: User },
  ];

  const isActive = (href: string) => pathname.startsWith(href);
  // Dock l-ta7t (mobile) ghir f les pages principales — f lecture/session kayn dock khor
  const showDock = links.some((l) => l.href === pathname);
  // Dock mobile: 6 blayes kafyin — l-hifd kayn f l-home
  const dockLinks = links.filter((l) => l.href !== "/hifd");

  return (
    <MeContext.Provider value={{ me, refreshMe }}>
      <NourMood calm={calm} star={star} />
      {hydrated && (
      <header className={`${styles.header} ${compact ? styles.compact : ""} ${showDock ? styles.hasDock : ""}`} data-shell-header>
        <div ref={barRef} className={`glass-panel ${styles.bar}`} onPointerMove={onBarMove}>
          <span className={styles.barBorder} aria-hidden><i /></span>
          <span className={styles.barGlow} aria-hidden />
          <span className={styles.barSpot} aria-hidden />
          <motion.span className={styles.barProgress} style={{ scaleX: progress }} aria-hidden />
          <Link href="/home" className={styles.brand}>
            <span className={styles.logo} aria-hidden>
              <span className={styles.logoHalo} />
              <svg viewBox="0 0 40 40" width="34" height="34" className={styles.logoSvg}>
                <defs>
                  <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#fff4d6" /><stop offset="0.5" stopColor="#d4af37" /><stop offset="1" stopColor="#8a6a1c" />
                  </linearGradient>
                </defs>
                <path d="M20 2l5 8.5 9.5-2.5-2.5 9.5L40 20l-8 2.5 2.5 9.5-9.5-2.5L20 38l-5-8.5-9.5 2.5 2.5-9.5L0 20l8-2.5L5.5 8 15 10.5z" fill="none" stroke="url(#lg)" strokeWidth="1.6" />
                <circle cx="20" cy="20" r="6" fill="url(#lg)" />
              </svg>
            </span>
            <span className={styles.brandText}>
              <strong>From Darknesses to Light</strong>
              <em className="quran-text">مِنَ ٱلظُّلُمَٰتِ إِلَى ٱلنُّورِ</em>
            </span>
          </Link>

          <nav className={styles.nav} onPointerLeave={() => setHovered(null)}>
            {links.map((l) => {
              const active = isActive(l.href);
              const Icon = l.icon;
              return (
                <Link key={l.href} href={l.href} className={`${styles.link} ${active ? styles.active : ""}`}
                  onPointerEnter={(e) => { if (e.pointerType === "mouse") setHovered(l.href); }}
                  title={l.label}
                  aria-current={active ? "page" : undefined}>
                  {hovered === l.href && !active && (
                    <motion.span layoutId="navHover" className={styles.hoverPill} transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                  )}
                  {active && <motion.span layoutId="navPill" className={styles.pill} transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                  <Icon size={16} />
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className={styles.right}>
            {me && (
              <div className={styles.stats}>
                <span title={t("common.points")}><Sparkles size={14} /> {me.nourPoints}</span>
                <span title={t("common.streak")}><Flame size={14} /> {me.currentStreak}</span>
              </div>
            )}
            <LangSwitcher />
            <button className="icon-btn" onClick={logout} title={t("nav.logout")} aria-label={t("nav.logout")}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>
      )}
      <main className={`${styles.main} ${showDock ? styles.withDock : ""}`}>{ready ? children : <PageLoader />}</main>

      {hydrated && showDock && (
        <nav className={styles.dock} aria-label="navigation">
          {dockLinks.map((l) => {
            const active = isActive(l.href);
            const Icon = l.icon;
            return (
              <Link key={l.href} href={l.href} className={`${styles.dockLink} ${active ? styles.dockOn : ""}`}>
                {active && <motion.span layoutId="dockPill" className={styles.dockPill} transition={{ type: "spring", stiffness: 420, damping: 30 }} />}
                <motion.span className={styles.dockIcon} animate={{ y: active ? -3 : 0, scale: active ? 1.12 : 1 }}>
                  <Icon size={20} />
                </motion.span>
                <span className={styles.dockLabel}>{l.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </MeContext.Provider>
  );
};