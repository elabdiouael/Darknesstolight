"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  applyStudioEnvironment, createEnergyRing, createGirihFloor, createGlowTexture, createNebula, createNourParticles, createPlanet,
  createRayTexture, createRubElHizbGeometry, createStarField, disposeScene, goldMaterial,
} from "@/lib/three/nour3d";
import { consumeWarp, getNourMood } from "@/lib/three/nourMood";
import { reportSlowFrames, usePerf } from "@/lib/perf";
import styles from "./NourBackground.module.css";

/** Lissage indépendant mn l-framerate */
const damp = (cur: number, target: number, lambda: number, dt: number) => cur + (target - cur) * (1 - Math.exp(-lambda * dt));

const MAX_DPR = 1.5;
const MIN_DPR = 0.75;

/**
 * Background 3D "3alam akhor" — mount wa7ed l-app kamla (Providers), kay-b9a 7ay bin les pages:
 *  - sma: nebula m-bakiya f texture (jouj plans b parallax) + chouhoub (Max)
 *  - kawkab b ghilaf jawwi w 7al9a dyal ghobar dhahabi
 *  - portail: najma Rub el Hizb dhahabiya, 7al9at dyal ta9a w chou3a3 — kat-tla3 / kat-ghber 7sab l-page (mood)
 *  - ard dyal zellige (girih) b7al grille holographique, najmat sghar 3D, particules 100% GPU
 *  - interactions: souris (particules kay-hrbou, z-zellige kay-che3el), click = mouja, scroll = dolly,
 *    tebdil dyal l-page = "warp" (daf3a dyal sor3a)
 *  - FPS: canvas opaque, 60 fps max (30 f Équilibré), résolution adaptative, pause mli l-onglet mkhbi
 */
