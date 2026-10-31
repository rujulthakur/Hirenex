import { AlertTriangle, CheckCircle2, Clock, FileText, ShieldAlert, X, XCircle } from 'lucide-react';
import { Badge, Button, Spinner } from '@/components/ui';
import { FlagBadge } from '@/components/domain';
import { copy } from '@/lib/copy';
import { hasShieldFlag } from '../uploadModel';
import type { RowState, UploadRow } from '../uploadModel';
import { ShieldMoment } from './ShieldMoment';

interface UploadFileListProps {
  rows: UploadRow[];
  onRemove: (id: string) => void;
  onViewHidden: (row: UploadRow) => void;
}

function formatSize(bytes: number): string {
  if (bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StateChip({ state }: { state: RowState }) {
  const label = copy.upload.state[state];
  switch (state) {
    case 'queued':
      return (
        <Badge>
          <Clock aria-hidden="true" strokeWidth={1.5} className="h-3 w-3" />
          {label}
        </Badge>
      );
    case 'uploading':
      return (
        <Badge tone="info" outline="dashed">
          <Spinner size="sm" className="h-3 w-3" />
          {label}
        </Badge>
      );
    case 'accepted':
      return (
        <Badge tone="success">
          <CheckCircle2 aria-hidden="true" strokeWidth={1.5} className="h-3 w-3" />
          {label}
        </Badge>
      );
    case 'flagged':
      return (
        <Badge tone="warning">
          <ShieldAlert aria-hidden="true" strokeWidth={1.5} className="h-3 w-3" />
          {label}
        </Badge>
      );
    case 'rejected':
    case 'failed':
      return (
        <Badge tone="danger">
          <XCircle aria-hidden="true" strokeWidth={1.5} className="h-3 w-3" />
          {label}
        </Badge>
      );
  }
}

/** Why a row was refused or failed, in plain language. Null when there is nothing to explain. */
function problemText(row: UploadRow): string | null {
  if (row.state === 'failed') return copy.upload.networkFailed;
  if (row.state !== 'rejected') return null;
  if (row.reason) return copy.upload.reason[row.reason];
  return row.note ?? null;
}

/**
 * Usage: <UploadFileList rows={rows} onRemove={remove} onViewHidden={open} />.
 * One row per file with its state, size, server flags and rejection reason. Rows whose scan hit the shield show the
 * compact ShieldMoment with a "View hidden text" action.
 */
export function UploadFileList({ rows, onRemove, onViewHidden }: UploadFileListProps) {
  return (
    <ul aria-label={copy.overlays.dropListLabel} className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface-1">
      {rows.map((row) => {
        const problem = problemText(row);
        const size = formatSize(row.sizeBytes);
        const showShield = hasShieldFlag(row.flags) && (row.state === 'flagged' || row.state === 'accepted');
        return (
          <li key={row.id} className="flex flex-col gap-2 px-3 py-2">
            <div className="flex min-h-11 items-center gap-3">
              {problem ? (
                <AlertTriangle aria-hidden="true" strokeWidth={1.5} className="h-4 w-4 shrink-0 text-danger" />
              ) : (
                <FileText aria-hidden="true" strokeWidth={1.5} className="h-4 w-4 shrink-0 text-muted" />
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-base">{row.name}</span>
                {size || problem ? (
                  <span className={problem ? 'text-xs text-danger' : 'text-xs text-muted'}>{problem ?? size}</span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1">
                {row.flags.map((flag) => (
                  <FlagBadge key={flag} flag={flag} />
                ))}
                <StateChip state={row.state} />
              </div>
              <Button
                variant="icon"
                aria-label={copy.upload.removeRow(row.name)}
                disabled={row.state === 'uploading'}
                onClick={() => onRemove(row.id)}
              >
                <X aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
              </Button>
            </div>
            {showShield ? <ShieldMoment flags={row.flags} fileName={row.name} onView={() => onViewHidden(row)} /> : null}
          </li>
        );
      })}
    </ul>
  );
}
