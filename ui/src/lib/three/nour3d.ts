// Helpers 3D partagés: najma Rub el Hizb, environment l-reflets dyal dhab, particules li kayl3bou (twinkle)
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

/** Najma dyal 8 branches m-extrudée (b t9ba f l-west) */
export const createRubElHizbGeometry = (outer = 3.2, inner = 2.35, hole = 1.25, depth = 0.22) => {
  const shape = new THREE.Shape();
  const points = 16;
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * Math.PI * 2 + Math.PI / 8;
    const r = i % 2 === 0 ? outer : inner;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  if (hole > 0) {
    const h = new THREE.Path();
    h.absarc(0, 0, hole, 0, Math.PI * 2, true);
    shape.holes.push(h);
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: depth * 0.36, bevelSize: 0.06, bevelSegments: 4, curveSegments: 64,
  });
  geo.center();
  return geo;
};

/** Environment map (studio) bach l-metal dhahabi y3ks d-dow b7al l-7a9i9i */
export const applyStudioEnvironment = (renderer: THREE.WebGLRenderer, scene: THREE.Scene) => {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  pmrem.dispose();
  return env;
};

export const goldMaterial = (opacity = 1) =>
  new THREE.MeshPhysicalMaterial({
    color: 0xd9b24a,
    metalness: 1,
    roughness: 0.22,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    emissive: 0x2a1c02,
    emissiveIntensity: 0.6,
    envMapIntensity: 1.4,
    transparent: opacity < 1,
    opacity,
  });

/** Particules b shader: kol wa7da kat-twinkli b phase dyalha */
export const createNourParticles = (count: number, spread: [number, number, number], opacity = 0.9, size = 70) => {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const scale = new Float32Array(count);
  const phase = new Float32Array(count);
  const speed = new Float32Array(count);
  const palette = [new THREE.Color(0xecd08a), new THREE.Color(0xfff4d6), new THREE.Color(0x5fd3a0), new THREE.Color(0xd4af37)];
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread[0];
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread[1];
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread[2] - 2;
    const r = Math.random();
    const c = palette[r < 0.45 ? 0 : r < 0.65 ? 1 : r < 0.85 ? 3 : 2];
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    scale[i] = 0.4 + Math.random() * 1.2;
    phase[i] = Math.random() * Math.PI * 2;
    speed[i] = 0.24 + Math.random() * 0.72; // unités / seconde
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aScale", new THREE.BufferAttribute(scale, 1));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  geo.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
  // L-7araka kamla f GPU -> l-bounding sphere l-asliya ma b9atch s7i7a
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);

  // Kolchi f l-vertex shader (tlou3, souris, mouja): 0 khdma f CPU w 0 upload dyal buffers f kol frame
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: size },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
      uOpacity: { value: opacity },
      uRise: { value: 0 },                       // masafa dyal t-tlou3 (kat-tzad m3a l-wa9t / scroll)
      uHalfH: { value: spread[1] / 2 },
      uMouse: { value: new THREE.Vector3() },    // blasa dyal souris f l-monde
      uMouseForce: { value: 0 },
      uPulseOrigin: { value: new THREE.Vector3() },
      uPulseT: { value: 1 },                     // 0 -> 1 (1 = ma kayn 7ta mouja)
    },
    vertexShader: /* glsl */ `
      attribute vec3 aColor;
      attribute float aScale;
      attribute float aPhase;
      attribute float aSpeed;
      uniform float uTime;
      uniform float uSize;
      uniform float uPixelRatio;
      uniform float uRise;
      uniform float uHalfH;
      uniform vec3 uMouse;
      uniform float uMouseForce;
      uniform vec3 uPulseOrigin;
      uniform float uPulseT;
      varying vec3 vColor;
      varying float vTwinkle;
      varying float vBoost;
      void main() {
        vec3 p = position;
        p.y = mod(p.y + uRise * aSpeed + uHalfH, 2.0 * uHalfH) - uHalfH;
        p.x += sin(uTime * 0.5 + aPhase * 3.0) * 0.12 * step(0.0001, uRise);

        // Souris: l-particules kay-hrbou mnha w kay-che3lou
        vec2 d = p.xy - uMouse.xy;
        float near = smoothstep(3.4, 0.0, length(d)) * uMouseForce;
        p.xy += normalize(d + vec2(0.0001)) * near * 1.5;

        // Click: mouja dayra kat-tfrre9
        vec2 pd = p.xy - uPulseOrigin.xy;
        float ring = smoothstep(1.8, 0.0, abs(length(pd) - uPulseT * 16.0)) * (1.0 - uPulseT);
        p.xy += normalize(pd + vec2(0.0001)) * ring * 1.1;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float tw = 0.55 + 0.45 * sin(uTime * 1.7 + aPhase);
        vBoost = near + ring;
        gl_PointSize = uSize * aScale * uPixelRatio * (0.65 + 0.6 * tw) * (1.0 + vBoost * 0.9) / -mv.z;
        vColor = aColor;
        vTwinkle = tw;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vTwinkle;
      varying float vBoost;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float core = smoothstep(0.5, 0.0, d);
        // sghira dyal "croix" bach tban b7al najma kat-lme3
        float cross = max(0.0, 1.0 - abs(uv.x) * 14.0) * max(0.0, 1.0 - abs(uv.y) * 2.2)
                    + max(0.0, 1.0 - abs(uv.y) * 14.0) * max(0.0, 1.0 - abs(uv.x) * 2.2);
        float a = pow(core, 1.8) + cross * 0.35 * vTwinkle;
        vec3 c = mix(vColor, vec3(1.0, 0.96, 0.84), min(vBoost, 1.0) * 0.5);
        gl_FragColor = vec4(c, a * min(vTwinkle + vBoost, 1.4) * uOpacity);
      }
    `,
  });

  return { points: new THREE.Points(geo, mat), material: mat, geometry: geo };
};

