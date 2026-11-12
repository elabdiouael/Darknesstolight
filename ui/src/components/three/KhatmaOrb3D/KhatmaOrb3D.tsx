"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  applyStudioEnvironment, createArcTorus, createNourParticles, createRubElHizbGeometry, disposeScene, goldMaterial,
} from "@/lib/three/nour3d";
import { usePerf } from "@/lib/perf";
import { ProgressRing } from "@/components/common/ProgressRing/ProgressRing";
import styles from "./KhatmaOrb3D.module.css";

interface Props {
  progress: number;   // 0..100
  juz: number;        // 1..30
  accent?: string;
  children?: React.ReactNode;
}

/**
 * Orb 3D dyal l-khatma: 7l9a dhahabiya kat3mer m3a l-progress,
 * 30 7abba (ajzaa) dayrin biha — li t9raw kayche3lou, w najma f l-west.
 * T9der t-jerrha b souris / b sb3ek bach tdourha.
 */
export const KhatmaOrb3D = ({ progress, juz, accent = "#ecd08a", children }: Props) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const target = useRef({ progress, juz, accent });

  useEffect(() => { target.current = { progress, juz, accent }; }, [progress, juz, accent]);

  const { tier } = usePerf();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || tier === "low") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, tier === "medium" ? 1 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    applyStudioEnvironment(renderer, scene);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 12.6);

    scene.add(new THREE.AmbientLight(0x2a7a58, 0.5));
    const key = new THREE.PointLight(0xfff0c8, 90, 40);
    key.position.set(3, 5, 7);
    scene.add(key);
    const fill = new THREE.PointLight(0x5fd3a0, 40, 30);
    fill.position.set(-5, -3, 5);
    scene.add(fill);

    const orb = new THREE.Group();
    orb.rotation.x = -0.42;
    scene.add(orb);

    const R = 3;
    // Track (l-masar)
    const track = new THREE.Mesh(
      new THREE.TorusGeometry(R, 0.045, 16, 240),
      new THREE.MeshStandardMaterial({ color: 0x1a5a40, metalness: 0.6, roughness: 0.4, transparent: true, opacity: 0.6 }),
    );
    orb.add(track);

    // Arc dyal l-progress (kaybda mn l-fo9 w kaymchi m3a 3a9arib s-sa3a)
    const arcHolder = new THREE.Group();
    arcHolder.rotation.z = -Math.PI / 2;
    arcHolder.scale.x = -1;
    orb.add(arcHolder);
    const arcMat = goldMaterial();
    arcMat.emissive = new THREE.Color(0x6b4a08);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
    // Jouj torus kamlin mebniyin merra we7da; l-progress kaybeddel ghir drawRange
    // (9bel: 2 geometries jdad f kol frame = GC w saccades)
    const arcGeo = createArcTorus(R, 0.12, 16);
    const glowGeo = createArcTorus(R, 0.32, 10);
    arcHolder.add(new THREE.Mesh(arcGeo.geometry, arcMat), new THREE.Mesh(glowGeo.geometry, glowMat));
    let shownProgress = 0;
    const buildArc = (p: number) => { arcGeo.setArc(p / 100); glowGeo.setArc(p / 100); };

    // Ras l-arc: kora sghira kat-che3el
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 32), new THREE.MeshBasicMaterial({ color: 0xfff4d6 }));
    orb.add(head);
    const headGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: (() => {
        const c = document.createElement("canvas"); c.width = c.height = 128;
        const g = c.getContext("2d")!;
        const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grd.addColorStop(0, "rgba(255,240,200,1)"); grd.addColorStop(0.3, "rgba(240,200,110,0.5)"); grd.addColorStop(1, "rgba(240,200,110,0)");
        g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
        const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
      })(),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    headGlow.scale.setScalar(1.8);
    head.add(headGlow);

    // 30 7abba = 30 juz2
    const beadsLit = goldMaterial();
    beadsLit.emissive = new THREE.Color(0x8a6210);
    beadsLit.emissiveIntensity = 0.9;
    // Bla "transmission": kanet kat-3awd t-rendri l-scène kamla merra tanya f kol frame
    const beadsDim = new THREE.MeshStandardMaterial({
      color: 0x14664a, metalness: 0.55, roughness: 0.18, emissive: 0x062a1c, emissiveIntensity: 0.6, transparent: true, opacity: 0.85,
    });
    const beadGeo = new THREE.SphereGeometry(0.13, 16, 16);
    const beads: THREE.Mesh[] = [];
    for (let i = 0; i < 30; i++) {
      const a = Math.PI / 2 - (i / 30) * Math.PI * 2;
      const b = new THREE.Mesh(beadGeo, beadsDim);
      b.position.set(Math.cos(a) * (R + 0.62), Math.sin(a) * (R + 0.62), 0);
      orb.add(b);
      beads.push(b);
    }
    let litJuz = -1;

    // Najma f l-west
    const star = new THREE.Mesh(createRubElHizbGeometry(1.55, 1.14, 0.5, 0.28), goldMaterial());
    orb.add(star);
    const star2 = new THREE.Mesh(createRubElHizbGeometry(0.62, 0.46, 0, 0.16), goldMaterial());
    star2.position.z = 0.22;
    orb.add(star2);

    // Particules sghar dayrin
    const dust = createNourParticles(180, [9, 9, 4], 0.9, 46);
    dust.points.position.z = 1;
    scene.add(dust.points);

    // ---- Drag (souris / touch) b inertia ----
    let dragging = false;
    let lastX = 0, lastY = 0;
    let velY = 0, velX = 0;
    let rotY = 0, rotX = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onMoveDrag = (e: PointerEvent) => {
      if (!dragging) return;
      velY = (e.clientX - lastX) * 0.008;
      velX = (e.clientY - lastY) * 0.006;
      lastX = e.clientX; lastY = e.clientY;
    };
    const onUp = () => { dragging = false; };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMoveDrag);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);

    const resize = () => {
      const s = mount.clientWidth;
      renderer.setSize(s, s);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    let raf = 0;
    let running = false;
    let onScreen = true;
    let last = performance.now();
    let t = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      t += dt;
      const k = dt * 60;
      const { progress: p, juz: j } = target.current;

      // Animation dyal l-arc (b l-wa9t machi b frames, bach tb9a smooth f ay écran)
      const next = reduced ? p : shownProgress + (p - shownProgress) * Math.min(1, dt * 2.6);
      if (Math.abs(next - shownProgress) > 0.02) { shownProgress = next; buildArc(shownProgress); }
      else if (shownProgress !== p && Math.abs(p - shownProgress) <= 0.02) { shownProgress = p; buildArc(p); }

      const ha = Math.PI / 2 - (shownProgress / 100) * Math.PI * 2;
      head.position.set(Math.cos(ha) * R, Math.sin(ha) * R, 0);
      head.visible = shownProgress > 0.3;
      headGlow.material.opacity = 0.7 + Math.sin(t * 3) * 0.3;

      if (j !== litJuz) {
        beads.forEach((b, i) => { b.material = i < j && p > 0 ? beadsLit : beadsDim; });
        litJuz = j;
      }
      beads.forEach((b, i) => {
        const isCurrent = i === j - 1 && p > 0;
        b.scale.setScalar(isCurrent ? 1.5 + Math.sin(t * 4) * 0.25 : 1);
      });

      // Rotation: drag + inertia + sway
      if (!dragging) { velY *= Math.pow(0.94, k); velX *= Math.pow(0.94, k); }
      rotY += velY * k; rotX += velX * k;
      rotX *= Math.pow(0.98, k); // kayrj3 b chwiya l-blasto
      orb.rotation.y = rotY + Math.sin(t * 0.4) * 0.25;
      orb.rotation.x = -0.42 + Math.max(-0.8, Math.min(0.8, rotX)) + Math.cos(t * 0.33) * 0.06;
      star.rotation.z = t * 0.35;
      star2.rotation.z = -t * 0.7;
      dust.points.rotation.z = t * 0.05;
      dust.material.uniforms.uTime.value = t;
      key.intensity = 85 + Math.sin(t * 1.4) * 15;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };

    // L-orb kay-rendri ghir mli kayban f l-écran w l-onglet m7loul
    const sync = () => {
      const want = onScreen && !document.hidden;
      if (want === running) return;
      running = want;
      cancelAnimationFrame(raf);
      if (want) { last = performance.now(); raf = requestAnimationFrame(tick); }
    };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); });
    io.observe(mount);
    document.addEventListener("visibilitychange", sync);
    sync();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMoveDrag);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointercancel", onUp);
      disposeScene(scene);
      headGlow.material.map?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [tier]);

  // Mode léger: 7al9a b SVG f blast l-canvas 3D
  if (tier === "low") {
    return (
      <div className={styles.wrap} style={{ ["--acc" as string]: accent }}>
        <div className={styles.flat}><ProgressRing value={progress} size={220} stroke={12} color={accent}>{children}</ProgressRing></div>
      </div>
    );
  }

  return (
    <div className={styles.wrap} style={{ ["--acc" as string]: accent }}>
      <div className={styles.aura} aria-hidden />
      <div ref={mountRef} className={styles.canvas} />
      {children && <div className={styles.caption}>{children}</div>}
    </div>
  );
};