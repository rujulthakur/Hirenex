import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Banner, ErrorState, FileDropzone, Skeleton } from '@/components/ui';
import { useJob } from '@/features/jobs/hooks/useJobs';
import { OpeningSelect } from '@/features/jobs/components/OpeningSelect';
import { copy } from '@/lib/copy';
import { HiddenTextDialog } from '../components/HiddenTextDialog';
import { ScoringProgress } from '../components/ScoringProgress';
import { UploadFileList } from '../components/UploadFileList';
import { UploadSummaryStrip } from '../components/UploadSummaryStrip';
import { useScoringRun } from '../hooks/useScoringRun';
import { useUploadQueue } from '../hooks/useUploadQueue';
import { scorableCount } from '../uploadModel';
import type { UploadRow } from '../uploadModel';

/** /app/jobs/:jobId/upload: bulk upload and scoring progress. */
export default function UploadPage() {
  const { jobId = '' } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const job = useJob(jobId);
  const queue = useUploadQueue(jobId);
  const run = useScoringRun(jobId);
  const [viewing, setViewing] = useState<UploadRow | null>(null);

  // Start scoring on its own once uploads finish. It waits for a running run to end, then picks up newer files.
  const scorable = scorableCount(queue.summary);
  const autoStarted = useRef(0);
  const { phase, start } = run;
  useEffect(() => {
    if (queue.busy || scorable === 0 || scorable <= autoStarted.current) return;
    if (phase === 'starting' || phase === 'running') return;
    autoStarted.current = scorable;
    start();
  }, [queue.busy, scorable, phase, start]);

  if (job.isLoading) {
    return (
      <section aria-busy="true" aria-label={copy.common.loading} className="flex flex-col gap-6 p-4 md:p-6">
        <Skeleton variant="text" lines={2} />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </section>
    );
  }

  if (job.isError || job.data === undefined) {
    return (
      <section className="p-4 md:p-6">
        <ErrorState message={copy.upload.jobMissing} onRetry={() => void job.refetch()} />
      </section>
    );
  }

  const existing = job.data.candidateCount ?? 0;
  const canRun = scorableCount(queue.summary) > 0 || existing > 0;

  return (
    <section className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-1">
        <div className="max-w-md">
          <OpeningSelect label="Opening" value={jobId} onChange={(id) => navigate(`/app/jobs/${id}/upload`)} disabled={queue.busy || run.phase === 'running'} />
        </div>
        <h1 className="text-2xl font-semibold">{copy.upload.title}</h1>
        <p className="text-base text-muted">{copy.upload.subtitle}</p>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex min-w-0 flex-col gap-4">
          <FileDropzone
            files={[]}
            onFilesAdded={queue.addFiles}
            onRejected={queue.addRejections}
            maxSizeMb={copy.upload.maxSizeMb}
            maxFiles={copy.upload.maxFiles}
          />
          <p className="text-sm text-muted">
            {copy.upload.limits(copy.upload.maxFiles, copy.upload.maxSizeMb)}. {copy.upload.batchNote}
          </p>

          {queue.notice !== null ? (
            <Banner tone="info" className="rounded-md border">
              {queue.notice}
            </Banner>
          ) : null}

          {queue.rows.length > 0 ? (
            <>
              <UploadSummaryStrip
                summary={queue.summary}
                busy={queue.busy}
                onRetryFailed={queue.retryFailed}
                onClear={queue.clearList}
              />
              <UploadFileList rows={queue.rows} onRemove={queue.removeRow} onViewHidden={setViewing} />
            </>
          ) : null}

          <ScoringProgress jobId={jobId} run={run} canRun={canRun} uploading={queue.busy} />
        </div>

      </div>

      <HiddenTextDialog
        open={viewing !== null}
        onClose={() => setViewing(null)}
        candidateId={viewing?.candidateId ?? null}
        fileName={viewing?.name ?? ''}
      />
    </section>
  );
}