/**
 * Torus kaml b index m-retteb 7sab d-dawra -> l-arc dyal l-progress kaytbeddel ghir b setDrawRange
 * (bla ma n-3awdou n-bniw l-geometry f kol frame)
 */
export const createArcTorus = (radius: number, tube: number, radialSegments = 16, tubularSegments = 360) => {
  const geo = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
  const idx: number[] = [];
  const row = tubularSegments + 1;
  for (let i = 1; i <= tubularSegments; i++) {
    for (let j = 1; j <= radialSegments; j++) {
      const a = row * j + i - 1, b = row * (j - 1) + i - 1, c = row * (j - 1) + i, d = row * j + i;
      idx.push(a, b, d, b, c, d);
    }
  }
  geo.setIndex(idx);
  const setArc = (fraction: number) => {
    const segs = Math.round(Math.max(0, Math.min(1, fraction)) * tubularSegments);
    geo.setDrawRange(0, segs * radialSegments * 6);
  };
  setArc(0);
  return { geometry: geo, setArc };
};

/** Texture dyal chou3a3 (light ray) — gradient vertical */
export const createRayTexture = () => {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 512;
  const g = c.getContext("2d")!;
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, "rgba(255,240,200,0)");
  grd.addColorStop(0.45, "rgba(255,230,170,0.55)");
  grd.addColorStop(1, "rgba(255,230,170,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 512);
  const side = g.createLinearGradient(0, 0, 64, 0);
  side.addColorStop(0, "rgba(0,0,0,1)");
  side.addColorStop(0.5, "rgba(0,0,0,0)");
  side.addColorStop(1, "rgba(0,0,0,1)");
  g.globalCompositeOperation = "destination-out";
  g.fillStyle = side;
  g.fillRect(0, 0, 64, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

export const disposeScene = (scene: THREE.Scene) => {
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose?.();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose?.();
  });
  scene.environment?.dispose();
};

/* ======================================================================
   Scène 3D enrichie: fawanis (lanternes) dhahabiya, ard b zellige (girih),
   w najmat sghar kay-tiro f l-3om9
   ====================================================================== */

/** Fanous (lanterne) mtamen: zjaj kayd-dwi + cadre dhabi + 9obba + silsila */
export const createLantern = (glowTex: THREE.Texture, hue = 0xffb547) => {
  const group = new THREE.Group();
  const v = (x: number, y: number) => new THREE.Vector2(x, y);

  const glassProfile = [v(0, -0.95), v(0.42, -0.86), v(0.6, -0.42), v(0.63, 0.32), v(0.46, 0.7), v(0, 0.78)];
  const glassGeo = new THREE.LatheGeometry(glassProfile, 8);
  const glass = new THREE.Mesh(glassGeo, new THREE.MeshStandardMaterial({
    color: 0x3a2405, emissive: hue, emissiveIntensity: 1.5, transparent: true, opacity: 0.82, roughness: 0.4, side: THREE.DoubleSide,
  }));
  group.add(glass);

  // Cadre: les arêtes dyal l-octogone (b7al l-7did dyal l-fanous)
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(glassGeo, 10), new THREE.LineBasicMaterial({ color: 0xffe6a8, transparent: true, opacity: 0.9 }));
  frame.scale.setScalar(1.01);
  group.add(frame);

  const metal = goldMaterial();
  const dome = new THREE.Mesh(new THREE.LatheGeometry([v(0, 1.42), v(0.07, 1.3), v(0.16, 1.08), v(0.36, 0.92), v(0.5, 0.8), v(0, 0.78)], 8), metal);
  group.add(dome);
  const base = new THREE.Mesh(new THREE.LatheGeometry([v(0, -1.38), v(0.09, -1.2), v(0.3, -1.04), v(0.45, -0.94), v(0, -0.92)], 8), metal);
  group.add(base);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 24), metal);
  ring.position.y = 1.52;
  group.add(ring);
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 14, 6), new THREE.MeshBasicMaterial({ color: 0x8a6a1c }));
  chain.position.y = 1.6 + 7;
  group.add(chain);

  // Halo dyal d-dow
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: hue, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85,
  }));
  halo.scale.setScalar(4.2);
  group.add(halo);

  return { group, halo, glass };
};

