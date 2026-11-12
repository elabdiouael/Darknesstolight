"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  applyStudioEnvironment, createGirihFloor, createGlowTexture, createLantern, createNourParticles, createRayTexture,
  createRubElHizbGeometry, createStarField, disposeScene, goldMaterial,
} from "@/lib/three/nour3d";
import { getNourMood } from "@/lib/three/nourMood";
import { reportSlowFrames, usePerf } from "@/lib/perf";
import styles from "./NourBackground.module.css";

/** Lissage indépendant mn l-framerate */
const damp = (cur: number, target: number, lambda: number, dt: number) => cur + (target - cur) * (1 - Math.exp(-lambda * dt));

const MAX_DPR = 1.5;
const MIN_DPR = 0.75;

/**
 * Background 3D "Nour" — mount wa7ed l-app kamla (Providers), kay-b9a 7ay bin les pages:
 *  - najma Rub el Hizb dhahabiya + 7l9at + chou3a3, kat-tla3/kat-ghber b smooth 7sab l-page (mood)
 *  - fawanis, ard b zellige (girih), najmat sghar 3D
 *  - particules 100% GPU: kay-hrbou mn souris w kay-che3lou, click = mouja dyal nour
 *  - z-zellige kay-che3el t7t l-curseur, parallax, dolly m3a scroll
 *  - FPS: résolution adaptative, animation b delta-time, pause mli l-onglet mkhbi
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
      // MSAA ghir f les écrans 1x: f HiDPI l-pixels sghar w l-MSAA kay-koul l-GPU bla fayda
      renderer = new THREE.WebGLRenderer({ antialias: !lite && window.devicePixelRatio < 1.5, alpha: true, powerPreference: "high-performance" });
    } catch {
      return; // WebGL ma kaynch -> nkhelliw ghir l-gradient CSS
    }
    renderer.setPixelRatio(dpr);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030a07, 0.04);
    applyStudioEnvironment(renderer, scene);

    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / Math.max(1, mount.clientHeight), 0.1, 100);
    camera.position.set(0, 0, 14);

    // ---- Lumières ----
    scene.add(new THREE.AmbientLight(0x1d6b4c, 0.6));
    const goldLight = new THREE.PointLight(0xf2d48a, 70, 40);
    goldLight.position.set(4, 4, 8);
    scene.add(goldLight);
    const rim = new THREE.PointLight(0x5fd3a0, 40, 30);
    rim.position.set(-6, -3, 4);
    scene.add(rim);

    // ---- Najma + 7l9at ----
    const starGroup = new THREE.Group();
    const starGeo = createRubElHizbGeometry();
    const starMat = goldMaterial();
    starMat.transparent = true;
    starGroup.add(new THREE.Mesh(starGeo, starMat));

    const edgeMat = new THREE.LineBasicMaterial({ color: 0xfff1c4, transparent: true, opacity: 0.4 });
    starGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(starGeo, 25), edgeMat));

    // Najma sghira dakhel (counter-rotation)
    const innerMat = goldMaterial();
    innerMat.transparent = true;
    const innerStar = new THREE.Mesh(createRubElHizbGeometry(1.0, 0.74, 0, 0.12), innerMat);
    innerStar.position.z = 0.1;
    starGroup.add(innerStar);

    const ringMat = new THREE.MeshBasicMaterial({ color: 0xecd08a, transparent: true, opacity: 0.32 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.1, 0.022, 8, 160), ringMat);
    starGroup.add(ring);
    const ring2Mat = ringMat.clone();
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.85, 0.016, 8, 160), ring2Mat);
    starGroup.add(ring2);

    const glowTex = createGlowTexture();
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0xffdc8c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6,
    }));
    halo.scale.setScalar(13);
    halo.position.z = -0.6;
    starGroup.add(halo);

    // ---- Chou3a3 (god rays) ----
    const rayTex = createRayTexture();
    const rays = new THREE.Group();
    const RAYS = 10;
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

    // ---- Fawanis (lanternes) ----
    const SPOTS: [number, number, number, number, number][] = [
      [-12.5, 4.6, -6, 0.9, 0xffb547], [13.5, 6.2, -12, 0.8, 0xffb547], [-15, 6.6, -14, 0.8, 0xffd27a],
      [-6, 8.4, -19, 0.6, 0x7af0c0], [6.5, 9, -21, 0.55, 0xffd27a],
    ];
    const lanterns = SPOTS.slice(0, lite ? 2 : small ? 3 : SPOTS.length).map(([x, y, z, sc, hue], i) => {
      const l = createLantern(glowTex, hue);
      l.group.position.set(small ? x * 0.6 : x, y, z);
      scene.add(l.group);
      // F l-mode calm kay-b9aw ghir jouj fawanis
      return { ...l, baseY: y, phase: i * 1.7, size: sc, calmHide: i >= 2, shown: 1 };
    });

    // ---- Ard b zellige + najmat sghar ----
    const floor = createGirihFloor(90, 0.42);
    floor.mesh.position.set(0, -7.5, -12);
    scene.add(floor.mesh);
    const starField = createStarField(lite ? 8 : small ? 12 : 30);
    scene.add(starField.mesh);

    // ---- Interactions ----
    const ndc = new THREE.Vector2(0, 0);         // souris f [-1, 1]
    const ray = new THREE.Raycaster();
    const particlePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 2);   // z = -2
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 7.5);    // y = -7.5
    const hit = new THREE.Vector3();
    const mouseWorld = new THREE.Vector3(0, 0, -2);
    const floorUv = new THREE.Vector2(0.5, 0.5);
    let hasMouse = false;
    let energy = 0;       // 7araka dyal souris (0..1)
    let floorOn = 0;
    let pulseT = 1;
    let scrollVel = 0;
    let scrollY = window.scrollY;

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

    function frame(dt: number, k: number) {
      const mood = getNourMood();
      calm = damp(calm, mood.calm ? 1 : 0, 2.2, dt);
      starOn = damp(starOn, mood.star ? 1 : 0, 2.8, dt);

      scrollVel *= Math.exp(-5 * dt);
      energy *= Math.exp(-2.5 * dt);
      // k = dt * 60 (0 = mchhed tabt: reduced motion)
      if (k > 0) spin += 0.054 * dt + scrollVel * 0.05 * k + (1 - starOn) * dt * 0.8;

      // ---- Najma: kat-kber / kat-sghar b smooth bin les pages ----
      starGroup.visible = starOn > 0.01;
      if (starGroup.visible) {
        starGroup.position.set(5.2 + calm * 2.3, 1.4 + calm * 1.8, -2);
        starGroup.scale.setScalar((1 - calm * 0.2) * starOn);
        starGroup.rotation.z = spin;
        starGroup.rotation.y = Math.sin(t * 0.25) * 0.35 + ndc.x * 0.15;
        starGroup.rotation.x = Math.cos(t * 0.2) * 0.15 + ndc.y * 0.1;
        innerStar.rotation.z = -spin * 2.2;
        ring.rotation.x = Math.sin(t * 0.3) * 0.5;
        ring2.rotation.y = Math.cos(t * 0.27) * 0.6;
        rays.rotation.z = -t * 0.03;
        starMat.opacity = 0.85 - calm * 0.4;
        innerMat.opacity = 0.8 - calm * 0.4;
        edgeMat.opacity = 0.4 - calm * 0.2;
        ringMat.opacity = 0.32 - calm * 0.14;
        ring2Mat.opacity = 0.16 - calm * 0.08;
        halo.material.opacity = 0.6 - calm * 0.28 + Math.sin(t * 1.1) * 0.09 + energy * 0.12;
        for (const r of rayMats) r.mat.opacity = r.base * (1 - calm * 0.5);
      }

      // ---- Fawanis: tmayl + nfs (bob) + d-dow kay-rtta3ch b7al chem3a ----
      for (const l of lanterns) {
        l.shown = damp(l.shown, l.calmHide && mood.calm ? 0 : 1, 2.5, dt);
        l.group.visible = l.shown > 0.01;
        if (!l.group.visible) continue;
        l.group.scale.setScalar(l.size * l.shown);
        l.group.rotation.z = Math.sin(t * 0.55 + l.phase) * 0.07 + ndc.x * 0.03;
        l.group.rotation.y = t * 0.15 + l.phase;
        l.group.position.y = l.baseY + Math.sin(t * 0.8 + l.phase) * 0.18;
        const flick = Math.sin(t * 7 + l.phase * 3) * 0.04 + Math.sin(t * 13 + l.phase) * 0.03;
        l.halo.material.opacity = 0.72 + flick;
        (l.glass.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.45 + flick * 3;
      }

      starField.update(k);
      goldLight.intensity = 65 + Math.sin(t * 1.3) * 14;
      goldLight.position.x = 4 + ndc.x * 3;
      goldLight.position.y = 4 + ndc.y * 3;

      // ---- Camera: parallax + dolly m3a scroll ----
      camera.position.x = damp(camera.position.x, ndc.x * 1.4, 1.85, dt);
      camera.position.y = damp(camera.position.y, ndc.y * 0.9, 1.85, dt);
      camera.position.z = damp(camera.position.z, 14 - Math.min(scrollY / 1600, 1) * 2.6, 3.1, dt);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();

      // ---- Souris f l-monde (particules + zellige) ----
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(particlePlane, hit)) mouseWorld.lerp(hit, 1 - Math.exp(-12 * dt));
      const onFloor = hasMouse && toFloorUv(floorUv);
      floorOn = damp(floorOn, onFloor ? 1 : 0, 6, dt);
      if (pulseT < 1) pulseT = Math.min(1, pulseT + dt / 1.6);

      const pu = pMat.uniforms;
      pu.uTime.value = t;
      if (k > 0) pu.uRise.value += dt * (1 + Math.abs(scrollVel) * 2.5);
      pu.uOpacity.value = 0.95 - calm * 0.35;
      pu.uMouse.value.copy(mouseWorld);
      pu.uMouseForce.value = damp(pu.uMouseForce.value, hasMouse ? 0.4 + energy * 0.6 : 0, 5, dt);
      pu.uPulseT.value = pulseT;

      const fu = floor.material.uniforms;
      fu.uTime.value = t;
      fu.uOpacity.value = 0.42 - calm * 0.16;
      if (onFloor) (fu.uMouse.value as THREE.Vector2).lerp(floorUv, 1 - Math.exp(-14 * dt));
      fu.uMouseOn.value = floorOn;
      fu.uPulseT.value = pulseT;

      renderer.render(scene, camera);
    }

    // ---- Boucle: delta-time + résolution adaptative ----
    let raf = 0;
    let last = performance.now();
    let avg = 1 / 60;
    let samples = 0;
    let skip = false;
    let acc = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const raw = (now - last) / 1000;
      last = now;
      acc += Math.min(raw, 0.05);
      // "medium": frame wa7da mn jouj (30 fps) — l-7araka d l-background hadya, ma kay-banch l-fer9 w l-GPU kay-rta7 b n-nos
      skip = lite && !skip;
      if (!skip) {
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
    document.addEventListener("visibilitychange", onVisibility);
    if (!document.hidden) start();

    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      disposeScene(scene);
      rayTex.dispose();
      glowTex.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [tier]);

  return (
    <div className={`${styles.wrap} ${tier === "low" ? styles.lite : ""}`} aria-hidden>
      <div ref={mountRef} className={styles.canvas} />
      <div className={`${styles.pattern} pattern-bg`} />
      <div className={styles.vignette} />
    </div>
  );
};
