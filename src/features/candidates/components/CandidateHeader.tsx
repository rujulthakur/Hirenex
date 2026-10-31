import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { FlagBadge, StageBadge, TotalScore } from '@/components/domain';
import { copy } from '@/lib/copy';
import type { Candidate } from '@/types';
import { ReviewClock } from '@/features/hiring/components/ReviewClock';
import { useCandidateName } from '../hooks/useCandidateName';

interface CandidateHeaderProps {
  candidate: Candidate;
  jobId: string;
  /** Buttons for the right side (swap test, delete). */
  actions?: ReactNode;
}

const backLink =
  'inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted transition-colors duration-fast ease-standard hover:text-text focus-visible:shadow-focus';

/**
 * Usage: <CandidateHeader candidate={c} jobId={id} actions={<Button>…</Button>} />.
 * Shows the (blind-mode aware) name, rank, total score with its authority marker, stage and flags.
 */
export function CandidateHeader({ candidate, jobId, actions }: CandidateHeaderProps) {
  const nameOf = useCandidateName();
  return (
    <header className="flex flex-col gap-4">
      <Link to={`/app/jobs/${jobId}/candidates`} className={backLink}>
        <ArrowLeft aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
        {copy.candidates.detail.back}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold">{nameOf(candidate)}</h1>
          <dl className="flex flex-wrap items-end gap-x-8 gap-y-3">
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted">{copy.candidates.detail.rank}</dt>
              <dd className="text-3xl font-semibold tabular-nums">{candidate.rank === null ? copy.candidates.noRank : `#${candidate.rank}`}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted">{copy.candidates.detail.total}</dt>
              <dd>
                <TotalScore value={candidate.totalScore} authority="code" />
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted">{copy.candidates.detail.stage}</dt>
              <dd>
                <span className="flex flex-wrap items-center gap-2">
                  <StageBadge stage={candidate.stage} />
                  <ReviewClock candidate={candidate} />
                </span>
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted">{copy.candidates.detail.flags}</dt>
              <dd className="flex flex-wrap gap-1">
                {candidate.flags.length === 0 ? (
                  <span className="text-base text-muted">{copy.candidates.noFlags}</span>
                ) : (
                  candidate.flags.map((f) => <FlagBadge key={f} flag={f} />)
                )}
              </dd>
            </div>
          </dl>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
