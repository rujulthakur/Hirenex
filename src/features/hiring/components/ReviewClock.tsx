import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Candidate } from '@/types';
import { clockFor } from '../reviewClock';
import type { Urgency } from '../reviewClock';
import { useHiringSettings } from '../hooks/useHiring';

const tone: Record<Urgency, string> = {
  ok: 'border-border bg-surface-2 text-muted',
  soon: 'border-warning/50 bg-warning/10 text-warning',
  urgent: 'border-danger/50 bg-danger/10 text-danger',
  done: 'border-border bg-surface-2 text-muted',
};

/** Re-renders once a minute so the countdown stays honest while the page is open. */
function useNow(everyMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(t);
  }, [everyMs]);
  return now;
}

/** Usage: <ReviewClock candidate={c} />. Text label always present (never colour-only); wraps on narrow screens. */
export function ReviewClock({ candidate, className }: { candidate: Candidate; className?: string }) {
  const settings = useHiringSettings();
  const now = useNow();
  const clock = clockFor(candidate, settings, now);
  if (!clock) return null;
  return (
    <span className={cn('inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums', tone[clock.urgency], className)}>
      <Clock aria-hidden="true" strokeWidth={1.5} className="h-3 w-3 shrink-0" />
      <span className="min-w-0 break-words">{clock.label}</span>
    </span>
  );
}
