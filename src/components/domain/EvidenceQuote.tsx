import { motion } from 'framer-motion';
import { CheckCircle2, CircleSlash, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { copy } from '@/lib/copy';
import { duration, easing, useReducedMotionSafe } from '@/lib/motion';
import type { Variants } from 'framer-motion';
import type { CriterionScore } from '@/types';

/** Usage: <VerifiedChip verified />. Check + text, never colour-only. */
export function VerifiedChip({ verified }: { verified: boolean }) {
  const Icon = verified ? CheckCircle2 : XCircle;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium', verified ? 'border-success text-success' : 'border-danger text-danger')}>
      <Icon className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
      {verified ? copy.domain.verified : copy.domain.unverified}
    </span>
  );
}

const stamp: Variants = {
  hidden: { scale: 1.4, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: duration.base, ease: easing.emphasized } },
};

interface Props { score: CriterionScore; active?: boolean; onSelect?: () => void }

/** Usage: <EvidenceQuote score={s} active onSelect={...} />. Unverified quotes are struck through with explanation. */
export function EvidenceQuote({ score, active = false, onSelect }: Props) {
  const variants = useReducedMotionSafe(stamp);
  const name = score.criterionName ?? score.criterionId;
  return (
    <div className={cn('flex flex-col gap-2 rounded-md border p-3', active ? 'border-primary bg-surface-2' : 'border-border bg-surface-1')}>
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onSelect} className="rounded-sm text-left text-sm font-medium focus-visible:shadow-focus">
          {name}
        </button>
        <span className="text-sm tabular-nums">{score.score}</span>
      </div>
      {score.missing || score.quote === null ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <CircleSlash className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          {copy.domain.missing}. {copy.domain.missingExplain}
        </p>
      ) : (
        <>
          <blockquote className={cn('border-l-2 pl-3 text-sm', score.verified ? 'border-success' : 'border-danger text-muted line-through')}>
            {score.quote}
          </blockquote>
          {!score.verified && <p className="text-xs text-danger">{copy.domain.unverifiedExplain}</p>}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <motion.span key={String(score.verified)} variants={variants} initial="hidden" animate="visible">
              <VerifiedChip verified={score.verified} />
            </motion.span>
            <span className="tabular-nums">{copy.domain.confidence(Math.round(score.confidence * 100))}</span>
            {score.location && <span className="font-mono">{copy.domain.location(score.location.start, score.location.end)}</span>}
          </div>
        </>
      )}
    </div>
  );
}
