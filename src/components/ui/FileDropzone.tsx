import { useDropzone } from 'react-dropzone';
import type { FileRejection } from 'react-dropzone';
import { AlertTriangle, CheckCircle2, Clock, FileText, ShieldAlert, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { copy } from '@/lib/copy';
import { Badge } from './Badge';
import { Button } from './Button';
import { Spinner } from './Spinner';

export type DropzoneFileState = 'queued' | 'extracting' | 'scanning' | 'flagged' | 'done' | 'rejected';

export interface DropzoneFileItem {
  id: string;
  name: string;
  sizeBytes: number;
  state: DropzoneFileState;
  /** Extra detail, e.g. rejection reason or flag names. */
  detail?: string;
}

export interface DropzoneRejection {
  name: string;
  reason: string;
}

export interface FileDropzoneProps {
  files: DropzoneFileItem[];
  onFilesAdded: (files: File[]) => void;
  onRejected?: (rejections: DropzoneRejection[]) => void;
  onRemove?: (id: string) => void;
  maxSizeMb: number;
  maxFiles?: number;
  disabled?: boolean;
}

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

function reasonFor(r: FileRejection): string {
  const codes = r.errors.map((e) => e.code);
  if (codes.includes('file-invalid-type')) return copy.overlays.rejectType;
  if (codes.includes('file-too-large')) return copy.overlays.rejectSize;
  if (codes.includes('too-many-files')) return copy.overlays.rejectCount;
  return copy.overlays.rejectOther;
}

function StateChip({ state }: { state: DropzoneFileState }) {
  const label = copy.overlays.fileState[state];
  switch (state) {
    case 'queued':
      return (
        <Badge>
          <Clock aria-hidden="true" strokeWidth={1.5} className="h-3 w-3" />
          {label}
        </Badge>
      );
    case 'extracting':
    case 'scanning':
      return (
        <Badge tone="info" outline="dashed">
          <Spinner size="sm" className="h-3 w-3" />
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
    case 'done':
      return (
        <Badge tone="success">
          <CheckCircle2 aria-hidden="true" strokeWidth={1.5} className="h-3 w-3" />
          {label}
        </Badge>
      );
    case 'rejected':
      return (
        <Badge tone="danger">
          <XCircle aria-hidden="true" strokeWidth={1.5} className="h-3 w-3" />
          {label}
        </Badge>
      );
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Usage: <FileDropzone files={items} onFilesAdded={add} maxSizeMb={5} maxFiles={50} />. PDF and DOCX only. Parent owns the file list. */
export function FileDropzone({ files, onFilesAdded, onRejected, onRemove, maxSizeMb, maxFiles, disabled = false }: FileDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPT,
    maxSize: maxSizeMb * 1024 * 1024,
    maxFiles,
    disabled,
    onDrop: (accepted, rejected) => {
      if (accepted.length > 0) onFilesAdded(accepted);
      if (rejected.length > 0) onRejected?.(rejected.map((r) => ({ name: r.file.name, reason: reasonFor(r) })));
    },
  });

  return (
    <div className="flex flex-col gap-3">
      <div
        {...getRootProps({
          className: cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center transition-colors duration-fast focus-visible:shadow-focus focus-visible:outline-none',
            isDragActive ? 'border-primary bg-surface-2' : 'border-border bg-surface-1 hover:border-muted',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          ),
        })}
      >
        <input {...getInputProps()} aria-label={copy.overlays.dropPrompt} />
        <FileText aria-hidden="true" strokeWidth={1.5} className="h-8 w-8 text-muted" />
        <p className="text-base text-text">{isDragActive ? copy.overlays.dropActive : copy.overlays.dropPrompt}</p>
        <p className="text-sm text-muted">{copy.overlays.dropHint(maxSizeMb)}</p>
      </div>

      {files.length > 0 ? (
        <ul aria-label={copy.overlays.dropListLabel} className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface-1">
          {files.map((f) => (
            <li key={f.id} className="flex min-h-11 items-center gap-3 px-3 py-2">
              {f.state === 'rejected' ? (
                <AlertTriangle aria-hidden="true" strokeWidth={1.5} className="h-4 w-4 shrink-0 text-danger" />
              ) : (
                <FileText aria-hidden="true" strokeWidth={1.5} className="h-4 w-4 shrink-0 text-muted" />
              )}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-base">{f.name}</span>
                <span className="text-xs text-muted">
                  {formatSize(f.sizeBytes)}
                  {f.detail ? ` · ${f.detail}` : ''}
                </span>
              </span>
              <StateChip state={f.state} />
              {onRemove ? (
                <Button variant="icon" aria-label={`${copy.overlays.removeFile}: ${f.name}`} onClick={() => onRemove(f.id)}>
                  <X aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
