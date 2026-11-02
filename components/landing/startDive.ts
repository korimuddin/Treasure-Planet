import { OCEAN_FRAGMENT, OCEAN_VERTEX } from "./oceanShader";

const MAX_DEPTH = 200; // metres reached at the bottom of the page

type Mote = { x: number; y: number; z: number; r: number; ph: number; bubble: boolean };

/**
 * Starts the scroll-driven ocean dive inside `root` (the `.tp-dive` element).
 * Scroll position maps to depth; the WebGL ocean, drifting motes, hero fade,
 * header state, NDA demo card and entrance glare are all driven from here.
 * Returns a cleanup function for React's effect teardown.
 */
export function startDive(root: HTMLElement): () => void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel);

  const cv = q<HTMLCanvasElement>("#ocean");
  const mc = q<HTMLCanvasElement>("#motes");
  const heroInner = q<HTMLElement>(".hero-inner");
  const title = q<HTMLElement>(".hero h1");
  const hero = q<HTMLElement>(".hero");
  const topbar = q<HTMLElement>(".topbar");
  const line = q<HTMLElement>("#interlude-line");
  const glare = q<HTMLElement>("#glare");
  if (!cv || !mc || !heroInner || !title || !hero || !topbar) return () => {};

  const cleanups: Array<() => void> = [];
  const on = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions) => {
    window.addEventListener(type, fn, opts);
    cleanups.push(() => window.removeEventListener(type, fn, opts));
  };

  /* ---------- WebGL ocean ---------- */
  const gl = cv.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
  let glOK = false;
  let uRes: WebGLUniformLocation | null = null;
  let uTime: WebGLUniformLocation | null = null;
  let uDepth: WebGLUniformLocation | null = null;
  let uMouse: WebGLUniformLocation | null = null;
  if (gl) {
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const v = compile(gl.VERTEX_SHADER, OCEAN_VERTEX);
    const f = compile(gl.FRAGMENT_SHADER, OCEAN_FRAGMENT);
    const prog = v && f ? gl.createProgram() : null;
    if (prog && v && f) {
      gl.attachShader(prog, v);
      gl.attachShader(prog, f);
      gl.linkProgram(prog);
      if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl.useProgram(prog);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, "p");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        uRes = gl.getUniformLocation(prog, "uRes");
        uTime = gl.getUniformLocation(prog, "uTime");
        uDepth = gl.getUniformLocation(prog, "uDepth");
        uMouse = gl.getUniformLocation(prog, "uMouse");
        glOK = true;
      }
    }
  }

  /* ---------- motes ---------- */
  const mx = mc.getContext("2d");
  const motes: Mote[] = Array.from({ length: 140 }, () => ({
    x: Math.random(),
    y: Math.random(),
    z: 0.3 + Math.random() * 0.7,
    r: 0.4 + Math.random() * 1.6,
    ph: Math.random() * 6.28,
    bubble: Math.random() < 0.18,
  }));

  let W = 0;
  let H = 0;
  let dpr = 1;
  let scale = window.innerWidth < 700 ? 0.45 : 0.6;
  const resize = () => {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const s = Math.min(1, dpr * (W > 1600 ? Math.min(scale, 0.5) : scale));
    cv.width = Math.round(W * s);
    cv.height = Math.round(H * s);
    mc.width = Math.round(W * dpr);
    mc.height = Math.round(H * dpr);
    if (glOK && gl) gl.viewport(0, 0, cv.width, cv.height);
  };
  on("resize", resize);
  resize();

  /* ---------- title fit, hero fade, header ---------- */
  const fitTitle = () => {
    const avail = Math.min(hero.clientWidth - 32, 1240);
    title.style.fontSize = "200px";
    const w = title.scrollWidth || 1;
    title.style.fontSize = `${Math.max(28, Math.min(200, (200 * avail) / w)).toFixed(1)}px`;
  };
  fitTitle();
  on("resize", fitTitle);
  document.fonts?.ready.then(fitTitle).catch(() => {});

  let target = 0;
  const readScroll = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    target = Math.min(1, Math.max(0, window.scrollY / max)) * MAX_DEPTH;
  };
  const onScroll = () => {
    readScroll();
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
  let depth = target;

  let mouse: [number, number] = [0, 0];
  let mouseT: [number, number] = [0, 0];
  on("pointermove", (e) => {
    mouseT = [(e.clientX / W - 0.5) * 2, -(e.clientY / H - 0.5) * 2];
  }, { passive: true });

  /* ---------- NDA demo card ---------- */
  const listing = q<HTMLElement>("#listing");
  const reveal = q<HTMLButtonElement>("#reveal");
  const state = q<HTMLElement>("#l-state");
  const note = q<HTMLElement>("#l-note");
  if (listing && reveal) {
    const toggle = () => {
      const open = listing.classList.toggle("open");
      if (state) state.textContent = open ? "NDA signed · open" : "Sealed";
      reveal.textContent = open ? "Seal again" : "Sign NDA to reveal";
      if (note) note.textContent = open ? "Demo only, no NDA was signed" : "Sample data for illustration";
    };
    reveal.addEventListener("click", toggle);
    cleanups.push(() => reveal.removeEventListener("click", toggle));
  }

  /* ---------- entrance ---------- */
  if (!reduce) root.classList.add("intro");
  const clearGlare = () => glare?.classList.add("gone");
  const glareTimer = window.setTimeout(clearGlare, 2500);

  /* ---------- frame loop ---------- */
  let last = performance.now();
  let time = 0;
  let lastDepth = depth;
  let slowFrames = 0;
  let sampled = 0;
  let firstFrame = true;
  let raf = 0;

  // drop render resolution on slow devices so scrolling never stutters
  const tuneQuality = (dt: number) => {
    if (sampled > 240) return;
    sampled++;
    if (dt > 0.026) slowFrames++;
    if (sampled % 60 === 0) {
      if (slowFrames > 25 && scale > 0.32) {
        scale *= 0.78;
        resize();
      }
      slowFrames = 0;
    }
  };

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    tuneQuality(dt);
    time += reduce ? 0 : dt;
    depth += (target - depth) * Math.min(1, dt * 4);
    mouse = [mouse[0] + (mouseT[0] - mouse[0]) * dt * 2, mouse[1] + (mouseT[1] - mouse[1]) * dt * 2];

    if (glOK && gl) {
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.uniform1f(uTime, time + 12.0);
      gl.uniform1f(uDepth, depth / MAX_DEPTH);
      gl.uniform2f(uMouse, mouse[0], mouse[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (firstFrame) {
      firstFrame = false;
      window.setTimeout(clearGlare, 120);
    }

    if (mx) {
      const dDepth = depth - lastDepth;
      lastDepth = depth;
      mx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mx.clearRect(0, 0, W, H);
      const shallow = 1 - Math.min(1, depth / 40);
      for (const p of motes) {
        p.y -= dDepth * 0.006 * p.z + (reduce ? 0 : (p.bubble ? 0.00045 : 0.00006) * p.z);
        p.x += reduce ? 0 : Math.sin(time * 0.5 + p.ph) * 0.00012;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        if (p.y > 1.02) { p.y = -0.02; p.x = Math.random(); }
        const x = p.x * W;
        const y = p.y * H;
        const r = p.r * p.z * (p.bubble ? 1.8 : 1);
        if (p.bubble) {
          mx.strokeStyle = `rgba(230,245,255,${0.22 + 0.25 * p.z * (0.4 + shallow)})`;
          mx.lineWidth = 0.8;
          mx.beginPath();
          mx.arc(x, y, r + 0.8, 0, 6.283);
          mx.stroke();
        } else {
          mx.fillStyle = `rgba(210,235,255,${0.12 + 0.35 * p.z})`;
          mx.beginPath();
          mx.arc(x, y, r, 0, 6.283);
          mx.fill();
        }
      }
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    window.clearTimeout(glareTimer);
    cleanups.forEach((fn) => fn());
    root.classList.remove("intro");
  };
}
