import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Lock } from 'lucide-react';
import { FlagBadge } from '@/components/domain';
import { cn } from '@/lib/cn';
import { copy } from '@/lib/copy';
import { formatScore } from '@/lib/format';
import type { Candidate } from '@/types';
import { isCardDraggable } from '../candidatesModel';
import { ReviewClock } from '@/features/hiring/components/ReviewClock';
import { useCandidateName } from '../hooks/useCandidateName';

interface KanbanCardProps {
  candidate: Candidate;
  onOpen: (candidate: Candidate) => void;
}

function CardBody({ candidate, onOpen }: KanbanCardProps) {
  const nameOf = useCandidateName();
  const name = nameOf(candidate);
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <button
        type="button"
        aria-label={copy.candidates.openEvidence(name)}
        onClick={() => onOpen(candidate)}
        className="min-h-11 truncate rounded-sm text-left text-base font-medium hover:underline focus-visible:shadow-focus"
      >
        {name}
      </button>
      <p className="flex items-center gap-2 text-sm text-muted tabular-nums">
        <span>{candidate.rank === null ? copy.candidates.noRank : `#${candidate.rank}`}</span>
        <span aria-hidden="true">·</span>
        <span>{candidate.totalScore === null ? copy.candidates.noScore : formatScore(candidate.totalScore)}</span>
      </p>
      <ReviewClock candidate={candidate} className="self-start" />
      {candidate.flags.length > 0 ? (
        <span className="flex flex-wrap gap-1">
          {candidate.flags.map((f) => (
            <FlagBadge key={f} flag={f} />
          ))}
        </span>
      ) : null}
    </div>
  );
}

/** The card shown under the pointer while dragging. It is a plain copy with no drag hooks. */
export function KanbanCardPreview({ candidate }: { candidate: Candidate }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-primary bg-surface-2 p-3 shadow-lg">
      <GripVertical aria-hidden="true" strokeWidth={1.5} className="mt-3 h-4 w-4 shrink-0 text-muted" />
      <CardBody candidate={candidate} onOpen={() => undefined} />
    </div>
  );
}

/**
 * Usage: <KanbanCard candidate={c} onOpen={openDrawer} />.
 * Only cards in pre-approval stages have a drag handle. Approved stages show a lock with the reason, because
 * shortlisting, inviting and confirming are approval or candidate actions and are never done by dragging.
 */
export function KanbanCard({ candidate, onOpen }: KanbanCardProps) {
  const nameOf = useCandidateName();
  const name = nameOf(candidate);
  const draggable = isCardDraggable(candidate.stage);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: candidate.id,
    disabled: !draggable,
    data: { stage: candidate.stage },
  });

  return (
    <li
      ref={setNodeRef}
      className={cn(
        'flex items-start gap-2 rounded-md border border-border bg-surface-2 p-3 transition-opacity duration-fast ease-standard',
        isDragging && 'opacity-40',
      )}
    >
      {draggable ? (
        <button
          type="button"
          aria-label={copy.candidates.kanban.dragHandle(name)}
          {...attributes}
          {...listeners}
          className="mt-1 flex h-11 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-sm text-muted hover:text-text focus-visible:shadow-focus active:cursor-grabbing"
        >
          <GripVertical aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
        </button>
      ) : (
        <span className="mt-1 flex h-11 w-6 shrink-0 items-center justify-center text-muted" title={copy.candidates.kanban.locked}>
          <Lock aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
          <span className="sr-only">{copy.candidates.kanban.lockedLabel(name)}</span>
        </span>
      )}
      <CardBody candidate={candidate} onOpen={onOpen} />
    </li>
  );
}
