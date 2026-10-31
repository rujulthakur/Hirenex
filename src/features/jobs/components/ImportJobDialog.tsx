import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button, Dialog, FileDropzone, InlineAlert, Spinner } from '@/components/ui';
import { copy } from '@/lib/copy';
import { localZone } from '@/lib/time';
import { api } from '@/services';
import type { JobImportResult } from '@/services/contract';
import { qk } from '@/services/queryKeys';

const linkClass =
  'inline-flex min-h-11 items-center justify-center rounded-md px-4 text-base font-medium transition-colors duration-fast ease-standard focus-visible:shadow-focus';

interface ImportJobDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Upload a job description document; the opening is created from it and listed straight away. */
export function ImportJobDialog({ open, onClose }: ImportJobDialogProps) {
  const t = copy.jobs.import;
  const client = useQueryClient();
  const [result, setResult] = useState<JobImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const importDoc = useMutation<JobImportResult, Error, File>({
    mutationFn: (file) => api.jobs.importDocument(file, localZone()),
    onSuccess: async (res) => {
      setResult(res);
      await client.invalidateQueries({ queryKey: qk.jobs.all });
    },
    onError: (e) => setError(e.message || t.failed),
  });

  const close = (): void => {
    setResult(null);
    setError(null);
    importDoc.reset();
    onClose();
  };

  const onFiles = (files: File[]): void => {
    const file = files[0];
    if (!file) return;
    setError(null);
    importDoc.mutate(file);
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title={result ? t.doneTitle : t.title}
      description={result ? undefined : t.description}
      footer={
        result ? (
          <>
            <Link to={`/app/jobs/${result.job.id}`} className={`${linkClass} border border-border text-text hover:bg-surface-2`} onClick={close}>
              {t.review}
            </Link>
            <Link to={`/app/jobs/${result.job.id}/upload`} className={`${linkClass} bg-primary text-primary-fg hover:brightness-110`} onClick={close}>
              {t.uploadResumes}
            </Link>
          </>
        ) : (
          <Button variant="outline" onClick={close}>
            {t.close}
          </Button>
        )
      }
    >
      {result ? (
        <div className="flex items-start gap-3">
          <CheckCircle2 aria-hidden="true" strokeWidth={1.5} className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="break-words text-base font-medium">{result.job.title}</p>
            <p className="text-sm text-muted">{t.doneBody(result.summary.requiredSkills, result.summary.criteria)}</p>
          </div>
        </div>
      ) : importDoc.isPending ? (
        <div role="status" className="flex items-center gap-3 py-6 text-base text-muted">
          <Spinner />
          {t.reading}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <FileDropzone files={[]} onFilesAdded={onFiles} onRejected={(r) => setError(r[0]?.reason ?? t.failed)} maxSizeMb={5} maxFiles={1} />
          {error !== null ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
        </div>
      )}
    </Dialog>
  );
}
