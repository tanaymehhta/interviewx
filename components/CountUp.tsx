"use client";
import { useEffect, useState } from "react";

/** Counts from one number to another over about 1.4 s. Instant under reduced motion. */
export function CountUp({ from = 0, to, decimals = 0 }: { from?: number; to: number; decimals?: number }) {
  const [v, setV] = useState(from);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setV(to);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1400);
      setV(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to]);
  return <>{v.toFixed(decimals)}</>;
}
