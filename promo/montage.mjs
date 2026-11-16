// FILM PROMO (montage) — machi tasjil dyal l-écran: kan-jbdou 3anasir 7a9i9iya mn l-app w kan-rekkbouhom f film.
//
//  1. Chrome headless kay-7ell l-app b compte dyalek, b graphisme Max, b "we9t virtuel" (kol frame = 1/30 s b d-debt).
//  2. PRÉPARATION (bla tasjil): kay-douz 3la les pages, kay-settel les états (tajweed, tafsir, mode mémorisation...)
//     w kay-khod nuskha mn kol 3onsor ("prop"): page dyal l-mushaf, misbaha, qibla, dashboard...
//  3. TASJIL: l-app kat-tkhebba (kay-b9a ghir l-background 3D l-7ay) w montage.page.js kay-l3eb les scènes.
//  4. SAWT: sfx.mjs kay-sna3 l-aswat mn timeline dyal l-film, w ffmpeg kay-jme3 kolchi.
//
//   PROMO_EMAIL=... PROMO_PASSWORD=... node montage.mjs               -> from-darknesses-to-light-2k.mp4 (2560×1440)
//   ... node montage.mjs --preview                                    -> montage-preview.mp4 (sghir, 6 fps)
//   ... ONLY=mushaf,tasbih node montage.mjs --preview                 -> ghir had les scènes
//   node montage.mjs --audio                                          -> y-3awd ghir s-sawt w l-assemblage
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import ffmpegPath from "ffmpeg-static";
import { renderAudio } from "./sfx.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const APP = process.env.URL ?? "http://localhost:3000";
const API = process.env.API ?? "http://localhost:4333/api/v1";
const PREVIEW = process.argv.includes("--preview");
const AUDIO_ONLY = process.argv.includes("--audio");
const FPS = PREVIEW ? 6 : 30;
const W = 1920, H = 1080;
const SCALE = PREVIEW ? 0.5 : Number(process.env.SCALE ?? 4 / 3);   // 4/3 -> 2560×1440 (2K)
const CREDIT = { name: process.env.CREDIT_NAME ?? "ELABDI OUAIL", role: process.env.CREDIT_ROLE ?? "IT Systems Engineer" };
const silent = path.join(here, PREVIEW ? "montage-preview.mp4" : "montage-silent.mp4");
const timelineFile = path.join(here, "montage-timeline.json");
const final = path.join(here, "from-darknesses-to-light-2k.mp4");

/* ------------------------------------------------------------------ assemblage: sawt + versions */
function assemble() {
  const tl = JSON.parse(readFileSync(timelineFile, "utf8"));
  const wav = path.join(here, "montage-audio.wav");
  const info = renderAudio(tl, wav);
  console.log(`sawt: ${tl.events.length} événements · pic ${info.peak}`);
  const mux = spawnSync(ffmpegPath, ["-y", "-loglevel", "error", "-i", silent, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-maxrate", "24M", "-bufsize", "48M", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", final], { stdio: ["ignore", "ignore", "inherit"] });
  if (mux.status !== 0) throw new Error("mux");
  console.log("film:", final);
  // Instagram 4:5 (1080×1350): l-film f l-west, l-khalfiya nefs l-film m-floutiya
  const insta = path.join(here, "from-darknesses-to-light-instagram-4x5.mp4");
  const ig = spawnSync(ffmpegPath, ["-y", "-loglevel", "error", "-i", final, "-filter_complex",
    "[0:v]split[a][b];[a]scale=2400:1350,crop=1080:1350,boxblur=30:4,eq=brightness=-0.2[bg];[b]scale=1080:-2[fg];[bg][fg]overlay=0:(H-h)/2[v]",
    "-map", "[v]", "-map", "0:a", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", insta], { stdio: ["ignore", "ignore", "inherit"] });
  if (ig.status === 0) console.log("instagram:", insta);
}
if (AUDIO_ONLY) { assemble(); process.exit(0); }

/* ------------------------------------------------------------------ navigateur */
if (!process.env.PROMO_EMAIL || !process.env.PROMO_PASSWORD) throw new Error("PROMO_EMAIL / PROMO_PASSWORD manquants");
const login = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: process.env.PROMO_EMAIL, password: process.env.PROMO_PASSWORD }) });
if (!login.ok) throw new Error(`login ${login.status}`);
const { token } = await login.json();

