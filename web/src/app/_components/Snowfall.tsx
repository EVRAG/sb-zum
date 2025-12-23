"use client";

import { useEffect, useRef } from "react";

type Flake = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  a: number;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

export function Snowfall({
  count = 70,
  maxRadius = 6,
  minRadius = 1.2,
}: {
  count?: number;
  maxRadius?: number;
  minRadius?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const flakesRef = useRef<Flake[]>([]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const resize = () => {
      const { innerWidth: w, innerHeight: h } = window;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const rnd = (min: number, max: number) => min + Math.random() * (max - min);

    const speedK = 1 / 5;

    const init = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      flakesRef.current = Array.from({ length: count }).map(() => {
        const r = rnd(minRadius, maxRadius);
        return {
          x: rnd(0, w),
          y: rnd(-h, h),
          r,
          vx: rnd(-0.25, 0.25) * speedK,
          vy: (rnd(0.5, 1.4) + r * 0.3) * speedK,
          a: rnd(0.5, 0.9),
        };
      });
    };

    resize();
    init();

    const step = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      for (const f of flakesRef.current) {
        f.x += f.vx;
        f.y += f.vy;

        // gentle sway
        f.x += Math.sin((f.y / 120) * 0.8) * 0.02;

        if (f.y - f.r > h) {
          f.y = -f.r - rnd(0, h * 0.2);
          f.x = rnd(0, w);
        }
        if (f.x < -10) f.x = w + 10;
        if (f.x > w + 10) f.x = -10;

        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${f.a})`;
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = window.requestAnimationFrame(step);
    };

    rafRef.current = window.requestAnimationFrame(step);

    window.addEventListener("resize", resize, { passive: true });
    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [count, maxRadius, minRadius]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: 0.85 }}
    />
  );
}


