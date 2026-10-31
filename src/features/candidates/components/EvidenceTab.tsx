import { EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { EvidenceQuote } from '@/components/domain';
import { copy } from '@/lib/copy';
import type { CriterionScore } from '@/types';

interface EvidenceTabProps {
  scores: CriterionScore[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  activeId: string | null;
  /** Called when a criterion is chosen. The page uses it to jump to the highlighted quote in the resume. */
  onSelect: (criterionId: string) => void;
}

/**
 * Usage: <EvidenceTab scores={scores} isLoading={q.isLoading} isError={q.isError} onRetry={q.refetch} activeId={id} onSelect={pick} />.
 * One EvidenceQuote per criterion: score, quote, verified chip, confidence, authority, or the missing state.
 */
export function EvidenceTab({ scores, isLoading, isError, onRetry, activeId, onSelect }: EvidenceTabProps) {
  if (isLoading) {
    return (
      <div aria-busy="true" aria-label={copy.common.loading} className="flex flex-col gap-3">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    );
  }
  if (isError) return <ErrorState message={copy.candidates.detail.scoresFailed} onRetry={onRetry} />;
  if (!scores || scores.length === 0) return <EmptyState title={copy.candidates.detail.notScored} />;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base text-muted">{copy.candidates.detail.evidenceIntro}</p>
      <ul className="flex flex-col gap-3">
        {scores.map((s) => (
          <li key={s.criterionId}>
            <EvidenceQuote score={s} active={s.criterionId === activeId} onSelect={() => onSelect(s.criterionId)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
