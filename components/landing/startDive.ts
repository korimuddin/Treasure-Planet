import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import {
  GRAIN_FRAGMENT,
  LENS_FRAGMENT,
  OCEAN_FRAGMENT,
  OCEAN_VERTEX,
  PASS_VERTEX,
  SNOW_FRAGMENT,
  SNOW_VERTEX,
} from "./oceanShader";

const MAX_DEPTH = 200; // metres reached at the bottom of the page

/* Morning sunrise. Raise SUN_ELEVATION (e.g. 60) for midday light. */
const SUN_ELEVATION = 3; // degrees above the horizon: the sun just clearing it
const SUN_AZIMUTH = 27; // degrees right of straight ahead, so the glow clears the hero text
const SKY = { turbidity: 2.6, rayleigh: 3.3, mie: 0.0022, mieG: 0.84 }; // clear, crisp morning air

/** Preetham daylight constants (same model as three's Sky addon), computed once on the CPU. */
function skyUniforms() {
  const el = THREE.MathUtils.degToRad(SUN_ELEVATION);
  const az = THREE.MathUtils.degToRad(SUN_AZIMUTH);
  const sun = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).normalize();
  const cutoff = 1.6110731556870734;
  const sunE = 1000 * Math.max(0, 1 - Math.exp(-((cutoff - Math.acos(THREE.MathUtils.clamp(sun.y, -1, 1))) / 1.5)));
  const sunfade = 1 - THREE.MathUtils.clamp(1 - Math.exp(sun.y / 450000), 0, 1);
  const betaR = new THREE.Vector3(5.804542996261093e-6, 1.3562911419845635e-5, 3.0265902468824876e-5).multiplyScalar(
    SKY.rayleigh - (1 - sunfade),
  );
  const betaM = new THREE.Vector3(1.8399918514433978e14, 2.7798023919660528e14, 4.0790479543861094e14).multiplyScalar(
    0.434 * (0.2 * SKY.turbidity * 10e-18) * SKY.mie,
  );
  return { sun, sunE, sunfade, betaR, betaM };
}

/** Direction the sun appears in from under the water (refracted through a flat surface). */
function sunFromBelow(sun: THREE.Vector3) {
  const eta = 1 / 1.333;
  const I = sun.clone().negate();
  const N = new THREE.Vector3(0, 1, 0);
  const ci = -N.dot(I);
  const k = 1 - eta * eta * (1 - ci * ci);
  return I.multiplyScalar(eta)
    .add(N.multiplyScalar(eta * ci - Math.sqrt(Math.max(k, 0))))
    .negate()
    .normalize();
}

/**
 * Starts the scroll-driven ocean dive inside `root` (the `.tp-dive` element).
 * Scroll position maps to depth. Also drives the hero fade, header state,
 * NDA demo card and entrance glare. Returns a cleanup function.
 */
