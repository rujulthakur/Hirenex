import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Card } from '@/components/ui';
import { formatCount } from '@/lib/format';

interface Props { label: string; value: number; suffix?: string; hint?: string }

/** Usage: <KpiCard label="Verified quotes" value={92} suffix="%" />. Count-up skipped under reduced motion. */
export function KpiCard({ label, value, suffix = '', hint }: Props) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) { setShown(value); return undefined; }
    const start = performance.now();
    const total = 600;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / total);
      setShown(Math.round(value * t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce]);
  return (
    <Card surface={1} className="flex flex-col gap-1">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-3xl font-semibold tabular-nums" aria-label={`${formatCount(value)}${suffix}`}>
        {formatCount(shown)}{suffix}
      </span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </Card>
  );
}
