import { useQuery } from '@tanstack/react-query';
import { Button, Dialog, ErrorState, Skeleton } from '@/components/ui';
import { HighlightedText } from '@/components/domain';
import { copy } from '@/lib/copy';
import { api } from '@/services';
import { qk } from '@/services/queryKeys';

interface HiddenTextDialogProps {
  open: boolean;
  onClose: () => void;
  /** Candidate created for the flagged file. Null until the server returned one. */
  candidateId: string | null;
  fileName: string;
}

/**
 * Opens the redacted resume in HighlightedText hidden-text mode so HR can read what the shield caught.
 * Usage: <HiddenTextDialog open={o} onClose={close} candidateId={id} fileName={name} />.
 */
export function HiddenTextDialog({ open, onClose, candidateId, fileName }: HiddenTextDialogProps) {
  const query = useQuery({
    queryKey: qk.candidates.detail(candidateId ?? ''),
    queryFn: () => api.candidates.get(candidateId ?? ''),
    enabled: open && candidateId !== null,
  });
  const candidate = query.data;
  const findings = candidate?.hiddenFindings ?? [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={`${copy.upload.hiddenTitle}: ${fileName}`}
      description={copy.upload.hiddenBody}
      footer={
        <Button variant="secondary" onClick={onClose}>
          {copy.overlays.close}
        </Button>
      }
    >
      {candidateId === null ? (
        <p className="text-base text-muted">{copy.upload.hiddenLoadFailed}</p>
      ) : query.isLoading ? (
        <div aria-busy="true" aria-label={copy.common.loading} className="flex flex-col gap-3">
          <Skeleton variant="text" />
          <Skeleton variant="text" />
          <Skeleton variant="card" />
        </div>
      ) : query.isError || candidate === undefined ? (
        <ErrorState message={copy.upload.hiddenLoadFailed} onRetry={() => void query.refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          {findings.length === 0 ? (
            <p className="text-base text-muted">{copy.upload.hiddenNone}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {findings.map((f) => (
                <li key={`${f.kind}-${f.start}-${f.end}`} className="rounded-md border border-dashed border-danger bg-surface-2 px-3 py-2">
                  <p className="text-xs font-medium text-muted">
                    {f.kind === 'hidden_text' ? copy.domain.hiddenLabel : copy.domain.injectionLabel}
                  </p>
                  <p className="mt-1 break-words font-mono text-sm text-text">{f.text}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="rounded-md border border-border bg-surface-2 p-3">
            <HighlightedText text={candidate.redactedText ?? ''} hiddenFindings={findings} showHidden />
          </div>
        </div>
      )}
    </Dialog>
  );
}
