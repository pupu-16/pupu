"use client";

import { useEffect, useRef } from "react";
import { EmotionCategory } from "@/app/lib/chat-engine";
import { LifeformState, TimeOfDay, timeOfDayConfigs } from "@/app/lib/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface CanvasParticle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  targetBaseX: number;
  targetBaseY: number;
  radius: number;
  color: [number, number, number];
  opacity: number;
  phase: number;
  driftRadius: number;
  driftAngle: number;
  driftSpeed: number;
}

interface CanvasLifeformProps {
  characterImage?: string | null;
  emotion?: EmotionCategory | null;
  timeOfDay?: TimeOfDay;
  musicChannel?: string | null;
  isMusicPlaying?: boolean;
  lifeformState?: LifeformState;
}

/* state modifiers — multiplicative on top of base config */
const STATE_MODS: Record<LifeformState, { spread: number; brightness: number; breath: number; drift: number }> = {
  idle:        { spread: 1.0,  brightness: 1.0,  breath: 1.0,  drift: 1.0 },
  listening:   { spread: 0.80, brightness: 1.10, breath: 0.92, drift: 0.76 },
  thinking:    { spread: 0.68, brightness: 1.14, breath: 0.86, drift: 0.64 },
  responding:  { spread: 1.20, brightness: 1.08, breath: 1.08, drift: 1.22 },
  remembering: { spread: 0.72, brightness: 1.12, breath: 0.94, drift: 0.68 }
};

interface SampledPoint {
  x: number;  // 0-1 normalized
  y: number;  // 0-1 normalized
  r: number;
  g: number;
  b: number;
}

/* ------------------------------------------------------------------ */
/*  Palette                                                            */
/* ------------------------------------------------------------------ */
const PALETTE: [number, number, number][] = [
  [129, 244, 218], [248, 198, 147], [184, 211, 255],
  [226, 169, 210], [199, 238, 176], [166, 220, 235],
  [240, 180, 140], [180, 200, 240]
];

/* ------------------------------------------------------------------ */
/*  Image sampling (runs once per character change)                     */
/* ------------------------------------------------------------------ */
const SAMPLE_SIZE = 180;
const SAMPLE_COUNT = 140;