const chrome = [process.env.CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].filter(Boolean).find((p) => existsSync(p));
const browser = await puppeteer.launch({
  executablePath: chrome, headless: true, defaultViewport: { width: W, height: H, deviceScaleFactor: SCALE },
  args: [`--window-size=${W},${H}`, "--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11", "--hide-scrollbars", "--mute-audio"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => { if (!/setPointerCapture|pointer/i.test(e.message)) console.error("[page]", e.message); });

// We9t virtuel + données dyal l-3ard (9bel ay script dyal l-app)
await page.evaluateOnNewDocument((tok, credit) => {
  const realTimeout = window.setTimeout.bind(window);
  let vt = 0, id = 1, rafs = [];
  const epoch = Date.now();
  const timers = new Map();
  const RealDate = Date;
  class VDate extends RealDate {
    constructor(...a) { if (a.length === 0) super(epoch + vt); else super(...a); }
    static now() { return epoch + vt; }
  }
  window.Date = VDate;
  performance.now = () => vt;
  window.setTimeout = (fn, ms = 0, ...args) => { const i = id++; timers.set(i, { at: vt + Math.max(0, ms || 0), fn, args }); return i; };
  window.setInterval = (fn, ms = 0, ...args) => { const i = id++; const every = Math.max(1, ms || 0); timers.set(i, { at: vt + every, fn, args, every }); return i; };
  window.clearTimeout = window.clearInterval = (i) => { timers.delete(i); };
  window.requestAnimationFrame = (cb) => { const i = id++; rafs.push({ i, cb }); return i; };
  window.cancelAnimationFrame = (i) => { rafs = rafs.filter((r) => r.i !== i); };
  const tracked = new WeakSet();
  const advance = (ms) => {
    const target = vt + ms;
    for (let guard = 0; guard < 5000; guard++) {
      let next = null;
      for (const [i, t] of timers) if (t.at <= target && (!next || t.at < next[1].at)) next = [i, t];
      if (!next) break;
      const [i, t] = next;
      vt = Math.max(vt, t.at);
      if (t.every) t.at += t.every; else timers.delete(i);
      try { if (typeof t.fn === "function") t.fn(...t.args); } catch (e) { console.error(e); }
    }
    vt = target;
    const cbs = rafs; rafs = [];
    for (const r of cbs) { try { r.cb(vt); } catch (e) { console.error(e); } }
    for (const a of document.getAnimations()) {
      try {
        if (!tracked.has(a)) { tracked.add(a); a.pause(); } else if (a.playState === "running") a.pause();
        const end = a.effect?.getComputedTiming().endTime ?? Infinity;
        const cur = (Number(a.currentTime) || 0) + ms * (a.playbackRate || 1);
        if (Number.isFinite(end) && cur >= end) a.finish(); else a.currentTime = cur;
      } catch { /* animation tsalat */ }
    }
  };
  window.__vt = { advance, realTimeout };
  window.__CREDIT = credit;

  localStorage.setItem("token", tok);
  localStorage.setItem("ltd.perf", "high");
  const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const history = {}, reading = {}, salat = {};
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 112; i++) {
    const d = new RealDate(epoch - i * 86400000), boost = 1 - i / 160;
    if (rnd() < 0.86) history[key(d)] = Math.round((40 + rnd() * 260) * boost);
    if (rnd() < 0.8) reading[key(d)] = { ayahs: Math.round(20 + rnd() * 120), seconds: Math.round(600 + rnd() * 2400), pages: Math.round(4 + rnd() * 16) };
    if (i < 7) salat[key(d)] = i === 0 ? ["fajr", "dhuhr"] : ["fajr", "dhuhr", "asr", "maghrib", "isha"].filter(() => i < 4 || rnd() < 0.85);
  }
  localStorage.setItem("ltd.adhkar.history", JSON.stringify(history));
  localStorage.setItem("ltd.reading.log", JSON.stringify(reading));
  localStorage.setItem("ltd.salat.log", JSON.stringify(salat));
  localStorage.setItem("ltd.favorites", JSON.stringify(["2:255", "36:58", "94:5", "55:13", "2:286"]));
  localStorage.setItem("ltd.dua.fav", JSON.stringify(["hasana", "nurana", "sadri"]));
  const addHide = () => {
    const hide = document.createElement("style");
    hide.textContent = 'nextjs-portal{display:none!important}[class*="idText"] p{visibility:hidden!important}';
    (document.head || document.documentElement).appendChild(hide);
  };
  if (document.documentElement) addHide(); else document.addEventListener("DOMContentLoaded", addHide, { once: true });
}, token, CREDIT);
await page.evaluateOnNewDocument(readFileSync(path.join(here, "montage.page.js"), "utf8"));

/* ------------------------------------------------------------------ outils dyal la préparation (bla tasjil) */
const ev = (fn, ...a) => page.evaluate(fn, ...a);
const step = async (ms = 100, real = 20) => {
  await ev((m) => window.__vt.advance(m), ms);
  await ev((r) => new Promise((res) => window.__vt.realTimeout(res, r)), real);
};
// Frame 7a9i9iya sghira: bla biha IntersectionObserver (whileInView) ma kay-khdemch f headless
const poke = () => page.screenshot({ type: "jpeg", quality: 10, clip: { x: 0, y: 0, width: 8, height: 8 } });
const run = async (sec, real = 20) => { for (let i = Math.ceil(sec * 10); i > 0; i--) await step(100, real); };
const count = (sel) => ev((s) => window.__M.qsa(s), sel);
const until = async (sel, max = 12, min = 1) => { for (let i = max * 8; i > 0; i--) { if ((await count(sel)) >= min) return true; await step(100, 110); } console.warn("  ! introuvable:", sel); return false; };
const settle = async () => {
  const max = await ev(() => document.documentElement.scrollHeight - innerHeight);
  for (let y = 0; y <= max + 400; y += 420) {
    await ev((yy) => window.scrollTo({ top: yy, behavior: "instant" }), y);
    await step(160, 50);
    await poke();
    await step(160, 50);
  }
  await run(2.2, 30);
  await ev(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await poke();
  await run(0.6, 30);
};
const go = async (href, ready) => {
  await ev((h) => document.querySelector(`header nav a[href="${h}"]`)?.click(), href);
  await run(0.5);
  await until(ready);
  await run(1.2, 30);
  await settle();
};
const clickText = (text, scope = "button, [role=tab], a") => ev((t, sc) => {
  const el = [...document.querySelectorAll(sc)].filter((e) => e.getBoundingClientRect().width > 2 && e.textContent.trim().toLowerCase().includes(t.toLowerCase())).sort((a, b) => a.textContent.length - b.textContent.length)[0];
  if (el) el.click();
  return !!el;
}, text, scope);
const grab = async (name, sel, idx = 0, meta) => { const ok = await ev((n, s, i, m) => window.__M.grab(n, s, i, m), name, sel, idx, meta ?? null); if (!ok) console.warn("  ! prop manquant:", name); return ok; };
const grabAll = async (name, sel, max = 12, skip) => { const n = await ev((a, s, m, k) => window.__M.grabAll(a, s, m, k), name, sel, max, skip ?? null); if (!n) console.warn("  ! props manquants:", name); return n; };
const esc = async () => { await page.keyboard.press("Escape"); await run(0.5); };

/* ------------------------------------------------------------------ préparation: kan-jbdou les props */
const t0 = Date.now();
console.log(`montage ${PREVIEW ? "(aperçu)" : `${Math.round(W * SCALE)}×${Math.round(H * SCALE)}`} · ${FPS} fps`);
await page.goto(`${APP}/home`, { waitUntil: "domcontentloaded", timeout: 120000 });
await ev(() => new Promise((r) => window.__vt.realTimeout(r, 2500)));
await ev(() => document.fonts.ready);
await run(6.5, 30);            // splash (basmala) kay-sali
await until("@HomeView.astro");
await settle();
await ev(() => window.__M.grabScreen("home.screen"));
await grab("home.astro", "@HomeView.astro");
console.log("  home ✓");

await go("/khatma", "@KhatmaCard.card");
await ev(() => window.__M.captureSprite("orbGold", "@KhatmaOrb3D.canvas canvas", 70));
await grab("khatma.orb", "@KhatmaOrb3D.wrap", 0, { sprite: "orbGold" });
await grabAll("khatma.card", "@KhatmaCard.card", 3, "^\\s*\\S*\\s*test\\b|>\\s*test\\s*<");
console.log("  khatmas ✓");

// Mushaf: n-7ellou khatma (machi "test") w n-jbdou la page b kol 7ala
await ev(() => { const a = [...document.querySelectorAll("main a[href^='/khatma/']")].find((x) => !/\btest\b/i.test(x.textContent)) || document.querySelector("main a[href^='/khatma/']"); a?.click(); });
await until("[id^=ayah-]", 15);
await run(2, 40);
await grab("m.page", "@MushafReader.stage");
await clickText("Lecture");
await run(0.8);
await grab("m.settings", "@ReaderSettings.panel");
if (await clickText("Couleurs du tajweed")) {
  const ok = await until(".tj", 10, 12);
  await esc();
  if (ok) { await run(0.6); await grab("m.tajweed", "@MushafReader.stage"); }
  await clickText("Lecture"); await run(0.6);
  await clickText("Couleurs du tajweed"); await run(0.4);
} else { await clickText("Lecture"); await run(0.6); }
await clickText("Tout cacher"); await run(0.4);
await esc();
await grab("m.hidden", "@MushafReader.stage");
await clickText("Lecture"); await run(0.6);
await clickText("Texte visible"); await run(0.4);
await esc();
await ev(() => document.querySelectorAll("[id^=ayah-]")[2]?.click());
await run(1);
if (await clickText("Tafsir", "[role=tab]")) {
  for (let i = 0; i < 70; i++) { if (await ev(() => (window.__M.qsa("@AyahActionSheet.panel") ? document.querySelector("aside[role=dialog]").textContent.length : 0) > 260)) break; await step(100, 120); }
  await run(0.8, 40);
}
await grab("m.sheet", "aside[role=dialog]");
await esc(); await esc();
await ev(() => { const b = window.__M && [...document.querySelectorAll("nav button")].filter((x) => x.getBoundingClientRect().width > 2); const pager = document.querySelector("[class*='__pager']"); pager?.querySelector("button:last-of-type")?.click(); return !!b; });
await run(2, 40);
await grab("m.page2", "@MushafReader.stage");
console.log("  mushaf ✓");

await go("/hifd", "main h1");
await ev(() => window.__M.captureSprite("orbGreen", "@KhatmaOrb3D.canvas canvas", 70));
await grab("hifd.orb", "@KhatmaOrb3D.wrap", 0, { sprite: "orbGreen" });
await grabAll("hifd.stat", "@HifdView.stat", 4);
await grabAll("hifd.group", "@HifdView.group", 4);
console.log("  hifd ✓");

await go("/salat", "@SalatView.timeAt");
await grab("salat.next", "@SalatView.nextCard");
await grabAll("salat.time", "@SalatView.time", 6);
await grab("salat.qibla", "@SalatView.qibla");
await grabAll("salat.voice", "@AdhanPanel.voice", 13);
await grab("salat.hadithDay", "@SalatView.hadithDay");
await grabAll("salat.hadith", "@SalatView.hadith", 8);
console.log("  salat ✓");

await go("/adhkar", "main h1");
await grabAll("adhkar.cat", "@AdhkarHome.cat", 10);
await grab("adhkar.dial", "@Misbaha.dial");
console.log("  adhkar ✓");

await go("/dua", "@DuaView.card");
await grabAll("dua.time", "@DuaView.timeCard", 5);
await grabAll("dua.card", "@DuaView.card", 9);
console.log("  dou'a ✓");

await go("/profile", "@ProfileDashboard.heat");
await grab("p.level", "@ProfileDashboard.level");
await grabAll("p.kpi", "@ProfileDashboard.kpi", 10);
await grab("p.heat", "@ProfileDashboard.panel", 0);
await grab("p.week", "@ProfileDashboard.panel", 1);
await grab("p.pace", "@ProfileDashboard.panel", 2);
await grab("p.juz", "@ProfileDashboard.panel", 4);
await grabAll("p.badge", "@ProfileDashboard.badge", 10);
console.log(`  profil ✓ — ${await ev(() => Object.keys(window.__M.props).length)} props f ${Math.round((Date.now() - t0) / 1000)}s`);

/* ------------------------------------------------------------------ tasjil */
if (process.env.ONLY) await ev((ids) => window.__M.only(ids), process.env.ONLY.split(","));
const DURATION = await ev(() => window.__M.begin());
writeFileSync(timelineFile, JSON.stringify(await ev(() => window.__M.timeline()), null, 1));
await run(0.5, 30);

// STILLS=18.5,22 -> tsawer b la résolution l-kamla f had les la7dat (bla tasjil), l l-moraja3a
if (process.env.STILLS) {
  const times = process.env.STILLS.split(",").map(Number).sort((a, b) => a - b);
  let cur = 0;
  for (const T of times) {
    for (; cur < T; cur += 0.1) await ev((ms, tt) => { window.__vt.advance(ms); window.__M.frame(tt); }, 100, cur);
    await ev((tt) => { window.__vt.advance(33); window.__M.frame(tt); }, T);
    await ev((r) => new Promise((res) => window.__vt.realTimeout(res, r)), 30);
    writeFileSync(path.join(here, `still-${T.toFixed(1).padStart(5, "0")}.jpg`), await page.screenshot({ type: "jpeg", quality: 90 }));
  }
  if (process.env.SIZES) console.log(JSON.stringify(await ev(() => Object.fromEntries(Object.entries(window.__M.props).map(([n, p]) => [n, `${Math.round(p.w)}x${Math.round(p.h)}`])))));
  await browser.close();
  console.log(`stills: ${times.length}`);
  process.exit(0);
}

const ffmpeg = spawn(ffmpegPath, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
  "-c:v", "libx264", "-preset", PREVIEW ? "veryfast" : "medium", "-crf", PREVIEW ? "27" : "15", "-pix_fmt", "yuv420p", "-movflags", "+faststart", silent], { stdio: ["pipe", "ignore", "inherit"] });
const encoded = new Promise((res, rej) => ffmpeg.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg ${c}`)))));
const total = Math.round(DURATION * FPS), t1 = Date.now();
for (let f = 0; f < total; f++) {
  await ev((ms, T) => { window.__vt.advance(ms); window.__M.frame(T); }, 1000 / FPS, f / FPS);
  await ev((r) => new Promise((res) => window.__vt.realTimeout(res, r)), 6);
  const jpg = await page.screenshot({ type: "jpeg", quality: PREVIEW ? 72 : 94, optimizeForSpeed: true });
  if (!ffmpeg.stdin.write(jpg)) await new Promise((r) => ffmpeg.stdin.once("drain", r));
  if (f % (FPS * 10) === 0) console.log(`  ${Math.round(f / FPS)}s / ${Math.round(DURATION)}s (${Math.round((Date.now() - t1) / 1000)}s réels)`);
}
ffmpeg.stdin.end();
await encoded;
await browser.close();
console.log(`image: ${silent} · ${DURATION.toFixed(1)}s`);
if (!PREVIEW) assemble();