export function startDive(root: HTMLElement): () => void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel);

  const canvas = q<HTMLCanvasElement>("#ocean");
  const heroInner = q<HTMLElement>(".hero-inner");
  const title = q<HTMLElement>(".hero h1");
  const hero = q<HTMLElement>(".hero");
  const topbar = q<HTMLElement>(".topbar");
  const line = q<HTMLElement>("#interlude-line");
  const glare = q<HTMLElement>("#glare");
  if (!canvas || !heroInner || !title || !hero || !topbar) return () => {};

  const cleanups: Array<() => void> = [];
  const on = <K extends keyof WindowEventMap>(
    type: K,
    fn: (e: WindowEventMap[K]) => void,
    opts?: AddEventListenerOptions,
  ) => {
    window.addEventListener(type, fn, opts);
    cleanups.push(() => window.removeEventListener(type, fn, opts));
  };
  const clearGlare = () => glare?.classList.add("gone");

  /* ---------- page behaviour ---------- */
  const fitTitle = () => {
    const avail = Math.min(hero.clientWidth - 32, 1240);
    title.style.fontSize = "200px";
    const w = title.scrollWidth || 1;
    title.style.fontSize = `${Math.max(28, Math.min(128, (200 * avail) / w)).toFixed(1)}px`;
  };
  fitTitle();
  on("resize", fitTitle);
  document.fonts?.ready.then(fitTitle).catch(() => {});

  let target = 0;
  const onScroll = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    target = Math.min(1, Math.max(0, window.scrollY / max)) * MAX_DEPTH;
    const k = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.55)));
    heroInner.style.opacity = (1 - k).toFixed(3);
    heroInner.style.transform = reduce ? "" : `translateY(${(-k * 60).toFixed(1)}px)`;
    heroInner.style.visibility = k >= 1 ? "hidden" : "visible";
    topbar.classList.toggle("solid", k > 0.85);
    if (line) {
      const r = line.getBoundingClientRect();
      const c = Math.abs((r.top + r.height / 2) / window.innerHeight - 0.5);
      line.style.opacity = (1 - Math.min(1, Math.max(0, (c - 0.18) / 0.3))).toFixed(3);
    }
  };
  on("scroll", onScroll, { passive: true });
  onScroll();

  const listing = q<HTMLElement>("#listing");
  const reveal = q<HTMLButtonElement>("#reveal");
  if (listing && reveal) {
    const state = q<HTMLElement>("#l-state");
    const note = q<HTMLElement>("#l-note");
    const toggle = () => {
      const open = listing.classList.toggle("open");
      if (state) state.textContent = open ? "NDA signed · open" : "Sealed";
      reveal.textContent = open ? "Seal again" : "Sign NDA to reveal";
      if (note) note.textContent = open ? "Demo only, no NDA was signed" : "Sample data for illustration";
    };
    reveal.addEventListener("click", toggle);
    cleanups.push(() => reveal.removeEventListener("click", toggle));
  }

  if (!reduce) root.classList.add("intro");
  const glareTimer = window.setTimeout(clearGlare, 2500);
  cleanups.push(() => window.clearTimeout(glareTimer));

  /* ---------- renderer ---------- */
  let renderer: THREE.WebGLRenderer;
  try {
    // preserveDrawingBuffer lets the ASCII pass read back the frame it has just drawn
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: true });
  } catch {
    clearGlare(); // no WebGL: the canvas keeps its CSS gradient
    return () => {
      cleanups.forEach((fn) => fn());
      root.classList.remove("intro");
    };
  }
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    2 * THREE.MathUtils.radToDeg(Math.atan(0.5 / 1.25)), // matches the ocean shader's field of view
    window.innerWidth / window.innerHeight,
    0.05,
    60,
  );

  const sk = skyUniforms();
  const oceanU = {
    uRes: { value: new THREE.Vector2() },
    uTime: { value: 0 },
    uDepth: { value: 0 },
    uCamDepth: { value: 2.4 },
    uF: { value: new THREE.Vector3() },
    uR: { value: new THREE.Vector3() },
    uU: { value: new THREE.Vector3() },
    uSun: { value: sk.sun },
    uSunE: { value: sk.sunE },
    uSunfade: { value: sk.sunfade },
    uBetaR: { value: sk.betaR },
    uBetaM: { value: sk.betaM },
    uMieG: { value: SKY.mieG },
    // a low sun is dimmer; open the "aperture" a little so the scene keeps a bright morning feel
    uSkyGain: { value: 0.5 },
    uDayLight: { value: 1.7 },
    uCamY: { value: -2.4 },
  };
  const oceanMat = new THREE.ShaderMaterial({
    uniforms: oceanU,
    vertexShader: OCEAN_VERTEX,
    fragmentShader: OCEAN_FRAGMENT,
    depthTest: false,
    depthWrite: false,
  });
  const oceanGeo = new THREE.PlaneGeometry(2, 2);
  const ocean = new THREE.Mesh(oceanGeo, oceanMat);
  ocean.frustumCulled = false;
  ocean.renderOrder = -1;
  scene.add(ocean);

  /* ---------- marine snow ---------- */
  const COUNT = window.innerWidth < 700 ? 450 : 900;
  const BOX = new THREE.Vector3(16, 16, 16);
  const pos = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * BOX.x;
    pos[i * 3 + 1] = (Math.random() - 0.5) * BOX.y;
    pos[i * 3 + 2] = (Math.random() - 0.5) * BOX.z;
    seed[i] = Math.random();
  }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  snowGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const snowU = {
    uCam: { value: new THREE.Vector3() },
    uBox: { value: BOX },
    uTime: { value: 0 },
    uPx: { value: 800 },
    uFocus: { value: 2.2 },
    uAperture: { value: 0.015 },
    uSunW: { value: sunFromBelow(sk.sun) },
    uLight: { value: 1 },
    uTint: { value: new THREE.Color(0.62, 0.82, 1.0) },
  };
  const snowMat = new THREE.ShaderMaterial({
    uniforms: snowU,
    vertexShader: SNOW_VERTEX,
    fragmentShader: SNOW_FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const snow = new THREE.Points(snowGeo, snowMat);
  snow.frustumCulled = false;
  snow.renderOrder = 1;
  scene.add(snow);

  /* ---------- camera-like post-processing ---------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.75, 1.6);
  composer.addPass(bloom);
  composer.addPass(
    new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uCA: { value: 0.0011 }, uVig: { value: 0.85 } },
      vertexShader: PASS_VERTEX,
      fragmentShader: LENS_FRAGMENT,
    }),
  );
  composer.addPass(new OutputPass());
  const grain = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uAmt: { value: 0.035 } },
    vertexShader: PASS_VERTEX,
    fragmentShader: GRAIN_FRAGMENT,
  });
  composer.addPass(grain);

  let scale = window.innerWidth < 700 ? 0.5 : 0.7;
  const buf = new THREE.Vector2();
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const pr = Math.min(1, dpr * (window.innerWidth > 1600 ? Math.min(scale, 0.6) : scale));
    renderer.setPixelRatio(pr);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    composer.setPixelRatio(pr);
    composer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.getDrawingBufferSize(buf);
    oceanU.uRes.value.copy(buf);
    snowU.uPx.value = buf.y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  };
  on("resize", resize);

  /* ---------- ASCII pass ----------
     The water is drawn off-screen, then resampled into a grid and redrawn as glyphs.
     Settings follow the "Violet ASCII Wave" brief: standard ramp, brightness 90, contrast 30,
     #6D4AFF multiplied at 25%, bloom 20, solid background, wave animation. */
  const asciiCv = q<HTMLCanvasElement>("#ascii");
  const actx = asciiCv?.getContext("2d") ?? null;
  const sampleCv = document.createElement("canvas");
  const sctx = sampleCv.getContext("2d", { willReadFrequently: true });
  const mobile = window.innerWidth < 700;
  const CELL = mobile ? 15 : 12;                 // bigger cells on phones: far fewer glyphs to draw
  const RAMP = " .:-=+*#%@";
  const TINT = [0x6d / 255, 0x4a / 255, 0xff / 255];
  const TINT_AMT = 0.25;
  const ASCII_BG = "#0b0618";
  const monoFamily = getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim();
  const glyphFont = `500 ${CELL}px ${monoFamily ? `${monoFamily}, ` : ""}ui-monospace, Menlo, monospace`;
  let cols = 0;
  let rows = 0;
  let adpr = 1;
  let gain = 1;
  let asciiFrame = 0;
  const sizeAscii = () => {
    if (!asciiCv) return;
    adpr = Math.min(window.devicePixelRatio || 1, 2);
    asciiCv.width = Math.round(window.innerWidth * adpr);
    asciiCv.height = Math.round(window.innerHeight * adpr);
    cols = Math.ceil(window.innerWidth / CELL);
    rows = Math.ceil(window.innerHeight / CELL);
    sampleCv.width = cols;
    sampleCv.height = rows;
  };
  on("resize", sizeAscii);
  sizeAscii();
  const colourCache = new Map<number, string>();
  const colour = (r: number, g: number, b: number) => {
    const key = (r << 16) | (g << 8) | b;
    let v = colourCache.get(key);
    if (!v) {
      v = `rgb(${r},${g},${b})`;
      colourCache.set(key, v);
    }
    return v;
  };
  const drawAscii = (t: number) => {
    if (!actx || !sctx || !asciiCv) return;
    if (mobile && asciiFrame++ % 2 === 1) return; // phones redraw the glyphs every other frame
    sctx.drawImage(canvas, 0, 0, cols, rows);
    const px = sctx.getImageData(0, 0, cols, rows).data;
    // auto-exposure: keep the field alive as the water darkens, letting it thin with depth
    let sum = 0;
    for (let i = 0; i < px.length; i += 4) sum += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    const mean = sum / (px.length / 4) / 255;
    gain += (Math.min(7, Math.max(1, 0.4 / Math.max(mean, 0.01))) - gain) * 0.15;

    actx.setTransform(adpr, 0, 0, adpr, 0, 0);
    actx.globalCompositeOperation = "source-over";
    actx.globalAlpha = 1;
    actx.filter = "none";
    actx.fillStyle = ASCII_BG;
    actx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    actx.font = glyphFont;
    actx.textBaseline = "top";
    const waveT = reduce ? 0 : t * 1.6;
    const k = 0.9 * gain;
    // lighter surface: near the top of the dive, the upper rows and the brightest glyphs lean toward
    // pale periwinkle and aqua, and the crests toward near-white; it fades out over the first ~30 m
    const surfaceK = 1 - THREE.MathUtils.smoothstep(depth, 0, 30);
    for (let y = 0; y < rows; y++) {
      const topK = Math.pow(1 - y / rows, 1.6);
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const r = (px[i] / 255 * k - 0.5) * 1.3 + 0.5;
        const g = (px[i + 1] / 255 * k - 0.5) * 1.3 + 0.5;
        const b = (px[i + 2] / 255 * k - 0.5) * 1.3 + 0.5;
        let L = 0.299 * r + 0.587 * g + 0.114 * b;
        L += 0.11 * Math.sin(x * 0.16 + y * 0.09 - waveT) * Math.sin(y * 0.05 + waveT * 0.37 + 1.3);
        L = Math.min(1, Math.max(0, L));
        const ci = Math.round(L * (RAMP.length - 1));
        if (ci === 0) continue;
        const lift = (0.55 + 0.75 * L) * 255;
        const cr = Math.min(255, Math.max(0, r * (1 - TINT_AMT + TINT_AMT * TINT[0]) * lift));
        const cg = Math.min(255, Math.max(0, g * (1 - TINT_AMT + TINT_AMT * TINT[1]) * lift));
        const cb = Math.min(255, Math.max(0, b * (1 - TINT_AMT + TINT_AMT * TINT[2]) * lift));
        const hi = Math.min(1, Math.max(0, (L - 0.5) / 0.45));
        const lm = surfaceK * Math.min(0.92, 0.12 + 0.55 * topK + 0.75 * hi * hi * (3 - 2 * hi));
        const aq = 0.5 + 0.5 * Math.sin(x * 0.045 + y * 0.03 + waveT * 0.15);
        const pr = 204 - 18 * aq;
        const pg = 212 + 22 * aq;
        const pb = 255 - 8 * aq;
        const w = hi > 0.7 ? (hi - 0.7) / 0.3 : 0;
        const tr = pr + (246 - pr) * w;
        const tg = pg + (248 - pg) * w;
        const tb = pb + (255 - pb) * w;
        actx.fillStyle = colour(
          (cr + (tr - cr) * lm) & 0xf8,
          (cg + (tg - cg) * lm) & 0xf8,
          (cb + (tb - cb) * lm) & 0xf8,
        );
        actx.fillText(RAMP[ci], x * CELL, y * CELL);
      }
    }
    // bloom 20: a soft blurred copy added on top (skipped where canvas filters are unsupported)
    actx.setTransform(1, 0, 0, 1, 0, 0);
    actx.globalCompositeOperation = "lighter";
    actx.globalAlpha = 0.2;
    actx.filter = `blur(${Math.round(5 * adpr)}px)`;
    if (actx.filter !== "none") actx.drawImage(asciiCv, 0, 0);
    actx.globalCompositeOperation = "source-over";
    actx.globalAlpha = 1;
    actx.filter = "none";
  };
  resize();

  let mouse: [number, number] = [0, 0];
  let mouseT: [number, number] = [0, 0];
  on(
    "pointermove",
    (e) => {
      mouseT = [(e.clientX / window.innerWidth - 0.5) * 2, -(e.clientY / window.innerHeight - 0.5) * 2];
    },
    { passive: true },
  );

  /* ---------- frame loop ---------- */
  const F = new THREE.Vector3();
  const R = new THREE.Vector3();
  const U = new THREE.Vector3();
  const M = new THREE.Matrix4();
  const UP = new THREE.Vector3(0, 1, 0);
  // layered sines read as a handheld camera rather than a machine
  const sway = (t: number, a: number, b: number, c: number) =>
    Math.sin(t * a) * 0.6 + Math.sin(t * b + 1.7) * 0.3 + Math.sin(t * c + 4.1) * 0.1;
  const ss = THREE.MathUtils.smoothstep;

  let depth = target;
  let last = performance.now();
  let time = 0;
  let slow = 0;
  let sampled = 0;
  let first = true;
  let raf = 0;

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += reduce ? 0 : dt;
    depth += (target - depth) * Math.min(1, dt * 4);
    mouse = [mouse[0] + (mouseT[0] - mouse[0]) * dt * 2, mouse[1] + (mouseT[1] - mouse[1]) * dt * 2];

    const hand = reduce ? 0 : 1;
    const pitch = THREE.MathUtils.lerp(0.74, 0.7, ss(depth, 0, 24)) + mouse[1] * 0.04 + hand * 0.016 * sway(time, 0.31, 0.53, 1.1);
    const yaw = mouse[0] * 0.07 + hand * 0.03 * sway(time, 0.17, 0.29, 0.83);
    const roll = hand * 0.012 * sway(time, 0.23, 0.41, 0.97);
    const bob = hand * 0.12 * Math.sin(time * 0.62) * (1 - ss(depth, 0, 10)); // the swell lifts you near the surface
    const camDepth = 2.4 + depth * 1.05 + bob;

    F.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).normalize();
    R.crossVectors(UP, F).normalize();
    U.crossVectors(F, R);
    R.applyAxisAngle(F, roll);
    U.applyAxisAngle(F, roll);

    oceanU.uF.value.copy(F);
    oceanU.uR.value.copy(R);
    oceanU.uU.value.copy(U);
    oceanU.uTime.value = time + 12;
    oceanU.uDepth.value = depth / MAX_DEPTH;
    oceanU.uCamDepth.value = camDepth;
    oceanU.uCamY.value = -camDepth;

    camera.position.set(0, -camDepth, 0);
    M.makeBasis(R.clone().negate(), U, F.clone().negate());
    camera.quaternion.setFromRotationMatrix(M);

    snowU.uCam.value.copy(camera.position);
    snowU.uTime.value = time;
    snowU.uLight.value = Math.max(0.08, Math.exp(-depth * 0.0115));
    grain.uniforms.uTime.value = (time * 60) % 1000;
    bloom.strength = THREE.MathUtils.lerp(0.5, 0.35, ss(depth, 0, 40));
    renderer.toneMappingExposure = THREE.MathUtils.lerp(1.3, 1.1, ss(depth, 0, 30));

    composer.render(dt);
    drawAscii(time);

    if (first) {
      first = false;
      window.setTimeout(clearGlare, 120);
    }

    // drop render resolution on slow devices so scrolling never stutters
    if (sampled < 300) {
      sampled++;
      if (dt > 0.026) slow++;
      if (sampled % 60 === 0) {
        if (slow > 25 && scale > 0.32) {
          scale *= 0.8;
          resize();
        }
        slow = 0;
      }
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    cleanups.forEach((fn) => fn());
    root.classList.remove("intro");
    composer.dispose();
    oceanGeo.dispose();
    oceanMat.dispose();
    snowGeo.dispose();
    snowMat.dispose();
    renderer.dispose();
  };
}
