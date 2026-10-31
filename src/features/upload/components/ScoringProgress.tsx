import { useId } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Play, RotateCcw } from 'lucide-react';
import { Button, ProgressBar } from '@/components/ui';
import { copy } from '@/lib/copy';
import type { ScoringRun } from '../hooks/useScoringRun';

interface ScoringProgressProps {
  jobId: string;
  run: ScoringRun;
  /** False when there is nothing to score yet (no accepted resumes). */
  canRun: boolean;
  /** True while files are still uploading; running the scorer then would miss them. */
  uploading: boolean;
}

const linkClass =
  'inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-base font-medium text-primary-fg transition-colors duration-fast ease-standard hover:brightness-110 focus-visible:shadow-focus';

/**
 * Usage: <ScoringProgress jobId={id} run={run} canRun={n > 0} uploading={busy} />.
 * "Run scoring" CTA, live progress (X of N, failures), done state and the AI_UNAVAILABLE retry card.
 */
export function ScoringProgress({ jobId, run, canRun, uploading }: ScoringProgressProps) {
  const hintId = useId();
  const { phase, status, problem } = run;
  const working = phase === 'starting' || phase === 'running';
  const done = status?.done ?? 0;
  const total = status?.total ?? 0;
  const failures = status?.failures ?? 0;
  const blocked = !canRun || uploading;
  const label = phase === 'done' ? copy.upload.scoring.rerun : working ? copy.upload.scoring.running : copy.upload.scoring.run;

  return (
    <section aria-labelledby="scoring-title" className="flex flex-col gap-4 rounded-lg border border-border bg-surface-1 p-4">
      <header className="flex flex-col gap-1">
        <h2 id="scoring-title" className="text-md font-semibold">
          {copy.upload.scoring.title}
        </h2>
        <p className="text-sm text-muted">{copy.upload.scoring.intro}</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          loading={working}
          disabled={blocked || working}
          aria-describedby={!canRun ? hintId : undefined}
          onClick={run.start}
        >
          {phase === 'done' ? <RotateCcw aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" /> : <Play aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />}
          {label}
        </Button>
        {!canRun ? (
          <p id={hintId} className="text-sm text-muted">
            {copy.upload.scoring.noResumes}
          </p>
        ) : null}
      </div>

      {status !== undefined && (working || phase === 'done' || phase === 'failed') ? (
        <div className="flex flex-col gap-2">
          <ProgressBar label={copy.upload.scoring.progressLabel} value={done} max={total} tone={phase === 'done' ? 'success' : 'primary'} />
          <div aria-live="polite" className="flex flex-wrap items-center justify-between gap-2 text-sm tabular-nums">
            <span>{copy.upload.scoring.progress(done, total)}</span>
            {failures > 0 ? <span className="text-danger">{copy.upload.scoring.failures(failures)}</span> : null}
          </div>
          {failures > 0 && status?.firstFailure ? <p className="text-sm text-danger">{status.firstFailure}</p> : null}
        </div>
      ) : null}

      {phase === 'done' ? (
        <div role="status" className="flex flex-col gap-3 rounded-md border border-success bg-surface-2 p-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 aria-hidden="true" strokeWidth={1.5} className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <div className="flex flex-col gap-1">
              <p className="text-base font-medium">{copy.upload.scoring.doneTitle}</p>
              <p className="text-sm text-muted">{copy.upload.scoring.doneBody}</p>
            </div>
          </div>
          <div>
            <Link to={`/app/jobs/${jobId}/candidates`} className={linkClass}>
              {copy.upload.scoring.viewCandidates}
            </Link>
          </div>
        </div>
      ) : null}

      {problem === 'ai_unavailable' ? (
        <div role="alert" className="flex flex-col gap-3 rounded-md border border-warning bg-surface-2 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle aria-hidden="true" strokeWidth={1.5} className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div className="flex flex-col gap-1">
              <p className="text-base font-medium">{copy.upload.scoring.aiUnavailableTitle}</p>
              <p className="text-sm text-muted">{copy.upload.scoring.aiUnavailableBody}</p>
            </div>
          </div>
          <div>
            <Button variant="secondary" size="sm" disabled={blocked || working} onClick={run.start}>
              <RotateCcw aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
              {copy.upload.scoring.retry}
            </Button>
          </div>
        </div>
      ) : null}

      {problem === 'start_failed' ? (
        <p role="alert" className="text-sm text-danger">
          {copy.upload.scoring.startFailed}
        </p>
      ) : null}
      {problem === 'status_failed' ? (
        <p role="status" className="text-sm text-muted">
          {copy.upload.scoring.statusFailed}
        </p>
      ) : null}
      {problem === 'run_failed' ? (
        <p role="alert" className="text-sm text-danger">
          {copy.upload.scoring.failedTitle}
        </p>
      ) : null}
    </section>
  );
}