export const NourBackground = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { tier } = usePerf();

  useEffect(() => {
    const mount = mountRef.current;
    // "low": bla WebGL ga3 — background CSS tabt (0 khdma l l-GPU)
    if (!mount || tier === "low") return;
    const lite = tier === "medium";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dpr = Math.min(window.devicePixelRatio, lite ? 1 : MAX_DPR);
    let renderer: THREE.WebGLRenderer;
    try {
      // Canvas opaque (alpha: false): l-navigateur ma kay-7tajch y-khellto m3a l-page f kol frame
      renderer = new THREE.WebGLRenderer({ antialias: !lite && window.devicePixelRatio < 1.5, alpha: false, powerPreference: "high-performance" });
    } catch {
      return; // WebGL ma kaynch -> kay-b9a l-background CSS
    }
    renderer.setClearColor(0x020807, 1);
    renderer.setPixelRatio(dpr);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020807, 0.036);
    applyStudioEnvironment(renderer, scene);

    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / Math.max(1, mount.clientHeight), 0.1, 120);
    camera.position.set(0, 0, 14);

    // ---- Lumières: dow wa7ed dhahabi + ambiance (l-metal kay-t3ks l-environment) ----
    scene.add(new THREE.AmbientLight(0x1d4f7a, 0.75));
    const goldLight = new THREE.PointLight(0xf2d48a, 80, 44);
    goldLight.position.set(4, 4, 8);
    scene.add(goldLight);
    // Ida2a zer9a: dow azra9 mn l-iser + hala kbira zer9a mor l-mchhed
    const blueLight = new THREE.PointLight(0x3f8cff, 60, 46);
    blueLight.position.set(-9, -2, 6);
    scene.add(blueLight);

    // ---- Sma: nebula (texture m-bakiya merra we7da) ----
    const nebula = createNebula(renderer, lite ? 512 : 1024, lite ? 256 : 512);
    const neb1 = nebula.layer(0.9, 0.7);
    neb1.mesh.position.set(0, 4, -58);
    scene.add(neb1.mesh);
    // Tabaqa tanya (Max): nefs t-texture b échelle w dawra khra -> s-sma kat-ban 7ayya
    const neb2 = lite ? null : nebula.layer(0.55, 0.4);
    if (neb2) { neb2.mesh.position.set(0, 2, -46); neb2.material.uniforms.uRot.value = 2.1; scene.add(neb2.mesh); }

    // ---- Kawkab ----
    const glowTex = createGlowTexture();
    const planet = createPlanet(7, glowTex);
    planet.group.position.set(-21, 11.5, -32);
    scene.add(planet.group);
    const lightDir = new THREE.Vector3();
    const blueGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x2f6dff, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, opacity: 0.2, fog: false }));
    blueGlow.scale.set(70, 34, 1);
    blueGlow.position.set(0, -9, -34);
    blueGlow.renderOrder = -50;
    scene.add(blueGlow);

    // ---- Portail: najma + 7l9at ----
    const starGroup = new THREE.Group();
    const starGeo = createRubElHizbGeometry();
    const starMat = goldMaterial();
    starMat.transparent = true;
    starGroup.add(new THREE.Mesh(starGeo, starMat));

    const edgeMat = new THREE.LineBasicMaterial({ color: 0xfff1c4, transparent: true, opacity: 0.4 });
    starGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(starGeo, 25), edgeMat));

    const innerMat = goldMaterial();
    innerMat.transparent = true;
    const innerStar = new THREE.Mesh(createRubElHizbGeometry(1.0, 0.74, 0, 0.12), innerMat);
    innerStar.position.z = 0.1;
    starGroup.add(innerStar);

    // 7l9at dyal ta9a: dow kaydour fihom b dnab
    const ring = createEnergyRing(4.1, 0.03, 0xecd08a);
    starGroup.add(ring.mesh);
    const ring2 = createEnergyRing(4.85, 0.022, 0x5aa8ff);
    ring2.material.uniforms.uSpeed.value = -0.045;
    starGroup.add(ring2.mesh);

    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0xffdc8c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6,
    }));
    halo.scale.setScalar(13);
    halo.position.z = -0.6;
    starGroup.add(halo);

    const rayTex = createRayTexture();
    const rays = new THREE.Group();
    const RAYS = lite ? 4 : 6; // plans kbar additifs = overdraw; 6 kafyin
    const rayMats: { mat: THREE.MeshBasicMaterial; base: number }[] = [];
    for (let i = 0; i < RAYS; i++) {
      const base = 0.1 + Math.random() * 0.06;
      const mat = new THREE.MeshBasicMaterial({
        map: rayTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: base, side: THREE.DoubleSide,
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2 + Math.random() * 1.4, 22), mat);
      m.rotation.z = (i / RAYS) * Math.PI;
      m.position.z = -1.2;
      rays.add(m);
      rayMats.push({ mat, base });
    }
    starGroup.add(rays);
    scene.add(starGroup);

    // ---- Particules (GPU) ----
    const small = window.innerWidth < 760;
    const { points: particles, material: pMat } = createNourParticles(lite ? 420 : small ? 600 : 1100, [36, 24, 18], 0.95);
    pMat.uniforms.uPixelRatio.value = dpr;
    scene.add(particles);

    // ---- Ard dyal zellige (grille holographique) + najmat sghar ----
    const floor = createGirihFloor(90, 0.42);
    floor.mesh.position.set(0, -7.5, -12);
    scene.add(floor.mesh);
    const starField = createStarField(lite ? 8 : small ? 12 : 24);
    scene.add(starField.mesh);

    // ---- Chouhoub (Max ghir) ----
    const meteor = lite ? null : new THREE.Mesh(
      new THREE.PlaneGeometry(0.07, 7),
      new THREE.MeshBasicMaterial({ map: rayTex, color: 0xdff6ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, side: THREE.DoubleSide, fog: false }),
    );
    const meteorDir = new THREE.Vector3(-0.9, -0.42, 0).normalize();
    let meteorLife = -1;
    let meteorWait = 2 + Math.random() * 4;
    if (meteor) { meteor.rotation.z = Math.atan2(meteorDir.y, meteorDir.x) - Math.PI / 2; meteor.visible = false; scene.add(meteor); }

    // ---- Interactions ----
    const ndc = new THREE.Vector2(0, 0);
    const ray = new THREE.Raycaster();
    const particlePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 2);
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 7.5);
    const hit = new THREE.Vector3();
    const mouseWorld = new THREE.Vector3(0, 0, -2);
    const floorUv = new THREE.Vector2(0.5, 0.5);
    let hasMouse = false;
    let energy = 0;
    let floorOn = 0;
    let pulseT = 1;
    let scrollVel = 0;
    let scrollY = window.scrollY;
    let warp = 0;

    const toFloorUv = (out: THREE.Vector2) => {
      if (!ray.ray.intersectPlane(floorPlane, hit)) return false;
      out.set(hit.x / 90 + 0.5, 0.5 - (hit.z + 12) / 90);
      return out.x > 0 && out.x < 1 && out.y > 0 && out.y < 1;
    };

    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -((e.clientY / window.innerHeight) * 2 - 1);
      if (e.pointerType === "mouse") {
        energy = Math.min(1, energy + Math.hypot(nx - ndc.x, ny - ndc.y) * 2.5);
        hasMouse = true;
      }
      ndc.set(nx, ny);
    };
    const onDown = (e: PointerEvent) => {
      ndc.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(particlePlane, hit)) pMat.uniforms.uPulseOrigin.value.copy(hit);
      const o = floor.material.uniforms.uPulseO.value as THREE.Vector2;
      if (!toFloorUv(o)) o.set(ndc.x * 0.12 + 0.5, 0.42);
      pulseT = 0;
    };
    const onLeave = () => { hasMouse = false; };
    const onScroll = () => {
      const y = window.scrollY;
      scrollVel += (y - scrollY) * 0.0015;
      scrollY = y;
    };
    const onResize = () => {
      const w = mount.clientWidth, h = Math.max(1, mount.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (reduced) frame(0, 0);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    // Mood: 0 = normal, 1 = calm / najma: 0 = mkhbiya, 1 = bayna
    let calm = getNourMood().calm ? 1 : 0;
    let starOn = getNourMood().star ? 1 : 0;
    let spin = 0;
    let t = 0;
    let fov = 50;

    function frame(dt: number, k: number) {
      const mood = getNourMood();
      calm = damp(calm, mood.calm ? 1 : 0, 2.2, dt);
      starOn = damp(starOn, mood.star ? 1 : 0, 2.8, dt);

      // Warp: daf3a mn tebdil dyal l-page, kat-tfa b chwiya
      warp = Math.max(warp * Math.exp(-2.4 * dt), k > 0 ? consumeWarp() : 0);
      scrollVel *= Math.exp(-5 * dt);
      energy *= Math.exp(-2.5 * dt);
      // k = dt * 60 (0 = mchhed tabt: reduced motion)
      if (k > 0) spin += 0.054 * dt + scrollVel * 0.05 * k + (1 - starOn) * dt * 0.8 + warp * dt * 1.6;

      // ---- Sma ----
      const nebGain = 1 - calm * 0.35 + warp * 0.3;
      neb1.material.uniforms.uOpacity.value = 0.7 * nebGain;
      neb1.material.uniforms.uOffset.value.set(t * 0.0016 + ndc.x * 0.006, t * 0.0007 + ndc.y * 0.004);
      if (neb2) {
        neb2.material.uniforms.uOpacity.value = 0.4 * nebGain;
        neb2.material.uniforms.uOffset.value.set(-t * 0.003 + ndc.x * 0.016, t * 0.0012 + ndc.y * 0.01);
        neb2.material.uniforms.uRot.value = 2.1 + t * 0.004;
      }

      // ---- Kawkab: kaydour b chwiya, w l-hilal kay-tbe3 d-dow dyal l-portail ----
      planet.group.rotation.y = t * 0.012;
      planet.group.position.y = 11.5 + Math.sin(t * 0.15) * 0.25;
      planet.material.uniforms.uTime.value = t;
      planet.material.uniforms.uGain.value = 1 - calm * 0.25;
      planet.ringMat.uniforms.uOpacity.value = 0.3 - calm * 0.1;

      // ---- Portail: kay-kber / kay-sghar b smooth bin les pages ----
      starGroup.visible = starOn > 0.01;
      if (starGroup.visible) {
        starGroup.position.set(5.2 + calm * 2.3, 1.4 + calm * 1.8, -2);
        starGroup.scale.setScalar((1 - calm * 0.2) * starOn * (1 + warp * 0.08));
        starGroup.rotation.z = spin;
        starGroup.rotation.y = Math.sin(t * 0.25) * 0.35 + ndc.x * 0.15;
        starGroup.rotation.x = Math.cos(t * 0.2) * 0.15 + ndc.y * 0.1;
        innerStar.rotation.z = -spin * 2.2;
        ring.mesh.rotation.x = Math.sin(t * 0.3) * 0.5;
        ring2.mesh.rotation.y = Math.cos(t * 0.27) * 0.6;
        rays.rotation.z = -t * 0.03;
        starMat.opacity = 0.9 - calm * 0.4;
        innerMat.opacity = 0.85 - calm * 0.4;
        edgeMat.opacity = 0.4 - calm * 0.2;
        ring.material.uniforms.uTime.value = t;
        ring.material.uniforms.uOpacity.value = 0.95 - calm * 0.45;
        ring2.material.uniforms.uTime.value = t;
        ring2.material.uniforms.uOpacity.value = 0.6 - calm * 0.3;
        halo.material.opacity = 0.6 - calm * 0.28 + Math.sin(t * 1.1) * 0.09 + energy * 0.12 + warp * 0.3;
        for (const r of rayMats) r.mat.opacity = r.base * (1 - calm * 0.5);
      }

      starField.update(k * (1 + warp * 9));
      goldLight.intensity = 75 + Math.sin(t * 1.3) * 14 + warp * 50;
      goldLight.position.x = 4 + ndc.x * 3;
      goldLight.position.y = 4 + ndc.y * 3;
      blueLight.intensity = 55 + Math.sin(t * 0.9 + 2.0) * 12 + warp * 40;
      blueGlow.material.opacity = (0.2 - calm * 0.07) * (1 + Math.sin(t * 0.5) * 0.12) + warp * 0.12;

      // ---- Chouhoub ----
      if (meteor && k > 0) {
        if (meteorLife < 0) {
          meteorWait -= dt;
          if (meteorWait <= 0) {
            meteorLife = 0;
            meteor.position.set(-6 + Math.random() * 28, 6 + Math.random() * 7, -22 + Math.random() * 10);
            meteor.visible = true;
          }
        } else {
          meteorLife += dt;
          meteor.position.addScaledVector(meteorDir, dt * 34);
          (meteor.material as THREE.MeshBasicMaterial).opacity = Math.sin(Math.min(1, meteorLife / 0.85) * Math.PI) * 0.9;
          if (meteorLife >= 0.85) { meteorLife = -1; meteorWait = 3 + Math.random() * 7; meteor.visible = false; }
        }
      }

      // ---- Camera: parallax + dolly m3a scroll + "zoom" dyal l-warp ----
      camera.position.x = damp(camera.position.x, ndc.x * 1.4, 1.85, dt);
      camera.position.y = damp(camera.position.y, ndc.y * 0.9, 1.85, dt);
      camera.position.z = damp(camera.position.z, 14 - Math.min(scrollY / 1600, 1) * 2.6, 3.1, dt);
      const wantFov = 50 + warp * 16;
      if (Math.abs(wantFov - fov) > 0.02) { fov = wantFov; camera.fov = fov; camera.updateProjectionMatrix(); }
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      // Ittijah d-dow (mn l-kawkab l l-portail) f repère dyal l-camera
      lightDir.set(26, -10, 30).normalize().transformDirection(camera.matrixWorldInverse);
      planet.material.uniforms.uLight.value.copy(lightDir);

      // ---- Souris f l-monde (particules + zellige) ----
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(particlePlane, hit)) mouseWorld.lerp(hit, 1 - Math.exp(-12 * dt));
      const onFloor = hasMouse && toFloorUv(floorUv);
      floorOn = damp(floorOn, onFloor ? 1 : 0, 6, dt);
      if (pulseT < 1) pulseT = Math.min(1, pulseT + dt / 1.6);

      const pu = pMat.uniforms;
      pu.uTime.value = t;
      if (k > 0) pu.uRise.value += dt * (1 + Math.abs(scrollVel) * 2.5 + warp * 26);
      pu.uOpacity.value = 0.95 - calm * 0.35;
      pu.uMouse.value.copy(mouseWorld);
      pu.uMouseForce.value = damp(pu.uMouseForce.value, hasMouse ? 0.4 + energy * 0.6 : 0, 5, dt);
      pu.uPulseT.value = pulseT;

      const fu = floor.material.uniforms;
      fu.uTime.value = t + warp * 3;
      fu.uOpacity.value = 0.42 - calm * 0.16 + warp * 0.3;
      if (onFloor) (fu.uMouse.value as THREE.Vector2).lerp(floorUv, 1 - Math.exp(-14 * dt));
      fu.uMouseOn.value = floorOn;
      fu.uPulseT.value = pulseT;

      renderer.render(scene, camera);
    }

    // ---- Boucle: plafond dyal fps + résolution adaptative ----
    // Max: ~60-72 fps (f écran 144 Hz kan-rendriw frame mn jouj), Équilibré: 30 fps
    const minInterval = lite ? 1 / 31 : 1 / 75;
    let raf = 0;
    let last = performance.now();
    let avg = 1 / 60;
    let samples = 0;
    let acc = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const raw = (now - last) / 1000;
      last = now;
      acc += Math.min(raw, 0.05);
      if (acc >= minInterval) {
        t += acc;
        frame(acc, acc * 60);
        acc = 0;
      }

      // Ila l-GPU ma l79ch (< ~45 fps): kan-n9sou r-résolution, w ila ma kfatch kan-hebtou niveau dyal l-performance
      if (raw < 0.1) {
        avg += (raw - avg) * 0.08;
        if (++samples > 70) {
          samples = 0;
          if (avg > 1 / 45) {
            if (dpr > MIN_DPR) {
              dpr = Math.max(MIN_DPR, dpr - 0.25);
              renderer.setPixelRatio(dpr);
              pMat.uniforms.uPixelRatio.value = dpr;
              avg = 1 / 60;
            } else if (avg > 1 / 38) {
              reportSlowFrames(); // high -> medium -> low (l-effect kay-t3awd b niveau jdid)
            }
          }
        }
      }
    };

    // prefers-reduced-motion: mchhed tabt, kay-t3awd ghir ila tbeddel l-mood (page jdida)
    let still: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      if (reduced) {
        frame(1, 0);
        still = setInterval(() => { if (!document.hidden) frame(1, 0); }, 500);
      } else {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const stop = () => { cancelAnimationFrame(raf); clearInterval(still); };
    const onVisibility = () => { stop(); if (!document.hidden) start(); };
    // Mode pas-à-pas (tasjil dyal l-vidéo promo): l-we9t kay-t7ekkem fih script mn berra, frame b frame
    const w = window as unknown as { __nourManual?: boolean; __nourStep?: (dt: number) => void };
    const manual = w.__nourManual === true;
    if (manual) {
      w.__nourStep = (dt: number) => { t += dt; frame(dt, dt * 60); };
      frame(0, 0);
    } else {
      document.addEventListener("visibilitychange", onVisibility);
      if (!document.hidden) start();
    }

    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      disposeScene(scene);
      nebula.dispose();
      rayTex.dispose();
      glowTex.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [tier]);

  return (
    <div className={`${styles.wrap} ${tier === "low" ? styles.lite : ""}`} aria-hidden>
      <div ref={mountRef} className={styles.canvas} />
      {/* Tabaqa we7da fo9 l-canvas: zakhrafa + vignette + scanlines (9bel kanou jouj tabaqat, wa7da b mask) */}
      <div className={styles.overlay} />
    </div>
  );
};