function sampleCharacterImage(img: HTMLImageElement): SampledPoint[] | null {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    /* fit image into square, center-crop */
    const scale = Math.max(SAMPLE_SIZE / img.width, SAMPLE_SIZE / img.height);
    const sw = img.width * scale;
    const sh = img.height * scale;
    const sx = (SAMPLE_SIZE - sw) / 2;
    const sy = (SAMPLE_SIZE - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh);

    const imageData = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const d = imageData.data;

    /* ---- build candidate list with edge weights ---- */
    interface Candidate { x: number; y: number; r: number; g: number; b: number; w: number }
    const candidates: Candidate[] = [];

    for (let y = 1; y < SAMPLE_SIZE - 1; y++) {
      for (let x = 1; x < SAMPLE_SIZE - 1; x++) {
        const i = (y * SAMPLE_SIZE + x) * 4;
        const a = d[i + 3];
        if (a < 60) continue;

        const r = d[i]; const g = d[i + 1]; const b = d[i + 2];

        /* simple edge magnitude (difference from right + bottom neighbors) */
        const ir = (y * SAMPLE_SIZE + (x + 1)) * 4;
        const ib = ((y + 1) * SAMPLE_SIZE + x) * 4;
        const edge =
          Math.abs(r - d[ir]) + Math.abs(g - d[ir + 1]) + Math.abs(b - d[ir + 2]) +
          Math.abs(r - d[ib]) + Math.abs(g - d[ib + 1]) + Math.abs(b - d[ib + 2]);

        const brightness = (r + g + b) / 3;
        /* weight = edge (contour) + mild brightness bias */
        const w = edge * 2.5 + brightness * 0.3 + a * 0.15 + 1;

        candidates.push({ x, y, r, g, b, w });
      }
    }

    if (candidates.length < 20) return null;

    /* ---- weighted reservoir sampling ---- */
    const totalW = candidates.reduce((s, c) => s + c.w, 0);
    const points: SampledPoint[] = [];

    for (let n = 0; n < SAMPLE_COUNT; n++) {
      let target = Math.random() * totalW;
      for (let i = 0; i < candidates.length; i++) {
        target -= candidates[i].w;
        if (target <= 0 || i === candidates.length - 1) {
          const c = candidates[i];
          points.push({
            x: (c.x / SAMPLE_SIZE - 0.5) * 1.25,
            y: (c.y / SAMPLE_SIZE - 0.5) * 1.25,
            r: c.r, g: c.g, b: c.b
          });
          break;
        }
      }
    }

    return points;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function CanvasLifeform({
  characterImage,
  emotion: _emotion,
  timeOfDay = "day",
  musicChannel: _musicChannel,
  isMusicPlaying: _isMusicPlaying,
  lifeformState = "idle"
}: CanvasLifeformProps) {
  void _emotion; void _musicChannel; void _isMusicPlaying;

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<CanvasParticle[]>([]);
  const defaultPositionsRef = useRef<{ x: number; y: number }[]>([]);
  const characterPointsRef = useRef<SampledPoint[] | null>(null);
  const transitioningRef = useRef(false);
  const transitionStartRef = useRef(0);
  const rafRef = useRef<number>(0);
  const dimensionsRef = useRef({ w: 800, h: 800 });
  const phaseRef = useRef(0);
  const configRef = useRef(timeOfDayConfigs[timeOfDay]);
  const prevImageRef = useRef<string | null | undefined>(undefined);
  const pointerRef = useRef({ x: 0, y: 0, active: false });

  const TRANSITION_MS = 2000;
  const POINTER_RADIUS = 130;
  const POINTER_MAX_FORCE = 16;

  /* smooth state lerp */
  const stateCurrentRef = useRef({ spread: 1, brightness: 1, breath: 1, drift: 1 });
  const lifeformStateRef = useRef<LifeformState>("idle");
  useEffect(() => { lifeformStateRef.current = lifeformState; }, [lifeformState]);
  const PARTICLE_COUNT = 140;

  /* sync config */
  useEffect(() => {
    configRef.current = timeOfDayConfigs[timeOfDay];
  }, [timeOfDay]);

  /* ---- init default positions (gaussian cloud) ---- */
  function makeDefaultPositions(cx: number, cy: number, r: number) {
    const arr: { x: number; y: number }[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = r * Math.pow(Math.random(), 0.55);
      arr.push({ x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist });
    }
    return arr;
  }

  function makeParticle(baseX: number, baseY: number): CanvasParticle {
    return {
      x: baseX, y: baseY,
      baseX, baseY,
      targetBaseX: baseX, targetBaseY: baseY,
      radius: 1.2 + Math.random() * 3.2,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      opacity: 0.25 + Math.random() * 0.55,
      phase: Math.random() * Math.PI * 2,
      driftRadius: 3 + Math.random() * 22,
      driftAngle: Math.random() * Math.PI * 2,
      driftSpeed: 0.15 + Math.random() * 0.45
    };
  }

  function initParticles(cx: number, cy: number, radius: number) {
    const defaults = makeDefaultPositions(cx, cy, radius);
    defaultPositionsRef.current = defaults;
    particlesRef.current = defaults.map((d) => makeParticle(d.x, d.y));
  }

  /* ---- character image → sampled points ---- */
  useEffect(() => {
    const imgUrl = characterImage || null;
    if (imgUrl === prevImageRef.current) return;
    prevImageRef.current = imgUrl;

    if (!imgUrl) {
      /* restore defaults */
      const defaults = defaultPositionsRef.current;
      if (defaults.length === 0) return;
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const d = defaults[i] ?? defaults[defaults.length - 1];
        particles[i].targetBaseX = d.x;
        particles[i].targetBaseY = d.y;
      }
      characterPointsRef.current = null;
      transitioningRef.current = true;
      transitionStartRef.current = performance.now();
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const points = sampleCharacterImage(img);
      if (!points) {
        /* sampling failed — keep current state */
        return;
      }

      characterPointsRef.current = points;

      const { w, h } = dimensionsRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const scale = Math.min(w, h) * 0.38;

      const particles = particlesRef.current;
      /* if particle count changed, regenerate */
      if (particles.length === 0) return;

      for (let i = 0; i < particles.length; i++) {
        const pt = points[i % points.length];
        particles[i].targetBaseX = cx + pt.x * scale;
        particles[i].targetBaseY = cy + pt.y * scale;
        /* adopt sampled color */
        particles[i].color = [pt.r, pt.g, pt.b];
      }

      transitioningRef.current = true;
      transitionStartRef.current = performance.now();
    };
    img.onerror = () => {
      /* load failed — keep current state, don't crash */
    };
    img.src = imgUrl;
  }, [characterImage]);

  /* ---- canvas setup ---- */
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = container!.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return;

      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      dimensionsRef.current = { w, h };

      if (particlesRef.current.length === 0) {
        initParticles(w / 2, h / 2, Math.min(w, h) * 0.34);
      }
    }

    resize();

    /* pointer tracking */
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas!.getBoundingClientRect();
      pointerRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true
      };
    };
    const onPointerLeave = () => {
      pointerRef.current.active = false;
    };
    const onPointerEnter = (e: PointerEvent) => {
      const rect = canvas!.getBoundingClientRect();
      pointerRef.current.x = e.clientX - rect.left;
      pointerRef.current.y = e.clientY - rect.top;
      pointerRef.current.active = true;
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("pointerenter", onPointerEnter);

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => {
      observer.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointerenter", onPointerEnter);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- animation loop ---- */
  useEffect(() => {
    let running = true;

    function frame() {
      if (!running) return;

      const cvs = canvasRef.current;
      const c = cvs?.getContext("2d");
      if (!cvs || !c) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      const { w, h } = dimensionsRef.current;
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cfg = configRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const dt = 0.016;
      const now = performance.now();

      /* transition progress */
      const isTrans = transitioningRef.current;
      const transElapsed = isTrans ? now - transitionStartRef.current : TRANSITION_MS;
      const transT = Math.min(transElapsed / TRANSITION_MS, 1);
      if (isTrans && transT >= 1) transitioningRef.current = false;

      /* smooth state lerp (must run before breathing uses sc) */
      const st = STATE_MODS[lifeformStateRef.current];
      const sc = stateCurrentRef.current;
      sc.spread += (st.spread - sc.spread) * 0.06;
      sc.brightness += (st.brightness - sc.brightness) * 0.06;
      sc.breath += (st.breath - sc.breath) * 0.06;
      sc.drift += (st.drift - sc.drift) * 0.06;

      /* breathing (state-modulated) */
      const breathSpeed = (2 * Math.PI) / (cfg.breathingDuration / Math.max(sc.breath, 0.5));
      phaseRef.current += breathSpeed * dt;

      const particles = particlesRef.current;
      const speedMul = cfg.particleSpeedMul;
      const brightnessMul = cfg.particleBrightnessMul;
      const driftMul = cfg.driftMul ?? 1.0;
      /* faster lerp during transition */
      const baseLerp = isTrans ? 0.07 : 0.025;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        /* move base toward target */
        p.baseX += (p.targetBaseX - p.baseX) * baseLerp;
        p.baseY += (p.targetBaseY - p.baseY) * baseLerp;

        /* breathing scale (state-modulated spread) */
        const breathAmp = 0.05 * sc.spread;
        const breathScale = 1 + Math.sin(phaseRef.current + p.phase) * breathAmp;
        const bx = cx + (p.baseX - cx) * breathScale;
        const by = cy + (p.baseY - cy) * breathScale;

        /* drift orbit (state-modulated drift) */
        p.driftAngle += p.driftSpeed * speedMul * 0.012;
        const driftDx = Math.cos(p.driftAngle) * p.driftRadius * driftMul * sc.drift;
        const driftDy = Math.sin(p.driftAngle) * p.driftRadius * driftMul * sc.drift * 0.7;

        /* pointer repulsion */
        let mx = 0, my = 0;
        const ptr = pointerRef.current;
        if (ptr.active) {
          const pdx = p.x - ptr.x;
          const pdy = p.y - ptr.y;
          const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pdist < POINTER_RADIUS && pdist > 0.5) {
            const strength =
              Math.pow(1 - pdist / POINTER_RADIUS, 2.2) * POINTER_MAX_FORCE;
            mx = (pdx / pdist) * strength;
            my = (pdy / pdist) * strength;
          }
        }

        const tx = bx + driftDx + mx;
        const ty = by + driftDy + my;

        p.x += (tx - p.x) * 0.06;
        p.y += (ty - p.y) * 0.06;
      }

      /* ---- draw ---- */
      c.clearRect(0, 0, cvs.width, cvs.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const alpha = p.opacity * brightnessMul * sc.brightness;
        if (alpha < 0.03) continue;

        const [r, g, b] = p.color;
        const px = p.x * dpr;
        const py = p.y * dpr;
        const size = p.radius * dpr;

        /* outer glow */
        const glow = c.createRadialGradient(px, py, 0, px, py, size * 5);
        glow.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.42})`);
        glow.addColorStop(0.4, `rgba(${r},${g},${b},${alpha * 0.14})`);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        c.beginPath();
        c.arc(px, py, size * 5, 0, Math.PI * 2);
        c.fillStyle = glow;
        c.fill();

        /* bright core */
        const core = c.createRadialGradient(px, py, 0, px, py, size);
        const hr = Math.min(255, r + 60);
        const hg = Math.min(255, g + 60);
        const hb = Math.min(255, b + 60);
        core.addColorStop(0, `rgba(${hr},${hg},${hb},${alpha * 0.88})`);
        core.addColorStop(0.5, `rgba(${r},${g},${b},${alpha * 0.48})`);
        core.addColorStop(1, "rgba(0,0,0,0)");
        c.beginPath();
        c.arc(px, py, size, 0, Math.PI * 2);
        c.fillStyle = core;
        c.fill();
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full flex-1" style={{ minHeight: 0 }}>
      <canvas ref={canvasRef} className="absolute inset-0" style={{ display: "block" }} />
    </div>
  );
}
