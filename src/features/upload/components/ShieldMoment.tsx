import { motion, useReducedMotion } from 'framer-motion';
import { Eye, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui';
import { copy } from '@/lib/copy';
import { duration, easing, spring } from '@/lib/motion';
import type { FlagKind } from '@/types';

interface ShieldMomentProps {
  flags: readonly FlagKind[];
  onView: () => void;
  fileName: string;
}

/**
 * Compact "evil resume" moment shown on a file row when the shield caught hidden text or an instruction-like phrase.
 * The shield icon springs in and a scan line sweeps once across the strip. With reduced motion the strip simply
 * appears. Usage: <ShieldMoment flags={row.flags} fileName={row.name} onView={open} />.
 */
export function ShieldMoment({ flags, onView, fileName }: ShieldMomentProps) {
  const reduce = useReducedMotion();
  const hidden = flags.includes('hidden_text_found');
  const injection = flags.includes('injection_phrase_found');
  const headline = hidden ? copy.upload.shieldCaught : copy.upload.shieldInjection;

  return (
    <motion.div
      role="status"
      initial={reduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : duration.base, ease: easing.standard }}
      className="relative flex flex-wrap items-center gap-3 overflow-hidden rounded-md border border-dashed border-danger bg-surface-2 px-3 py-2"
    >
      {reduce ? null : (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-danger opacity-10"
          initial={{ x: '-100%' }}
          animate={{ x: '400%' }}
          transition={{ duration: duration.slow * 2, ease: easing.emphasized }}
        />
      )}
      <motion.span
        aria-hidden="true"
        initial={reduce ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduce ? { duration: 0 } : spring.snappy}
        className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-danger text-danger"
      >
        <ShieldCheck strokeWidth={1.5} className="h-4 w-4" />
      </motion.span>
      <div className="relative flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium text-text">{headline}</span>
        <span className="text-xs text-muted">
          {hidden && injection ? `${copy.domain.flag.hidden_text_found} · ${copy.domain.flag.injection_phrase_found}` : hidden ? copy.domain.flag.hidden_text_found : copy.domain.flag.injection_phrase_found}
        </span>
      </div>
      <Button variant="secondary" size="sm" className="relative" onClick={onView} aria-label={`${copy.upload.viewHidden}: ${fileName}`}>
        <Eye aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
        {copy.upload.viewHidden}
      </Button>
    </motion.div>
  );
}
