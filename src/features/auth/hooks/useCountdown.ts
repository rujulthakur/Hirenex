import { useEffect, useState } from 'react';

/** Whole seconds left until `targetMs` (epoch ms). Ticks once per second and stops at 0. */
export function useCountdown(targetMs: number): number {
  const compute = () => Math.max(0, Math.ceil((targetMs - Date.now()) / 1000));
  const [seconds, setSeconds] = useState<number>(compute);

  useEffect(() => {
    setSeconds(Math.max(0, Math.ceil((targetMs - Date.now()) / 1000)));
    const id = window.setInterval(() => {
      const next = Math.max(0, Math.ceil((targetMs - Date.now()) / 1000));
      setSeconds(next);
      if (next === 0) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  return seconds;
}

/** 0 -> "0:00", 305 -> "5:05". */
export function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