/** Ard b zakharif (girih / khatam) kat-ghber f l-b3id, kat-t7rrek b chwiya */
export const createGirihFloor = (size = 90, opacity = 0.5) => {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 }, uOpacity: { value: opacity }, uColor: { value: new THREE.Color(0xd4af37) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) }, uMouseOn: { value: 0 },
      uPulseO: { value: new THREE.Vector2(0.5, 0.5) }, uPulseT: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uOpacity;
      uniform vec3 uColor;
      uniform vec2 uMouse;
      uniform float uMouseOn;
      uniform vec2 uPulseO;
      uniform float uPulseT;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv * 46.0 + vec2(0.0, uTime * 0.12);
        vec2 g = abs(fract(p) - 0.5);
        float sq = min(g.x, g.y);
        vec2 r = vec2(p.x + p.y, p.x - p.y) * 0.70710678;
        vec2 g2 = abs(fract(r) - 0.5);
        float dia = min(g2.x, g2.y);
        float star = abs(length(fract(p) - 0.5) - 0.3);
        float line = smoothstep(0.035, 0.0, sq) * 0.55 + smoothstep(0.03, 0.0, dia) * 0.8 + smoothstep(0.02, 0.0, star) * 0.5;
        float fade = smoothstep(0.5, 0.06, distance(vUv, vec2(0.5)));
        float pulse = 0.75 + 0.25 * sin(uTime * 0.6 + vUv.y * 20.0);
        // Souris: z-zellige kay-che3el t7t l-curseur — Click: mouja dyal d-dow
        float spot = smoothstep(0.085, 0.0, distance(vUv, uMouse)) * uMouseOn;
        float wave = smoothstep(0.016, 0.0, abs(distance(vUv, uPulseO) - uPulseT * 0.42)) * (1.0 - uPulseT);
        float lit = spot * 2.4 + wave * 3.2;
        vec3 col = mix(uColor, vec3(1.0, 0.95, 0.8), clamp(lit * 0.35, 0.0, 0.7));
        float a = line * fade * pulse * uOpacity * (1.0 + lit) + (spot * 0.05 + wave * 0.1) * fade;
        gl_FragColor = vec4(col, a);
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size, 1, 1), mat);
  mesh.rotation.x = -Math.PI / 2;
  return { mesh, material: mat };
};

/** Najmat sghar (instanced) kay-tiro w kaydourou f l-3om9 */
export const createStarField = (count: number) => {
  const geo = createRubElHizbGeometry(0.34, 0.25, 0, 0.07);
  const mesh = new THREE.InstancedMesh(geo, goldMaterial(), count);
  const data = Array.from({ length: count }, () => ({
    pos: new THREE.Vector3((Math.random() - 0.5) * 34, (Math.random() - 0.5) * 20, -16 + Math.random() * 18),
    rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
    spin: new THREE.Vector3((Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.012, (Math.random() - 0.5) * 0.008),
    speed: 0.003 + Math.random() * 0.006,
    scale: 0.5 + Math.random() * 0.9,
  }));
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  // k = dt * 60: nefs s-sor3a f 60Hz / 120Hz / 144Hz
  const update = (k = 1) => {
    data.forEach((d, i) => {
      d.rot.x += d.spin.x * k; d.rot.y += d.spin.y * k; d.rot.z += d.spin.z * k;
      d.pos.y += d.speed * k;
      if (d.pos.y > 11) d.pos.y = -11;
      q.setFromEuler(d.rot);
      s.setScalar(d.scale);
      m.compose(d.pos, q, s);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  update();
  return { mesh, update };
};

/** Halo (radial gradient) partagé */
export const createGlowTexture = () => {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, "rgba(255,255,255,0.9)");
  grd.addColorStop(0.25, "rgba(255,255,255,0.35)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};