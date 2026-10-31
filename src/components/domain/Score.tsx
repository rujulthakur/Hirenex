import { cn } from '@/lib/cn';
import { copy } from '@/lib/copy';
import { formatScore } from '@/lib/format';
import { AuthorityMarker } from './AuthorityMarker';
import type { CriterionScore } from '@/types';

const barTone = (v: number) => (v >= 70 ? 'bg-success' : v >= 40 ? 'bg-warning' : 'bg-danger');

/** Usage: <ScoreBar value={72} label="Skills" />. */
export function ScoreBar({ value, label }: { value: number; label: string }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-3">
      <div
        role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
        className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2"
      >
        <div className={cn('h-full rounded-full', barTone(pct))} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-sm tabular-nums">{formatScore(value)}</span>
    </div>
  );
}

/** Usage: <ScoreBreakdown scores={scores} />. One row per criterion with authority marker. */
export function ScoreBreakdown({ scores }: { scores: CriterionScore[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {scores.map((s) => {
        const name = s.criterionName ?? s.criterionId;
        return (
          <li key={s.criterionId} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span>{name}</span>
              <AuthorityMarker authority={s.authority} />
            </div>
            <ScoreBar value={s.score} label={name} />
          </li>
        );
      })}
    </ul>
  );
}

/** Usage: <TotalScore value={81.5} authority="code" />. */
export function TotalScore({ value, authority = 'code' }: { value: number | null; authority?: CriterionScore['authority'] }) {
  return (
    <div className="inline-flex items-baseline gap-2">
      <span className="text-3xl font-semibold tabular-nums">{value === null ? '–' : formatScore(value)}</span>
      <span className="text-sm text-muted">{copy.domain.outOf}</span>
      <AuthorityMarker authority={authority} />
    </div>
  );
}
