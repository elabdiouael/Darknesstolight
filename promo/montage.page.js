// MONTAGE — kay-khdem DAKHEL l-page dyal l-app (kay-t-injecta mn montage.mjs).
//  1. "Props": nuskha (clone) mn 3anasir 7a9i9iya dyal l-app (page dyal l-mushaf, tasbih, qibla, cartes...).
//  2. "Scènes": kol scène kat-rekkeb les props f fada2 3D fo9 l-background l-7ay dyal l-app, b texte cinétique.
//  3. Kol 7araka hiya dalla dyal l-we9t t -> t-tasjil frame b frame kay-khrej fluide.
(() => {
  "use strict";
  const W = 1920, H = 1080;
  const M = (window.__M = { props: {}, counts: {}, sprites: {}, T: 0 });

  /* ---------------------------------------------------------------- outils */
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const k = (t, a, d) => clamp((t - a) / d);
  const mix = (a, b, p) => a + (b - a) * p;
  const E = {
    o3: (x) => 1 - Math.pow(1 - x, 3), o5: (x) => 1 - Math.pow(1 - x, 5), i3: (x) => x * x * x, i2: (x) => x * x,
    io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    back: (x) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); },
  };
  const tw = (t, a, d, e = E.o5) => e(k(t, a, d));
  const range = (n) => Array.from({ length: n }, (_, i) => i);
  let seed = 4242;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const lerpO = (a, b, p) => { const o = { ...a }; for (const key of Object.keys(b)) o[key] = mix(a[key] ?? (key === "s" || key === "o" ? 1 : 0), b[key], p); return o; };
  const visible = (e) => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
  const pad = (n) => String(n).padStart(2, "0");
  const parseClock = (s) => { const p = String(s).trim().split(":").map(Number); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : 5400; };
  const clock = (sec) => { const s = Math.max(0, Math.floor(sec)); return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`; };

  /** Sélecteur: CSS 3adi, wla "@Module.classe [reste]" (CSS modules), w " ^" f l-akher = l-parent */
  function qsa(sel, root = document) {
    let up = false;
    if (sel.endsWith(" ^")) { up = true; sel = sel.slice(0, -2); }
    let out;
    if (sel[0] === "@") {
      const m = sel.match(/^@(\w+)\.([\w-]+)(?:\s+(.*))?$/);
      const re = new RegExp(`^${m[1]}-module__[\\w-]+__${m[2]}$`);
      const base = [...root.querySelectorAll(`[class*="${m[1]}-module__"]`)].filter((e) => [...e.classList].some((c) => re.test(c)));
      out = m[3] ? base.flatMap((b) => [...b.querySelectorAll(m[3])]) : base;
    } else out = [...root.querySelectorAll(sel)];
    return up ? out.map((e) => e.parentElement) : out;
  }
  M.qsa = (sel) => qsa(sel).filter(visible).length;
  const q1 = (inst, sel) => (inst ? qsa(sel, inst.el)[0] ?? null : null);
  /** Préfixe dyal CSS module ("Mod-module__hash__") mn dakhel clone */
  const prefixOf = (inst, mod) => {
    if (!inst) return null;
    for (const e of [inst.el, ...inst.el.querySelectorAll(`[class*="${mod}-module__"]`)])
      for (const c of e.classList) { const m = c.match(new RegExp(`^(${mod}-module__.+?__)`)); if (m) return m[1]; }
    return null;
  };

  /* ---------------------------------------------------------------- props */
  function cloneOf(el) {
    const r = el.getBoundingClientRect();
    let vars = "";
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const st = a.getAttribute("style");
      if (st) for (const m of st.matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) vars = `${m[1]}:${m[2]};` + vars;
    }
    const wrap = document.createElement("div");
    wrap.className = "f-prop";
    wrap.style.cssText = `${vars}width:${r.width}px;height:${r.height}px;`;
    const c = el.cloneNode(true);
    const pos = getComputedStyle(el).position;
    Object.assign(c.style, { position: "relative", inset: "auto", margin: "0", transform: "none", width: `${r.width}px`, maxWidth: "none", opacity: "1" });
    if (pos === "fixed" || pos === "absolute") c.style.height = `${r.height}px`;
    c.querySelectorAll("[style]").forEach((n) => { if (n.style.opacity === "0") { n.style.opacity = ""; n.style.transform = ""; } });
    wrap.appendChild(c);
    return { node: wrap, w: r.width, h: r.height };
  }
  M.grab = (name, sel, idx = 0, meta) => {
    const el = qsa(sel).filter(visible)[idx];
    if (!el) return false;
    M.props[name] = Object.assign(cloneOf(el), meta || {});
    return true;
  };
  M.grabAll = (name, sel, max = 12, skip) => {
    const re = skip ? new RegExp(skip, "i") : null;
    const els = qsa(sel).filter(visible).filter((e) => !re || !re.test(e.textContent)).slice(0, max);
    els.forEach((el, i) => { M.props[`${name}.${i}`] = cloneOf(el); });
    M.counts[name] = els.length;
    return els.length;
  };
  /** L-écran kaml dyal l-page (navbar + contenu) dakhel cadre 1920×1080 */
  M.grabScreen = (name) => {
    const wrap = document.createElement("div");
    wrap.className = "f-prop f-screen";
    wrap.style.cssText = `width:${W}px;height:${H}px;overflow:hidden;`;
    for (const sel of ["[data-shell-header]", "main"]) { const el = document.querySelector(sel); if (el) { const c = el.cloneNode(true); c.style.opacity = "1"; wrap.appendChild(c); } }
    M.props[name] = { node: wrap, w: W, h: H };
    return true;
  };
  /** Canvas WebGL (l-orb): kan-sejlou séquence dyal frames bach yb9a 7ay dakhel l-clone */
  M.captureSprite = (name, sel, n = 64, size = 460) => {
    const cv = qsa(sel)[0];
    if (!cv) return 0;
    const r = cv.getBoundingClientRect();
    const ev = (type, x) => { try { cv.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: r.top + r.height / 2, pointerId: 1, bubbles: true })); } catch { /* ignore */ } };
    const frames = [];
    let x = r.left + r.width * 0.3;
    ev("pointerdown", x);
    for (let i = 0; i < n; i++) {
      if (i < 7) { x += 25.2; ev("pointermove", x); }
      if (i === 7) ev("pointerup", x);
      window.__vt.advance(1000 / 30);
      const tmp = document.createElement("canvas");
      tmp.width = tmp.height = size;
      tmp.getContext("2d").drawImage(cv, 0, 0, size, size);
      frames.push(tmp);
    }
    M.sprites[name] = frames;
    return frames.length;
  };

  let live = [];
  function use(root, name, cls) {
    const p = M.props[name];
    if (!p) return null;
    const el = p.node.cloneNode(true);
    if (cls) el.classList.add(...cls.split(" "));
    root.appendChild(el);
    const inst = { el, w: p.w, h: p.h, name, anchor: "c" };
    if (p.sprite) {
      const cv = el.querySelector("canvas");
      if (cv) {
        const n = document.createElement("canvas");
        n.width = n.height = 460;
        n.style.cssText = "display:block;width:100%;aspect-ratio:1;";
        cv.replaceWith(n);
        live.push({ ctx: n.getContext("2d"), frames: M.sprites[p.sprite] || [] });
      }
    }
    return inst;
  }
  function set(i, o) {
    if (!i) return;
    const a = i.anchor === "l" ? "translate(0,-50%)" : i.anchor === "r" ? "translate(-100%,-50%)" : "translate(-50%,-50%)";
    i.el.style.transform = `${a} translate3d(${o.x || 0}px,${o.y || 0}px,${o.z || 0}px) rotateX(${o.rx || 0}deg) rotateY(${o.ry || 0}deg) rotateZ(${o.rz || 0}deg) scale(${o.s == null ? 1 : o.s})`;
    const op = o.o == null ? 1 : o.o;
    i.el.style.opacity = op;
    i.el.style.visibility = op <= 0.001 ? "hidden" : "visible";
    if ("zi" in o) i.el.style.zIndex = o.zi;
    if ("blur" in o) i.el.style.filter = o.blur > 0.3 ? `blur(${o.blur}px)` : "";
  }
  const fit = (i, mw, mh) => (i ? Math.min(mw / i.w, mh / i.h) : 1);
  function txt(root, cls, html, anchor = "c") {
    const el = document.createElement("div");
    el.className = `f-t ${cls}`;
    el.innerHTML = html;
    root.appendChild(el);
    return { el, anchor };
  }
  /** Bloc dyal texte: kicker + stour kay-tel3ou mn t7t (masque) + sous-titre */
  function cap(root, { kick, lines, size = 110, sub, gold = [], anchor = "l" }) {
    const c = txt(root, "f-cap", `<div class="f-kick">${kick}</div>${lines.map((l, i) => `<div class="f-ln" style="font-size:${size}px"><span class="${gold.includes(i) ? "f-gold" : ""}">${l}</span></div>`).join("")}${sub ? `<div class="f-sub2">${sub}</div>` : ""}<i class="f-rule"></i>`, anchor);
    if (anchor === "c") c.el.style.textAlign = "center";
    c.kickEl = c.el.querySelector(".f-kick");
    c.lineEls = [...c.el.querySelectorAll(".f-ln > span")];
    c.subEl = c.el.querySelector(".f-sub2");
    c.rule = c.el.querySelector(".f-rule");
    return c;
  }
  function drawCap(c, t, t0, tEnd) {
    const out = tEnd != null ? tw(t, tEnd, 0.35, E.i3) : 0;
    c.kickEl.style.opacity = tw(t, t0, 0.5, E.o3) * (1 - out);
    c.kickEl.style.letterSpacing = `${mix(1.2, 0.42, tw(t, t0, 1))}em`;
    c.lineEls.forEach((s, i) => { const p = tw(t, t0 + 0.14 + i * 0.13, 0.7); s.style.transform = `translateY(${(1 - p) * 112 - out * 112}%)`; });
    if (c.subEl) c.subEl.style.opacity = tw(t, t0 + 0.5 + c.lineEls.length * 0.13, 0.7, E.o3) * (1 - out);
    c.rule.style.transform = `scaleX(${tw(t, t0 + 0.3, 0.9) * (1 - out)})`;
  }
  const chip = (root, s) => txt(root, "f-chip", s);
  const showChip = (c, t, t0, t1, o) => set(c, { ...o, s: mix(0.7, 1, tw(t, t0, 0.4, E.back)), o: tw(t, t0, 0.25, E.o3) * (1 - tw(t, t1, 0.25, E.i3)) });
  function grp(R) { const g = document.createElement("div"); g.className = "f-scene"; R.appendChild(g); return g; }
  function gset(g, { x = 0, y = 0, s = 1, o = 1, bx = 0 }) {
    g.style.transform = `translate(${x}px,${y}px) scale(${s})`;
    g.style.opacity = o;
    g.style.visibility = o <= 0.001 ? "hidden" : "visible";
    g.style.filter = bx > 1 ? `blur(${Math.min(bx, 26)}px)` : "";
  }

  /* ---------------------------------------------------------------- monde / fx */
  const ctl = () => window.__nourCtl || { warp() {}, mood() {} };
  const warp = (p = 1) => ctl().warp(p);
  const parts = [];
  M.burst = (x, y, n = 70, pow = 10, cols = ["#fff4d6", "#ecd08a", "#d4af37", "#6fc8ff", "#dff6ff"]) => {
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, v = (0.25 + rnd()) * pow * 60;
      parts.push({ x: W / 2 + x, y: H / 2 + y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.5 + rnd() * 1.1, size: 1.5 + rnd() * 4.5, c: cols[Math.floor(rnd() * cols.length)] });
    }
  };
  const fx = {};
  const CSS = `
    html.f-iso body > *:not(#f-world):not([class*="NourBackground-module"]):not(script):not(style):not(svg) { display: none !important; }
    html.f-iso, html.f-iso body { overflow: hidden !important; height: 100vh !important; }
    nextjs-portal { display: none !important; }
    #f-world { position: fixed; inset: 0; z-index: 2147483000; overflow: hidden; pointer-events: none; font-family: "Rajdhani", "Manrope", sans-serif; color: #f5eedb; }
    #f-black { position: absolute; inset: 0; background: #010307; opacity: 0; }
    #f-cam { position: absolute; inset: 0; transform-origin: 50% 50%; }
    .f-scene { position: absolute; inset: 0; perspective: 1700px; perspective-origin: 50% 50%; }
    #f-cam > .f-scene::before { content: ""; position: absolute; inset: -12%; pointer-events: none; background: radial-gradient(54% 48% at 50% 52%, rgba(80,150,255,.24), rgba(40,90,210,.08) 46%, transparent 74%); }
    .f-prop, .f-t { position: absolute; left: 50%; top: 50%; transform-origin: center; }
    .f-prop > * { pointer-events: none; }
    .f-t { white-space: nowrap; line-height: 1; }
    .f-screen { border-radius: 28px; background: rgba(2, 8, 14, 0.92); box-shadow: 0 0 0 2px rgba(120,190,255,.6), 0 70px 170px -20px #000, 0 0 220px -30px rgba(70,140,255,.85); }
    .f-glow { box-shadow: 0 60px 150px -40px #000, 0 0 130px -30px rgba(70,140,255,.75); border-radius: 26px; }
    .f-h { font-weight: 700; letter-spacing: .01em; }
    .f-gold { background: linear-gradient(100deg,#b8922f,#fff4d6 38%,#dff6ff 52%,#ecd08a 64%,#b8922f); -webkit-background-clip: text; background-clip: text; color: transparent; }
    .f-outline { color: transparent; -webkit-text-stroke: 1.5px rgba(245,238,219,.62); }
    .f-ar { font-family: "Amiri Quran", serif; color: #ecd08a; text-shadow: 0 0 44px rgba(212,175,55,.55); }
    .f-sub { font-size: 26px; font-weight: 600; letter-spacing: .5em; color: #9fb3c7; }
    .f-kick { font-size: 30px; font-weight: 700; letter-spacing: .42em; color: #6fc8ff; text-shadow: 0 0 24px rgba(111,200,255,.6); }
    .f-cap .f-kick { margin-bottom: 18px; }
    .f-ln { overflow: hidden; line-height: 1.02; padding-bottom: .07em; font-weight: 700; color: #fff4d6; }
    .f-ln > span { display: inline-block; }
    .f-sub2 { margin-top: 20px; font-size: 32px; font-weight: 500; letter-spacing: .04em; color: #b9c6d6; }
    .f-rule { display: block; margin-top: 22px; width: 220px; height: 4px; border-radius: 4px; background: linear-gradient(90deg,#6fc8ff,#d4af37); transform-origin: left; box-shadow: 0 0 22px rgba(111,200,255,.8); }
    .f-cap[style*="center"] .f-rule { margin-inline: auto; transform-origin: center; }
    .f-chip { font-size: 27px; font-weight: 700; letter-spacing: .14em; padding: 12px 26px; border-radius: 999px; border: 1px solid rgba(120,190,255,.8); background: rgba(4,14,26,.9); box-shadow: 0 0 38px -6px rgba(80,150,255,.95); color: #fff4d6; }
    .f-slam { font-size: 250px; font-weight: 700; color: #fff4d6; text-shadow: 0 0 80px rgba(212,175,55,.5), 0 0 16px rgba(255,244,214,.5); }
    .f-dot { width: 28px; height: 28px; border-radius: 50%; background: radial-gradient(circle,#fff,#ffe9b0 40%,#d4af37); box-shadow: 0 0 90px 34px rgba(255,236,180,.85), 0 0 200px 80px rgba(111,200,255,.35); }
    .f-sweep { width: 240px; height: 1700px; background: linear-gradient(90deg,transparent,rgba(170,215,255,.45),rgba(255,244,214,.85),rgba(170,215,255,.45),transparent); }
    .f-ring { width: 300px; height: 300px; border-radius: 50%; border: 3px solid rgba(160,215,255,.95); box-shadow: 0 0 40px rgba(111,200,255,.9), inset 0 0 30px rgba(236,208,138,.5); }
    .f-hl { position: absolute; border: 3px solid #6fc8ff; border-radius: 16px; box-shadow: 0 0 30px rgba(111,200,255,.95), inset 0 0 18px rgba(111,200,255,.4); pointer-events: none; z-index: 5; }
    .f-wipe { position: absolute; top: -2%; bottom: -2%; width: 5px; background: linear-gradient(180deg,transparent,#fff 15%,#6fc8ff 50%,#fff 85%,transparent); box-shadow: 0 0 40px 10px rgba(111,200,255,.9); z-index: 6; }
    .f-wave { display: flex; align-items: center; gap: 6px; height: 110px; }
    .f-wave i { width: 8px; height: 100%; border-radius: 5px; background: linear-gradient(180deg,#6fc8ff,#ecd08a); transform-origin: center; box-shadow: 0 0 14px rgba(111,200,255,.7); }
    .f-word { font-size: 170px; font-weight: 700; letter-spacing: .06em; color: transparent; -webkit-text-stroke: 2px rgba(190,225,255,.55); }
    .f-pill { font-size: 54px; font-weight: 700; letter-spacing: .42em; padding: 18px 44px 18px 64px; border-radius: 999px; color: #1b1305; background: linear-gradient(135deg,#fff4d6,#d4af37); box-shadow: 0 0 100px -6px rgba(212,175,55,.95); }
    .f-credit { text-align: center; }
    .f-credit small { display: block; font-size: 30px; font-weight: 700; letter-spacing: .5em; color: #6fc8ff; }
    .f-credit strong { display: block; margin: 14px 0 10px; font-size: 128px; font-weight: 700; letter-spacing: .08em; line-height: 1; color: #fff4d6; text-shadow: 0 0 60px rgba(111,200,255,.45); }
    .f-credit span { font-size: 40px; font-weight: 600; letter-spacing: .26em; color: #b9c6d6; }
    #f-sparks, #f-grain { position: absolute; inset: 0; width: 100%; height: 100%; }
    #f-grain { opacity: .07; mix-blend-mode: overlay; image-rendering: pixelated; }
    #f-flash { position: absolute; inset: 0; background: radial-gradient(circle,#fff,#cfe6ff 60%,#9cc8ff); opacity: 0; }
    #f-vig { position: absolute; inset: 0; background: radial-gradient(ellipse at center,transparent 52%,rgba(0,2,6,.62) 100%); }
    .f-bar { position: absolute; left: 0; right: 0; height: 0; background: #000; }
    #f-barT { top: 0; } #f-barB { bottom: 0; }
    #f-hud { position: absolute; inset: 0; opacity: 0; }
    #f-hud b { position: absolute; top: 44px; left: 60px; font-size: 22px; font-weight: 700; letter-spacing: .36em; color: #fff4d6; }
    #f-hud em { position: absolute; top: 44px; right: 60px; font-style: normal; font-size: 22px; font-weight: 700; letter-spacing: .3em; color: #6fc8ff; }
    #f-hud i { position: absolute; left: 60px; right: 60px; bottom: 46px; height: 3px; border-radius: 3px; background: rgba(255,244,214,.12); overflow: hidden; }
    #f-hud i u { display: block; height: 100%; transform-origin: left; background: linear-gradient(90deg,#6fc8ff,#ecd08a,#fff4d6); }
    #f-hud s { position: absolute; width: 46px; height: 46px; border: 0 solid rgba(120,190,255,.75); }
    #f-hud s:nth-of-type(1) { top: 26px; left: 26px; border-top-width: 2px; border-left-width: 2px; } #f-hud s:nth-of-type(2) { top: 26px; right: 26px; border-top-width: 2px; border-right-width: 2px; }
    #f-hud s:nth-of-type(3) { bottom: 26px; left: 26px; border-bottom-width: 2px; border-left-width: 2px; } #f-hud s:nth-of-type(4) { bottom: 26px; right: 26px; border-bottom-width: 2px; border-right-width: 2px; }
  `;
  M.begin = () => {
    const st = document.createElement("style"); st.textContent = CSS; document.documentElement.appendChild(st);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "0"); svg.setAttribute("height", "0"); svg.style.position = "absolute";
    svg.innerHTML = `<filter id="f-rgb" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r"/><feOffset in="r" dx="10" dy="0" result="ro"/>
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g"/>
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b"/><feOffset in="b" dx="-10" dy="0" result="bo"/>
        <feBlend in="ro" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="bo" mode="screen"/></filter>
      <filter id="f-mb" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0 0"/></filter>`;
    document.body.appendChild(svg);
    fx.rgb = [...svg.querySelectorAll("#f-rgb feOffset")];
    fx.mb = svg.querySelector("#f-mb feGaussianBlur");
    const w = document.createElement("div"); w.id = "f-world";
    w.innerHTML = `<div id="f-black"></div><div id="f-cam"></div><canvas id="f-sparks" width="${W}" height="${H}"></canvas><div id="f-vig"></div><canvas id="f-grain" width="384" height="216"></canvas>
      <div id="f-hud"><b>FROM DARKNESSES TO LIGHT</b><em></em><i><u></u></i><s></s><s></s><s></s><s></s></div><div id="f-barT" class="f-bar"></div><div id="f-barB" class="f-bar"></div><div id="f-flash"></div>`;
    document.body.appendChild(w);
    for (const id of ["black", "cam", "sparks", "grain", "hud", "barT", "barB", "flash"]) fx[id] = w.querySelector(`#f-${id}`);
    fx.sctx = fx.sparks.getContext("2d");
    fx.gctx = fx.grain.getContext("2d");
    fx.gimg = fx.gctx.createImageData(384, 216);
    document.documentElement.classList.add("f-iso");
    window.scrollTo({ top: 0, behavior: "instant" });
    let t0 = 0;
    for (const sc of SC) { sc.start = t0; t0 += sc.dur; }
    M.duration = t0;
    return t0;
  };
  const black = (a) => { fx.black.style.opacity = a; };

  /* ---------------------------------------------------------------- scènes */
  const SC = [];
  const AYAH = "يُخْرِجُهُم مِّنَ ٱلظُّلُمَٰتِ إِلَى ٱلنُّورِ";

  // ===== 0 · Mn d-dalam l n-nour =====
  SC.push({
    id: "open", dur: 6.2, world: { calm: false, star: true }, tout: "zoomIn", bars: (t) => 150 * (1 - tw(t, 3, 0.8)),
    sfx: [[0.7, "riser", 2.25], [3.0, "boom"], [3.05, "shimmer"], [4.1, "whoosh"]],
    fire: [[3.0, () => { warp(1); M.burst(0, 0, 170, 17); }]],
    build(S, R) {
      S.ar = txt(R, "f-ar", AYAH); S.ar.el.style.fontSize = "104px";
      S.sub = txt(R, "f-sub", "IL LES FAIT SORTIR DES TÉNÈBRES VERS LA LUMIÈRE");
      S.dot = txt(R, "f-dot", "");
      S.t1 = txt(R, "f-outline f-h", "FROM DARKNESSES"); S.t1.el.style.fontSize = "128px";
      S.t2 = txt(R, "f-gold f-h", "TO LIGHT"); S.t2.el.style.fontSize = "370px";
      S.sw = txt(R, "f-sweep", "");
      S.tag = txt(R, "f-kick", "UN UNIVERS POUR VOTRE FOI");
    },
    draw(S, t) {
      black(t < 3 ? 1 : 1 - tw(t, 3, 0.9, E.o3));
      const col = tw(t, 2.25, 0.7, E.i3);
      set(S.ar, { y: -30, s: mix(1 + t * 0.018, 0.02, col), o: tw(t, 0.4, 1.3, E.o3) * (1 - k(t, 2.8, 0.15)) });
      set(S.sub, { y: 120, o: tw(t, 1.1, 1, E.o3) * (1 - tw(t, 2.0, 0.4, E.i3)) });
      S.sub.el.style.letterSpacing = `${mix(1, 0.5, tw(t, 1.1, 1.8))}em`;
      set(S.dot, { s: t < 3 ? mix(0.1, 1, k(t, 2.3, 0.7)) : 1 + tw(t, 3, 0.6, E.o3) * 80, o: k(t, 2.3, 0.3) * (1 - k(t, 3.05, 0.6)) });
      set(S.t1, { y: -200, o: tw(t, 3.2, 0.5, E.o3) });
      S.t1.el.style.letterSpacing = `${mix(1.3, 0.14, tw(t, 3.2, 1.5))}em`;
      set(S.t2, { y: 30, s: mix(2.6, 1, tw(t, 3.4, 1)) * (1 + Math.max(0, t - 3.4) * 0.012), o: tw(t, 3.4, 0.3, E.o3) });
      set(S.sw, { x: mix(-1500, 1500, tw(t, 4.1, 0.8, E.io)), rz: 18, o: t > 4.1 && t < 4.9 ? 0.7 : 0 });
      set(S.tag, { y: 270, o: tw(t, 4.6, 0.6, E.o3) });
      S.tag.el.style.letterSpacing = `${mix(1.2, 0.5, tw(t, 4.6, 1.2))}em`;
    },
  });

  // ===== 1 · Les mots =====
  SC.push({
    id: "words", dur: 4.9, world: { calm: false, star: false }, tin: "zoomIn", tout: "whipL",
    sfx: [[0, "hit", 0], [0.85, "hit", 2], [1.7, "hit", 4], [2.55, "hit", 6], [3.4, "boom"], [3.45, "shimmer"]],
    fire: [[3.4, () => { warp(0.8); M.burst(0, 40, 90, 12); }]],
    build(S, R) {
      S.b = [["LIRE.", "m.page"], ["MÉMORISER.", "hifd.orb"], ["PRIER.", "home.astro"], ["INVOQUER.", "dua.card.0"]].map(([w, p]) => ({ p: use(R, p), w: txt(R, "f-slam", w) }));
      S.u1 = txt(R, "f-h f-outline", "UN SEUL"); S.u1.el.style.fontSize = "150px";
      S.u2 = txt(R, "f-h f-gold", "UNIVERS."); S.u2.el.style.fontSize = "310px";
    },
    draw(S, t) {
      S.b.forEach((b, i) => {
        const lt = t - i * 0.85, on = lt >= 0 && lt < 0.85 && t < 3.4, u = clamp(lt / 0.85);
        const f = fit(b.p, 1150, 780);
        set(b.p, { x: mix(190, -90, u), y: 10, ry: mix(-36, -14, u), rx: 8, s: f * mix(1.02, 1.22, u), o: on ? 0.55 : 0, zi: 1, blur: 2 });
        set(b.w, { s: mix(2.3, 1, tw(lt, 0, 0.28)) * (1 + Math.max(0, lt) * 0.05), o: on ? 1 : 0, zi: 2 });
        b.w.el.style.letterSpacing = `${mix(0.5, 0.04, tw(lt, 0, 0.5))}em`;
      });
      set(S.u1, { y: -190, o: t >= 3.4 ? tw(t, 3.4, 0.25, E.o3) : 0, s: mix(1.7, 1, tw(t, 3.4, 0.5)) });
      set(S.u2, { y: 40, o: t >= 3.62 ? 1 : 0, s: mix(2.6, 1, tw(t, 3.62, 0.6)) * (1 + Math.max(0, t - 3.62) * 0.02) });
    },
  });

  // ===== 2 · Rotation d'écran =====
  SC.push({
    id: "screen", dur: 6.6, world: { calm: true, star: false }, tin: "whipL", tout: "zoomIn", hud: "L'APPLICATION",
    sfx: [[0.15, "swell", 1.3], [1.5, "shimmer"], [4.4, "riser", 2.0]],
    build(S, R) {
      S.s = use(R, "home.screen");
      S.c = cap(R, { kick: "L'APPLICATION", lines: ["TOUT VOTRE", "CHEMIN.", "UN SEUL LIEU."], size: 112, gold: [2], sub: "Coran · Prière · Hifd · Adhkar · Dou'a" });
      S.dx = 380; S.dy = -60;
      const a = S.s && qsa("@HomeView.astro", S.s.el)[0];
      if (a) { const r = a.getBoundingClientRect(), w = S.s.el.getBoundingClientRect(); S.dx = r.left + r.width / 2 - (w.left + w.width / 2); S.dy = r.top + r.height / 2 - (w.top + w.height / 2); }
    },
    draw(S, t) {
      const a = tw(t, 0, 1.7), z = tw(t, 4.5, 2.1, E.io), Z = 2.9;
      set(S.s, {
        x: mix(mix(950, 420, a), -S.dx * Z, z), y: mix(mix(40, 0, a), -S.dy * Z, z),
        ry: mix(mix(-82, -22, a) + (t > 1.7 ? (t - 1.7) * 1.7 : 0), 0, z), rx: mix(9, 0, z), rz: mix(-3, 0, a), s: mix(0.64, Z, z),
      });
      set(S.c, { x: -880, y: -10 });
      drawCap(S.c, t, 0.55, 4.3);
    },
  });

  // ===== 3 · La prière =====
  SC.push({
    id: "prayer", dur: 9.4, world: { calm: true, star: false }, tin: "zoomOut", tout: "whipU", hud: "01 — LA PRIÈRE",
    sfx: [[0.1, "impact"], [0.7, "chime"], [4.0, "whoosh"], [4.8, "wobble", 2.4], [7.4, "chime"], [4.55, "pop", 0], [4.62, "pop", 1], [4.69, "pop", 2], [4.76, "pop", 3], [4.83, "pop", 4], [4.9, "pop", 5], [4.7, "swell", 1.6], [6.5, "shimmer"],
      ...range(6).map((i) => [5.85 + i * 0.07, "tick", i])],
    build(S, R) {
      S.A = grp(R); S.B = grp(R);
      S.astro = use(S.A, "home.astro");
      { const h = S.astro && S.astro.el.querySelector("[class*='__astroHint']"); if (h) h.style.visibility = "hidden"; }
      S.c = cap(S.A, { kick: "LA PRIÈRE", lines: ["CHAQUE HEURE,", "À L'HEURE."], size: 112, gold: [1], sub: "Vos cinq prières autour de votre journée" });
      S.cnt = q1(S.astro, "@HomeView.count");
      S.sec = S.cnt ? parseClock(S.cnt.textContent) : 5000;
      S.next = use(S.B, "salat.next");
      S.rows = range(6).map((i) => use(S.B, `salat.time.${i}`));
      S.q = use(S.B, "salat.qibla");
      S.v = range(6).map((i) => use(S.B, `salat.voice.${i + 1}`));
      S.needle = S.q && S.q.el.querySelector("g[class*='__needle']");
      S.bear = S.needle ? parseFloat((S.needle.getAttribute("transform") || "rotate(95").slice(7)) : 95;
      S.ncnt = q1(S.next, "@SalatView.count");
      S.l1 = chip(S.B, "QIBLA"); S.l2 = chip(S.B, "13 VOIX D'ADHAN"); S.l3 = chip(S.B, "HORAIRES · IQAMA · RAPPELS");
    },
    draw(S, t) {
      const ex = tw(t, 4.0, 0.4, E.i3);
      gset(S.A, { x: -ex * 2600, bx: ex * 26, o: t < 4.45 ? 1 : 0 });
      const el = S.astro && S.astro.el.firstElementChild;
      if (el) { el.style.setProperty("--tx", `${Math.sin(t * 0.9) * 10}deg`); el.style.setProperty("--ty", `${Math.cos(t * 0.7) * 7}deg`); }
      set(S.astro, { x: -440, y: 20, s: mix(2.7, 1.8, tw(t, 0, 1.2)), rz: mix(-9, 0, tw(t, 0, 1.4)) });
      if (S.cnt) S.cnt.textContent = clock(S.sec - t);
      set(S.c, { x: 120, y: -10 });
      drawCap(S.c, t, 0.6);
      const b = 1 - tw(t, 4.25, 0.55), u = t - 4.3;
      gset(S.B, { x: b * 2600, bx: b * 26, o: t > 4.2 ? 1 : 0 });
      set(S.next, { x: -520, y: -290 + (1 - tw(u, 0, 0.6)) * -220, ry: 16, s: fit(S.next, 640, 330), o: tw(u, 0, 0.35, E.o3) });
      S.rows.forEach((r, i) => { const p = tw(u, 0.25 + i * 0.07, 0.5); set(r, { x: -520 - (1 - p) * 320, y: -62 + i * 86, ry: 16, s: fit(r, 700, 78), o: p }); });
      const pq = tw(u, 0.15, 0.9);
      set(S.q, { x: 420, y: -125, ry: -14 + u * 1.3, s: fit(S.q, 760, 560) * mix(0.75, 1, pq), o: pq });
      if (S.needle) { const w = k(u, 0.5, 2.4); S.needle.setAttribute("transform", `rotate(${S.bear + 240 * Math.exp(-3.2 * w) * Math.cos(10 * w) * (1 - w)} 100 100)`); }
      S.v.forEach((v, i) => { const p = tw(u, 1.55 + i * 0.07, 0.4, E.back); set(v, { x: 150 + (i % 3) * 270, y: 248 + Math.floor(i / 3) * 88, s: fit(v, 250, 72) * p, o: k(u, 1.55 + i * 0.07, 0.15) }); });
      showChip(S.l1, u, 1.0, 99, { x: 420, y: -425, zi: 9 });
      showChip(S.l2, u, 2.1, 99, { x: 420, y: 432, zi: 9 });
      showChip(S.l3, u, 0.8, 99, { x: -520, y: 458, zi: 9 });
      if (S.ncnt) S.ncnt.textContent = clock(S.sec - t);
    },
  });

  // ===== 4 · Le Mushaf =====
  const THS = [["madina", 1], ["parchment", 2], ["sepia", 3], ["andalus", 4], ["rose", 5], ["lapis", 6], ["kiswa", 7], ["night", 8], ["emerald", 0]];
  const TH0 = 4.3, THD = 0.36;
  SC.push({
    id: "mushaf", dur: 16.2, world: { calm: true, star: false }, tin: "whipU", tout: "whipL", hud: "02 — LE MUSHAF",
    sfx: [[0.15, "paper"], [0.3, "swell", 1], [3.6, "whoosh"], ...THS.map((_, i) => [TH0 + i * THD, "pop", i]), [7.6, "whoosh"], [8.2, "riser", 1.5], [9.75, "shimmer"],
      [10.4, "whoosh"], [10.75, "pop", 3], [13.3, "whoosh"], [13.5, "whoosh", 0.6], [14.1, "whoosh", 0.6], ...range(8).map((i) => [13.9 + i * 0.11, "tick", i]), [15.1, "paper"], [15.3, "paper"]],
    build(S, R) {
      S.page = use(R, "m.page"); S.taj = use(R, "m.tajweed"); S.hid = use(R, "m.hidden"); S.p2 = use(R, "m.page2");
      S.set = use(R, "m.settings", "f-glow"); S.sheet = use(R, "m.sheet", "f-glow");
      S.f = fit(S.page, 1500, 880);
      S.cA = cap(R, { kick: "LE MUSHAF", lines: ["UNE LECTURE", "VIVANTE."], size: 134, gold: [1], sub: "Page par page, comme le mushaf de Médine" });
      S.num = txt(R, "f-h f-gold", "1"); S.num.el.style.fontSize = "340px";
      S.numL = txt(R, "f-kick", "THÈMES");
      S.lC = chip(R, "TAJWEED EN COULEURS"); S.lD = chip(R, "TAFSIR · TRADUCTIONS · MOT À MOT"); S.lE = chip(R, "MODE MÉMORISATION"); S.lF = chip(R, "SURLIGNEUR · FAVORIS · RÉCITATION");
      S.wL = txt(R, "f-h", "CACHEZ."); S.wR = txt(R, "f-h f-gold", "RÉCITEZ."); S.wL.el.style.fontSize = S.wR.el.style.fontSize = "112px";
      S.stage = S.page && S.page.el.firstElementChild;
      if (S.set) {
        const wr = S.set.el.getBoundingClientRect();
        S.btn = [...S.set.el.querySelectorAll("button")].filter((b) => b.querySelector(".quran-text")).map((b) => { const r = b.getBoundingClientRect(); return { l: r.left - wr.left, t: r.top - wr.top, w: r.width, h: r.height }; });
        S.ring = document.createElement("div"); S.ring.className = "f-hl"; S.set.el.appendChild(S.ring);
      }
      if (S.taj) { S.wipe = document.createElement("div"); S.wipe.className = "f-wipe"; S.taj.el.appendChild(S.wipe); }
      const px = prefixOf(S.hid, "MushafReader");
      S.veils = S.hid ? [...S.hid.el.querySelectorAll("[class*='__veil']")].map((e) => ({ e, c: [...e.classList].find((c) => /__veil$/.test(c)) })) : [];
      S.pre = prefixOf(S.page, "MushafReader"); S.px = px; S.theme = ""; S.sel = false;
    },
    draw(S, t) {
      const f = S.f, a = tw(t, 0, 1.3);
      let P = { x: mix(0, 440, a), y: mix(1000, 0, a), rx: mix(60, 5, a), ry: mix(0, -21, a) + (t > 1.3 ? (t - 1.3) * 1.9 : 0), s: f * mix(0.6, 0.93, a) };
      P = lerpO(P, { x: 190, y: 0, rx: 0, ry: -8, s: f * 0.9 }, tw(t, 3.6, 0.7));
      let theme = "emerald", pop = 0, idx = -1;
      THS.forEach(([th], i) => { const ti = TH0 + i * THD; if (t >= ti) { theme = th; idx = i; pop = Math.exp(-(t - ti) * 10); } });
      if (S.stage && theme !== S.theme) { S.stage.setAttribute("data-theme", theme); S.theme = theme; }
      P.s *= 1 + 0.05 * pop;
      P = lerpO(P, { x: 0, y: 240, rx: 0, ry: 0, s: f * 1.55 }, tw(t, 7.7, 0.7, E.io));
      P = lerpO(P, { x: -450, y: 0, rx: 0, ry: 17, s: f * 0.8 }, tw(t, 10.4, 0.7));
      const e = tw(t, 13.4, 0.45, E.o3);
      const wipe = tw(t, 8.2, 1.5, E.io);
      set(S.page, { ...P, o: (S.taj && t > 9.9 ? 0 : 1) * (1 - e), zi: 2 });
      if (S.taj) {
        set(S.taj, { ...P, o: t < 7.9 ? 0 : 1 - e, zi: 3 });
        S.taj.el.style.clipPath = `inset(-3% 0 -3% ${100 - wipe * 100}%)`;
        S.wipe.style.left = `${100 - wipe * 100}%`;
        S.wipe.style.opacity = wipe > 0.01 && wipe < 0.99 ? 1 : 0;
      }
      if (t > 10.55 && !S.sel) {
        S.sel = true;
        for (const [inst, pre] of [[S.taj, prefixOf(S.taj, "MushafReader")], [S.page, S.pre]]) { const ay = inst && pre && inst.el.querySelectorAll("[id^='ayah-']")[2]; if (ay) ay.classList.add(`${pre}isSelected`); }
      }
      // réglages + anneau 3la les thèmes
      const si = tw(t, 3.7, 0.7), so = tw(t, 7.4, 0.4, E.i3);
      set(S.set, { x: mix(-1500, -690, si) - so * 1100, y: 0, ry: 26, s: fit(S.set, 470, 900), o: t > 3.6 && t < 7.9 ? 1 : 0, zi: 4 });
      if (S.ring && S.btn) { const b = S.btn[idx < 0 ? 0 : THS[idx][1]] || S.btn[0]; if (b) Object.assign(S.ring.style, { left: `${b.l - 5}px`, top: `${b.t - 5}px`, width: `${b.w + 4}px`, height: `${b.h + 4}px`, opacity: t > TH0 - 0.2 ? 1 : 0 }); }
      const nv = tw(t, 4.2, 0.3, E.o3) * (1 - tw(t, 7.3, 0.3, E.i3));
      if (idx >= 0) S.num.el.textContent = String(idx + 1);
      set(S.num, { x: 800, y: -290, s: 1 + 0.25 * pop, o: nv });
      set(S.numL, { x: 800, y: -100, o: nv });
      set(S.cA, { x: -880, y: -20 });
      drawCap(S.cA, t, 0.5, 3.25);
      showChip(S.lC, t, 8.1, 10.2, { y: 455, zi: 9 });
      // tafsir
      const hi = tw(t, 10.65, 0.8), ho = tw(t, 13.15, 0.4, E.i3);
      set(S.sheet, { x: mix(1700, 540, hi) + ho * 1500, y: -20, ry: -16, s: fit(S.sheet, 720, 900), o: t > 10.5 && t < 13.7 ? 1 : 0, zi: 5 });
      showChip(S.lD, t, 11.0, 13.1, { x: 0, y: 455, zi: 9 });
      // mémorisation
      const fl = tw(t, 15.1, 0.5, E.i3);
      set(S.hid, { x: -fl * 300, y: 30, ry: -fl * 96, s: f * 0.92 * mix(0.85, 1, e), o: e * (1 - k(t, 15.45, 0.15)), zi: 6 });
      S.veils.forEach((v, i) => { if (v.c && t > 13.9 + i * 0.11) { v.e.classList.remove(v.c); v.c = null; } });
      showChip(S.lE, t, 13.7, 15.0, { y: 455, zi: 9 });
      { const a1 = tw(t, 13.55, 0.5), a2 = tw(t, 14.15, 0.5), o2 = 1 - tw(t, 14.95, 0.25, E.i3);
        set(S.wL, { x: -680 - (1 - a1) * 160, y: 0, o: a1 * o2 }); set(S.wR, { x: 680 + (1 - a2) * 160, y: 0, o: a2 * o2 }); }
      const fi = tw(t, 15.3, 0.6);
      set(S.p2, { x: (1 - fi) * 300, y: 30, ry: (1 - fi) * 96, s: f * 0.92, o: t > 15.3 ? 1 : 0, zi: 7 });
      showChip(S.lF, t, 15.45, 99, { y: 455, zi: 9 });
    },
  });

  // ===== 5 · Hifd =====
  SC.push({
    id: "hifd", dur: 7.2, world: { calm: true, star: false }, tin: "whipL", tout: "spin", hud: "03 — HIFD",
    sfx: [[0.2, "swell", 0.9], [0.9, "impact"], ...range(4).map((i) => [0.9 + i * 0.1, "pop", i + 2]), ...range(4).map((i) => [2.4 + i * 0.1, "pop", i]), [3.2, "voice", 3.4]],
    build(S, R) {
      S.orb = use(R, "hifd.orb");
      S.st = range(4).map((i) => use(R, `hifd.stat.${i}`));
      S.g = range(3).map((i) => use(R, `hifd.group.${i}`));
      S.c = cap(R, { kick: "HIFD", lines: ["MÉMORISEZ.", "RETENEZ."], size: 130, gold: [1], sub: "Répétition espacée · tasmi' vocal · plans sur mesure" });
      S.wave = txt(R, "f-wave", range(46).map(() => "<i></i>").join(""));
      S.bars = [...S.wave.el.children];
      S.mic = chip(R, "RÉCITEZ — L'APP VOUS ÉCOUTE");
    },
    draw(S, t) {
      set(S.orb, { x: -520, y: 0, s: fit(S.orb, 620, 620) * mix(0.3, 1, tw(t, 0.1, 1.1, E.back)), rz: mix(-20, 0, tw(t, 0.1, 1.3)), o: tw(t, 0.1, 0.4, E.o3) });
      S.st.forEach((s, i) => { const an = ((-54 + i * 36) * Math.PI) / 180, p = tw(t, 0.9 + i * 0.1, 0.6, E.back); set(s, { x: -520 + Math.cos(an) * 450 * p, y: Math.sin(an) * 450 * p, s: fit(s, 250, 130) * p, o: k(t, 0.9 + i * 0.1, 0.2), zi: 6 }); });
      const open = tw(t, 2.4, 0.9);
      S.g.forEach((g, i) => { const p = tw(t, 2.3 + i * 0.1, 0.7), f = fit(g, 430, 300), d = i - 1; set(g, { x: 520 + d * 300 * open, y: 325 + (1 - p) * 500 + Math.abs(d) * 22, rz: d * 4 * open, ry: -d * 12, s: f, o: p, zi: 5 - Math.abs(d) }); });
      set(S.c, { x: 110, y: -245 });
      drawCap(S.c, t, 0.5);
      const env = tw(t, 3.1, 0.6, E.o3);
      S.bars.forEach((b, i) => { b.style.transform = `scaleY(${0.1 + 0.9 * env * Math.abs(Math.sin(t * 8.5 + i * 0.6) * Math.cos(t * 3.1 + i * 0.23))})`; });
      set(S.wave, { x: 520, y: 40, o: env });
      showChip(S.mic, t, 3.5, 99, { x: 520, y: 135 });
    },
  });

  // ===== 6 · Adhkar + Tasbih =====
  const TAP0 = 3.95, TAPD = 3.0, TAPS = 33;
  const tapAt = (j) => TAP0 + TAPD * Math.pow(j / TAPS, 0.78);
  SC.push({
    id: "tasbih", dur: 8.4, world: { calm: true, star: false }, tin: "spin", tout: "zoomIn", hud: "04 — ADHKAR & TASBIH",
    sfx: [...range(10).map((i) => [0.25 + i * 0.07, "pop", i]), [3.3, "whoosh"], ...range(TAPS).map((j) => [tapAt(j + 1), "bead", j]), [tapAt(TAPS) + 0.02, "boom"], [tapAt(TAPS) + 0.05, "shimmer"]],
    fire: [[tapAt(TAPS), () => { warp(0.7); M.burst(-330, 20, 150, 15); }]],
    build(S, R) {
      S.cats = range(10).map((i) => use(R, `adhkar.cat.${i}`)).filter(Boolean);
      S.cA = cap(R, { kick: "ADHKAR", lines: ["MATIN. SOIR.", "APRÈS LA PRIÈRE."], size: 92, gold: [1], anchor: "c" });
      S.dial = use(R, "adhkar.dial");
      S.cB = cap(R, { kick: "TASBIH", lines: ["33 PERLES.", "UN GESTE."], size: 132, gold: [1], sub: "Votre misbaha, toujours avec vous" });
      S.rings = range(5).map(() => txt(R, "f-ring", ""));
      if (S.dial) {
        S.strong = S.dial.el.querySelector("strong");
        S.beads = [...S.dial.el.querySelectorAll("svg circle")].slice(1);
        S.pre = prefixOf(S.dial, "Misbaha");
      }
      S.n = -1;
    },
    draw(S, t) {
      const out = tw(t, 3.3, 0.5, E.i3);
      S.cats.forEach((c, i) => {
        const col = i % 5, row = Math.floor(i / 5), p = tw(t, -0.25 + i * 0.06, 0.8);
        set(c, { x: (col - 2) * 430 - t * 40 + 80, y: (row - 0.5) * 360 + 150 + (1 - p) * 500, z: (col - 2) * -90 - (1 - p) * 900 - out * 1600, ry: -22, rx: 10, s: fit(c, 400, 320), o: p * (1 - out), zi: 1 });
      });
      set(S.cA, { y: -335 });
      drawCap(S.cA, t, 0.4, 3.1);
      // misbaha
      const d = tw(t, 3.45, 0.8, E.back), n = t < TAP0 ? 0 : Math.min(TAPS, range(TAPS).filter((j) => tapAt(j + 1) <= t).length);
      const last = n > 0 ? tapAt(n) : -9, kick = Math.exp(-(t - last) * 16), base = S.dial ? 640 / S.dial.w : 1;
      const done = t >= tapAt(TAPS) ? Math.exp(-(t - tapAt(TAPS)) * 5) : 0;
      set(S.dial, { x: -330, y: 20, s: base * mix(0.3, 1, d) * (1 + 0.045 * kick + 0.12 * done), rz: (1 - d) * -40, o: k(t, 3.45, 0.25), zi: 3 });
      if (S.dial && n !== S.n) {
        S.n = n;
        if (S.strong) S.strong.textContent = String(n);
        S.beads.forEach((b, i) => { const on = i < Math.round((n / TAPS) * S.beads.length); if (S.pre) b.setAttribute("class", `${S.pre}${on ? "beadOn" : "bead"}`); b.setAttribute("r", on ? "7.5" : "6"); });
      }
      S.rings.forEach((r, i) => { const j = n - i, lt = j > 0 ? t - tapAt(j) : 9; set(r, { x: -330, y: 20, s: mix(0.9, 2.6, tw(lt, 0, 0.55, E.o3)), o: lt < 0.55 ? 0.8 * (1 - k(lt, 0, 0.55)) : 0, zi: 2 }); });
      set(S.cB, { x: 130, y: -10 });
      drawCap(S.cB, t, 3.9);
    },
  });

  // ===== 7 · Dou'a + Hadiths =====
  SC.push({
    id: "dua", dur: 9.4, world: { calm: true, star: false }, tin: "zoomIn", tout: "glitch", hud: "05 — DOU'A & HADITHS",
    sfx: [[0.1, "impact"], [0.3, "swell", 1.2], [0.4, "count", 1.6], [4.95, "count", 1.4], ...range(5).map((i) => [2.5 + i * 0.1, "pop", i + 3]), [4.5, "whoosh"], [4.9, "impact"], ...range(6).map((i) => [6.3 + i * 0.13, "tick", i])],
    build(S, R) {
      S.A = grp(R); S.B = grp(R);
      S.cards = range(8).map((i) => use(S.A, `dua.card.${i}`)).filter(Boolean);
      S.num = txt(S.A, "f-h f-gold", "0"); S.num.el.style.fontSize = "250px";
      S.cA = cap(S.A, { kick: "LE DOU'A", lines: ["INVOCATIONS"], size: 92, sub: "Du Coran et de la Sunna, avec leurs sources" });
      S.times = range(5).map((i) => use(S.A, `dua.time.${i}`)).filter(Boolean);
      S.hd = use(S.B, "salat.hadithDay", "f-glow");
      S.hs = range(6).map((i) => use(S.B, `salat.hadith.${i}`)).filter(Boolean);
      S.n2 = txt(S.B, "f-h f-gold", "0"); S.n2.el.style.fontSize = "250px";
      S.cB = cap(S.B, { kick: "HADITHS", lines: ["AUTHENTIQUES"], size: 92, sub: "Sur la prière, classés par thème" });
      S.tp = ["MÉRITES", "À L'HEURE", "EN GROUPE", "PURIFICATION", "ADHAN", "VENDREDI"].map((s) => chip(S.B, s));
    },
    draw(S, t) {
      const ex = tw(t, 4.45, 0.4, E.i3);
      gset(S.A, { y: -ex * 1500, bx: ex * 22, o: t < 4.9 ? 1 : 0 });
      const pos = -1.2 + t * 1.25;
      S.cards.forEach((c, i) => { const u = i - pos, au = Math.abs(u); set(c, { x: u * 720 + 200, y: 30, z: -au * 320, ry: clamp(-u * 40, -72, 72), s: fit(c, 840, 540) * (1 + 0.1 * Math.max(0, 1 - au)), o: clamp(1.6 - au * 0.5), zi: 10 - Math.round(au * 2) }); });
      S.num.el.textContent = String(Math.round(42 * tw(t, 0.4, 1.6, E.o3)));
      set(S.num, { x: -700, y: -330, o: tw(t, 0.3, 0.4, E.o3) });
      set(S.cA, { x: -520, y: -320 });
      drawCap(S.cA, t, 0.5);
      S.times.forEach((c, i) => { const p = tw(t, 2.5 + i * 0.1, 0.5, E.back); set(c, { x: (i - 2) * 350, y: 425, s: fit(c, 330, 140) * p, o: k(t, 2.5 + i * 0.1, 0.15), zi: 20 }); });
      const b = 1 - tw(t, 4.6, 0.5), u = t - 4.65;
      gset(S.B, { y: b * 1500, bx: b * 22, o: t > 4.55 ? 1 : 0 });
      S.hs.forEach((h, i) => { const ph = (i * 0.37 + u * 0.06) % 1; set(h, { x: mix(1300, -1300, ph), y: (i % 2 ? 300 : -330) + i * 12, z: -500, ry: 18, s: 0.9, o: 0.3, blur: 2, zi: 1 }); });
      const p = tw(u, 0, 0.8);
      set(S.hd, { x: 0, y: 120 + (1 - p) * 300, rx: (1 - p) * 40, s: fit(S.hd, 1380, 470), o: p, zi: 5 });
      S.n2.el.textContent = String(Math.round(31 * tw(u, 0.3, 1.4, E.o3)));
      set(S.n2, { x: -700, y: -330, o: tw(u, 0.3, 0.4, E.o3), zi: 6 });
      set(S.cB, { x: -520, y: -320 });
      drawCap(S.cB, u, 0.4);
      S.tp.forEach((c, i) => showChip(c, u, 1.65 + i * 0.13, 99, { x: -640 + i * 258, y: 455 }));
    },
  });

  // ===== 8 · Progression =====
  SC.push({
    id: "progress", dur: 10.2, world: { calm: true, star: false }, tin: "glitch", tout: "whipR", hud: "06 — PROGRESSION",
    sfx: [[0.1, "impact"], ...range(10).map((i) => [0.6 + i * 0.07, "pop", i]), [0.9, "count", 2.3], [4.6, "run", 1.0], ...range(7).map((i) => [5.1 + i * 0.08, "pop", i + 1]), [1.0, "riser", 1.6], [4.0, "whoosh"], [4.6, "swell", 1.6], ...range(9).map((i) => [5.7 + i * 0.13, "tick", i]), [7.6, "shimmer"], [8.4, "shimmer"]],
    fire: [[7.6, () => M.burst(-450, 405, 60, 9)], [8.4, () => M.burst(450, 405, 60, 9)]],
    build(S, R) {
      S.A = grp(R); S.B = grp(R);
      S.lv = use(S.A, "p.level");
      S.k = range(10).map((i) => use(S.A, `p.kpi.${i}`)).filter(Boolean);
      S.k.forEach((ki) => { const sp = ki.el.querySelector("strong span, strong"); ki.num = sp; ki.val = sp ? parseInt(sp.textContent.replace(/[^\d]/g, ""), 10) || 0 : 0; ki.from = { x: (rnd() - 0.5) * 2600, y: (rnd() - 0.5) * 1700, rz: (rnd() - 0.5) * 80 }; });
      S.c = cap(S.A, { kick: "VOTRE PROGRESSION", lines: ["VOTRE CONSTANCE,", "VISIBLE."], size: 104, gold: [1] });
      const ring = S.lv && S.lv.el.querySelectorAll("svg circle")[1];
      if (ring) { S.ring = ring; S.c0 = parseFloat(ring.getAttribute("stroke-dasharray")) || 0; S.c1 = parseFloat(ring.style.strokeDashoffset) || 0; }
      S.heat = use(S.B, "p.heat"); S.week = use(S.B, "p.week"); S.juz = use(S.B, "p.juz"); S.pace = use(S.B, "p.pace");
      { const bn = range(10).map((i) => `p.badge.${i}`).filter((n) => M.props[n]), on = (n) => !!M.props[n].node.querySelector("[class*='__badgeOn']");
        S.bd = [...bn.filter(on), ...bn.filter((n) => !on(n))].slice(0, 6).map((n) => use(S.B, n)); }
      S.cells = S.heat ? [...S.heat.el.querySelectorAll("[class*='__heat'] [data-l]")] : [];
      // l-9iyam kay-jiw mn l-ar9am li fo9 kol barre (machi mn l-animation dyal l-app)
      S.wb = S.week ? [...S.week.el.querySelectorAll("[class*='__barCol']")].map((c, i) => {
        const e = c.querySelector("[class*='__barTrack'] i"), lab = c.querySelector("[class*='__barVal']");
        if (lab) lab.style.opacity = 1;
        if (e) { e.parentElement.style.maxWidth = "46px"; e.style.transformOrigin = "bottom"; }
        return { e, n: lab ? parseInt(lab.textContent.replace(/[^\d]/g, ""), 10) || 0 : 0, alt: 0.35 + 0.65 * Math.abs(Math.sin(i * 1.9 + 0.6)) };
      }).filter((w) => w.e) : [];
      { const wm = Math.max(0, ...S.wb.map((w) => w.n)); S.wb.forEach((w) => { w.v = wm > 0 ? Math.max(w.n / wm, 0.06) : w.alt; }); }
      S.jz = S.juz ? [...S.juz.el.querySelectorAll("[class*='__juzGrid'] > *")] : [];
    },
    draw(S, t) {
      const ex = tw(t, 4.0, 0.4, E.i3);
      gset(S.A, { x: -ex * 2600, bx: ex * 26, o: t < 4.45 ? 1 : 0 });
      set(S.lv, { x: -470, y: -235, ry: 16, s: fit(S.lv, 780, 330) * mix(0.3, 1, tw(t, 0.1, 0.9, E.back)), o: tw(t, 0.1, 0.3, E.o3) });
      if (S.ring) S.ring.style.strokeDashoffset = `${mix(S.c0, S.c1, tw(t, 0.5, 1.8, E.io))}px`;
      S.k.forEach((ki, i) => {
        const p = tw(t, 0.6 + i * 0.07, 0.8), col = i < 9 ? i % 3 : 1, row = Math.floor(i / 3);
        set(ki, { x: mix(ki.from.x, 200 + col * 285, p), y: mix(ki.from.y, -330 + row * 200, p), rz: mix(ki.from.rz, 0, p), ry: -10, s: fit(ki, 262, 176), o: k(t, 0.6 + i * 0.07, 0.2) });
        if (ki.num) ki.num.textContent = Math.round(ki.val * tw(t, 0.9 + i * 0.07, 1.7, E.o3)).toLocaleString("fr-FR");
      });
      set(S.c, { x: -880, y: 235 });
      drawCap(S.c, t, 1.0);
      const b = 1 - tw(t, 4.25, 0.55), u = t - 4.3;
      gset(S.B, { x: b * 2600, bx: b * 26, o: t > 4.2 ? 1 : 0 });
      set(S.heat, { x: -400, y: -245, ry: 11, s: fit(S.heat, 980, 390), o: tw(u, 0.1, 0.4, E.o3) });
      S.cells.forEach((c, i) => { const col = Math.floor(i / 7), row = i % 7; c.style.transform = `scale(${tw(u, 0.3 + col * 0.045 + row * 0.02, 0.35, E.back)})`; });
      set(S.week, { x: 560, y: -245, ry: -13, s: fit(S.week, 640, 380), o: tw(u, 0.4, 0.4, E.o3) });
      S.wb.forEach((w, i) => { w.e.style.transform = `scaleY(${w.v * tw(u, 0.8 + i * 0.08, 0.8)})`; });
      set(S.juz, { x: -420, y: 150, ry: 11, s: fit(S.juz, 900, 300), o: tw(u, 1.1, 0.4, E.o3) });
      S.jz.forEach((c, i) => { const p = tw(u, 1.4 + i * 0.045, 0.4, E.back); c.style.transform = `scale(${p}) rotateY(${(1 - p) * 180}deg)`; });
      set(S.pace, { x: 560, y: 150, ry: -13, s: fit(S.pace, 640, 290), o: tw(u, 1.5, 0.4, E.o3) });
      S.bd.forEach((d, i) => { const p = tw(u, 2.6 + i * 0.16, 0.5, E.back); set(d, { x: -750 + i * 300, y: 405, s: fit(d, 290, 150) * p, o: k(u, 2.6 + i * 0.16, 0.15), zi: 9 }); });
    },
  });

  // ===== 9 · Khatmas =====
  SC.push({
    id: "khatma", dur: 6.2, world: { calm: true, star: false }, tin: "whipR", tout: "zoomIn", hud: "07 — KHATMAS",
    sfx: [[0.2, "swell", 1], ...range(3).map((i) => [0.5 + i * 0.14, "pop", i * 2]), [1.2, "impact"], [3.2, "shimmer"]],
    build(S, R) {
      S.cards = range(3).map((i) => use(R, `khatma.card.${i}`)).filter(Boolean);
      S.orb = use(R, "khatma.orb");
      S.c = cap(R, { kick: "KHATMAS", lines: ["SEUL.", "OU ENSEMBLE."], size: 132, gold: [1], sub: "Modèles, objectifs, checkpoints — progression partagée" });
      S.l = chip(R, "INVITEZ VOS PROCHES AVEC UN CODE");
    },
    draw(S, t) {
      const n = S.cards.length;
      S.cards.forEach((c, i) => { const u = i - (n - 1) / 2, p = tw(t, 0.45 + i * 0.14, 0.9); set(c, { x: 470 + u * 430 * p + Math.sin(t * 0.7 + i) * 8, y: 290 + (1 - p) * 700 + Math.abs(u) * 20, z: -Math.abs(u) * 120, ry: -u * 22 - 6, rz: u * 4, s: fit(c, 470, 330), o: p, zi: 5 - Math.abs(u) }); });
      set(S.orb, { x: 470, y: -215, s: fit(S.orb, 430, 430) * mix(0.3, 1, tw(t, 0.2, 1, E.back)), o: tw(t, 0.2, 0.4, E.o3), zi: 1 });
      set(S.c, { x: -880, y: -90 });
      drawCap(S.c, t, 0.5);
      showChip(S.l, t, 3.2, 99, { x: -560, y: 300 });
    },
  });

  // ===== 10 · Rafale =====
  const RAF = [["THÈMES", "m.page"], ["TAJWEED", "m.tajweed"], ["TAFSIR", "m.sheet"], ["ADHAN", "salat.next"], ["QIBLA", "salat.qibla"], ["TASBIH", "adhkar.dial"], ["ADHKAR", "adhkar.cat.1"],
    ["DOU'A", "dua.card.1"], ["HADITHS", "salat.hadith.0"], ["HIFD", "hifd.orb"], ["NIVEAUX", "p.level"], ["ACTIVITÉ", "p.heat"], ["KHATMAS", "khatma.card.0"], ["MUSHAF", "m.page2"]];
  const RT = (() => { const out = []; let t = 0; RAF.forEach((_, i) => { out.push(t); t += mix(0.46, 0.17, i / (RAF.length - 1)); }); out.push(t); return out; })();
  SC.push({
    id: "rafale", dur: RT[RT.length - 1] + 0.5, world: { calm: false, star: false }, tin: "zoomIn", tout: "none",
    sfx: [[0, "riser", RT[RT.length - 1] + 0.45], ...RAF.map((_, i) => [RT[i], "hit", i]), ...RAF.map((_, i) => [RT[i] + 0.02, "glitch", 0.08])],
    build(S, R) {
      S.it = RAF.map(([w, p]) => ({ p: use(R, p), w: txt(R, "f-word", w), a: (rnd() - 0.5) * 56, b: (rnd() - 0.5) * 18, c: (rnd() - 0.5) * 8 }));
      S.cur = -1;
    },
    draw(S, t) {
      let rgb = 0;
      S.it.forEach((it, i) => {
        const lt = t - RT[i], on = lt >= 0 && t < RT[i + 1];
        const f = fit(it.p, 1280, 800), d = RT[i + 1] - RT[i], u = clamp(lt / d);
        set(it.p, { ry: it.a * (1 - u * 0.5), rx: it.b, rz: it.c, s: f * mix(1.22, 1, tw(lt, 0, 0.16)) * (1 + u * 0.06), o: on ? 1 : 0, zi: 2 });
        set(it.w, { y: 400, s: mix(1.5, 1, tw(lt, 0, 0.14)), o: on ? 1 : 0, zi: 3 });
        if (on) { rgb = 22 * Math.exp(-lt * 16); if (S.cur !== i) { S.cur = i; if (i % 2 === 0) warp(0.35); } }
      });
      M.rgbExtra = rgb;
      M.flashExtra = tw(t, RT[RT.length - 1], 0.45, E.i2);
    },
  });

  // ===== 11 · Khatima =====
  const CREDIT = window.__CREDIT || { name: "ELABDI OUAIL", role: "IT Systems Engineer" };
  SC.push({
    id: "outro", dur: 9.6, world: { calm: false, star: true }, tin: "flash", tout: "none", bars: (t) => 120 * tw(t, 0.3, 1),
    sfx: [[0, "boom"], [0.05, "shimmer"], [2.3, "impact"], [4.5, "whoosh"], [4.9, "shimmer"], [5.0, "swell", 1.4]],
    fire: [[0, () => { warp(1); M.burst(0, 0, 200, 18); }], [2.3, () => M.burst(0, 330, 70, 9)]],
    build(S, R) {
      S.t1 = txt(R, "f-outline f-h", "FROM DARKNESSES"); S.t1.el.style.fontSize = "118px";
      S.t2 = txt(R, "f-gold f-h", "TO LIGHT"); S.t2.el.style.fontSize = "330px";
      S.ar = txt(R, "f-ar", "مِنَ ٱلظُّلُمَٰتِ إِلَى ٱلنُّورِ"); S.ar.el.style.fontSize = "78px";
      S.tag = txt(R, "f-sub", "TOUT VOTRE CHEMIN VERS LA LUMIÈRE");
      S.pill = txt(R, "f-pill", "BIENTÔT");
      S.cr = txt(R, "f-credit", `<small>ARCHITECTED BY</small><strong>${CREDIT.name}</strong><span>${CREDIT.role.toUpperCase()}</span>`);
    },
    draw(S, t) {
      const m = tw(t, 4.5, 0.9, E.io);
      const g = (y) => ({ y: mix(y, y * 0.55 - 195, m), s: mix(1, 0.56, m) });
      set(S.t1, { ...g(-290), o: tw(t, 0.15, 0.5, E.o3) });
      S.t1.el.style.letterSpacing = `${mix(1.1, 0.14, tw(t, 0.15, 1.4))}em`;
      set(S.t2, { ...g(-80), s: mix(2.2, 1, tw(t, 0.3, 0.9)) * mix(1, 0.56, m), o: tw(t, 0.3, 0.3, E.o3) });
      set(S.ar, { ...g(130), o: tw(t, 1.0, 0.8, E.o3) });
      set(S.tag, { ...g(235), o: tw(t, 1.5, 0.7, E.o3) });
      S.tag.el.style.letterSpacing = `${mix(1.1, 0.5, tw(t, 1.5, 1.4))}em`;
      set(S.pill, { y: 352, s: mix(1.5, 1, tw(t, 2.3, 0.5, E.back)), o: tw(t, 2.3, 0.2, E.o3) * (1 - tw(t, 4.3, 0.4, E.i3)) });
      set(S.cr, { y: 215 + (1 - tw(t, 4.9, 0.9)) * 80, o: tw(t, 4.9, 0.7, E.o3) });
      M.flashExtra = 0;
      black(tw(t, 8.6, 0.95, E.i2));
    },
  });

  /* ---------------------------------------------------------------- moteur */
  let cur = -1, S = null, fired = null;
  M.frame = (T) => {
    M.T = T;
    let i = SC.findIndex((s) => T >= s.start && T < s.start + s.dur);
    if (i < 0) i = SC.length - 1;
    const sc = SC[i], t = T - sc.start;
    if (i !== cur) {
      cur = i; live = []; S = {}; fired = new Set(); M.rgbExtra = 0; M.flashExtra = 0;
      const R = document.createElement("div");
      R.className = "f-scene";
      fx.cam.replaceChildren(R);
      black(0);
      sc.build(S, R);
      ctl().mood(sc.world);
      if (i > 0 && sc.tin !== "none") warp(sc.tin === "zoomIn" || sc.tin === "zoomOut" || sc.tin === "flash" ? 0.9 : 0.45);
    }
    (sc.fire || []).forEach(([ft, fn], n) => { if (t >= ft && !fired.has(n)) { fired.add(n); fn(); } });
    sc.draw(S, t);
    for (const l of live) { const n = l.frames.length; if (n) { const f = Math.floor(T * 30) % (2 * n - 2 || 1); l.ctx.clearRect(0, 0, 460, 460); l.ctx.drawImage(l.frames[f < n ? f : 2 * n - 2 - f], 0, 0); } }

    // ---- caméra: transitions dyal d-dkhoul w l-khrouj ----
    const a = 1 - k(t, 0, 0.38), b = k(t, sc.dur - 0.32, 0.32), a3 = a * a * a, b3 = b * b * b;
    const c = { x: 0, y: 0, s: 1, rz: 0, o: 1, bx: 0, by: 0, rgb: M.rgbExtra || 0 };
    const tin = sc.tin || "none", tout = sc.tout || "none";
    if (tin === "whipL") { c.x += a3 * 2700; c.bx += a3 * 90; } else if (tin === "whipR") { c.x -= a3 * 2700; c.bx += a3 * 90; } else if (tin === "whipU") { c.y += a3 * 1600; c.by += a3 * 70; }
    else if (tin === "zoomIn") { c.s *= 1 - 0.42 * a3; c.o *= 1 - a3; } else if (tin === "zoomOut") { c.s *= 1 + 1.3 * a3; c.o *= 1 - a3 * 0.8; }
    else if (tin === "spin") { c.rz -= 26 * a3; c.s *= 1 + 0.9 * a3; c.o *= 1 - a3; } else if (tin === "glitch") { c.rgb += 30 * a; c.x += Math.sin(T * 190) * 34 * a; }
    if (tout === "whipL") { c.x -= b3 * 2700; c.bx += b3 * 90; } else if (tout === "whipR") { c.x += b3 * 2700; c.bx += b3 * 90; } else if (tout === "whipU") { c.y -= b3 * 1600; c.by += b3 * 70; }
    else if (tout === "zoomIn") { c.s *= 1 + 2.6 * b3; c.o *= 1 - b3; c.bx += b3 * 14; c.by += b3 * 14; } else if (tout === "zoomOut") { c.s *= 1 - 0.5 * b3; c.o *= 1 - b3; }
    else if (tout === "spin") { c.rz += 26 * b3; c.s *= 1 + 0.9 * b3; c.o *= 1 - b3; } else if (tout === "glitch") { c.rgb += 30 * b; c.x += Math.sin(T * 190) * 34 * b; }
    fx.cam.style.transform = `translate(${c.x}px,${c.y}px) rotate(${c.rz}deg) scale(${c.s})`;
    fx.cam.style.opacity = c.o;
    if (c.rgb > 0.6) { fx.rgb[0].setAttribute("dx", c.rgb); fx.rgb[1].setAttribute("dx", -c.rgb); fx.cam.style.filter = "url(#f-rgb)"; }
    else if (c.bx > 0.6 || c.by > 0.6) { fx.mb.setAttribute("stdDeviation", `${c.bx.toFixed(1)} ${c.by.toFixed(1)}`); fx.cam.style.filter = "url(#f-mb)"; }
    else fx.cam.style.filter = "";

    // ---- flash, barres, HUD ----
    let flash = M.flashExtra || 0;
    if (tin === "flash") flash = Math.max(flash, Math.exp(-t * 3.2));
    if (tin === "zoomIn" || tin === "zoomOut" || tin === "glitch") flash = Math.max(flash, 0.5 * Math.exp(-t * 11));
    if (tout === "zoomIn") flash = Math.max(flash, 0.55 * b3);
    fx.flash.style.opacity = flash;
    const bars = sc.bars ? sc.bars(t) : 0;
    fx.barT.style.height = fx.barB.style.height = `${bars}px`;
    const hud = sc.hud ? Math.min(k(t, 0.3, 0.5), 1 - k(t, sc.dur - 0.4, 0.3)) : 0;
    fx.hud.style.opacity = hud;
    if (sc.hud) fx.hud.querySelector("em").textContent = sc.hud;
    fx.hud.querySelector("u").style.transform = `scaleX(${T / M.duration})`;

    // ---- étincelles + grain ----
    const g = fx.sctx, dt = 1 / 30;
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = "lighter";
    for (let n = parts.length - 1; n >= 0; n--) {
      const p = parts[n];
      p.life += dt;
      if (p.life >= p.max) { parts.splice(n, 1); continue; }
      p.vx *= 0.955; p.vy = p.vy * 0.955 + 90 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      g.globalAlpha = Math.pow(1 - p.life / p.max, 1.5);
      g.fillStyle = p.c; g.shadowColor = p.c; g.shadowBlur = 14;
      g.beginPath(); g.arc(p.x, p.y, p.size, 0, 6.283); g.fill();
    }
    const d = fx.gimg.data;
    for (let n = 0; n < d.length; n += 4) { const v = (rnd() * 255) | 0; d[n] = d[n + 1] = d[n + 2] = v; d[n + 3] = 255; }
    fx.gctx.putImageData(fx.gimg, 0, 0);
  };

  /** Timeline dyal l-aswat: [{t, k, a}] */
  M.timeline = () => {
    const ev = [{ t: 0, k: "drone", a: M.duration }];
    for (const sc of SC) {
      for (const [t, kk, a] of sc.sfx || []) ev.push({ t: +(sc.start + t).toFixed(3), k: kk, a });
      const end = sc.start + sc.dur, to = sc.tout || "none";
      if (to.startsWith("whip")) ev.push({ t: +(end - 0.3).toFixed(3), k: "whoosh" });
      else if (to === "zoomIn" || to === "zoomOut") ev.push({ t: +(end - 0.45).toFixed(3), k: "whooshUp" }, { t: +end.toFixed(3), k: "impact" });
      else if (to === "spin") ev.push({ t: +(end - 0.35).toFixed(3), k: "whoosh" }, { t: +end.toFixed(3), k: "hit", a: 3 });
      else if (to === "glitch") ev.push({ t: +(end - 0.3).toFixed(3), k: "glitch", a: 0.55 }, { t: +end.toFixed(3), k: "hit", a: 5 });
    }
    return { duration: M.duration, events: ev.sort((x, y) => x.t - y.t), scenes: SC.map((s) => ({ id: s.id, start: s.start, dur: s.dur })) };
  };
  M.sceneIds = () => SC.map((s) => s.id);
  M.only = (ids) => { for (let i = SC.length - 1; i >= 0; i--) if (!ids.includes(SC[i].id)) SC.splice(i, 1); };
})();
