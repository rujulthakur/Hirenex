import type { FlagKind, UploadResult } from '@/types';

/** Files are sent to POST /jobs/:id/resumes in batches of this size so progress stays visible. */
export const UPLOAD_BATCH_SIZE = 10;

export type UploadReason = NonNullable<UploadResult['reason']>;

export type RowState = 'queued' | 'uploading' | 'accepted' | 'flagged' | 'rejected' | 'failed';

export interface UploadRow {
  id: string;
  name: string;
  sizeBytes: number;
  state: RowState;
  flags: FlagKind[];
  /** Server rejection reason (wrong type, too large, unreadable scan, duplicate). */
  reason?: UploadReason;
  /** Client-side rejection text (from the dropzone) when no server reason exists. */
  note?: string;
  candidateId?: string;
  /** Kept so a failed batch can be retried without asking the user to pick the files again. */
  file?: File;
}

export interface UploadSummary {
  total: number;
  accepted: number;
  flagged: number;
  rejected: number;
  failed: number;
  pending: number;
}

let rowCounter = 0;

function nextRowId(): string {
  rowCounter += 1;
  return `upl_${Date.now().toString(36)}_${rowCounter}`;
}

export function rowFromFile(file: File): UploadRow {
  return { id: nextRowId(), name: file.name, sizeBytes: file.size, state: 'queued', flags: [], file };
}

/** A row for a file the dropzone refused before upload (wrong type, too large, too many). */
export function rejectedRow(name: string, note: string): UploadRow {
  return { id: nextRowId(), name, sizeBytes: 0, state: 'rejected', flags: [], note };
}

/** A row for a file that is already in the list; the server would also reject it as a duplicate. */
export function duplicateRow(file: File): UploadRow {
  return { id: nextRowId(), name: file.name, sizeBytes: file.size, state: 'rejected', flags: [], reason: 'duplicate' };
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Rows that still count toward the file limit: everything except rows that were refused. */
export function countedRows(rows: readonly UploadRow[]): number {
  return rows.filter((r) => r.state !== 'rejected').length;
}

export function hasShieldFlag(flags: readonly FlagKind[]): boolean {
  return flags.includes('hidden_text_found') || flags.includes('injection_phrase_found');
}

export function hasHiddenText(row: UploadRow): boolean {
  return row.flags.includes('hidden_text_found');
}

/** Sets the given rows to a new state without touching the others. */
export function setRowsState(rows: readonly UploadRow[], ids: ReadonlySet<string>, state: RowState): UploadRow[] {
  return rows.map((r) => (ids.has(r.id) ? { ...r, state } : r));
}

/**
 * Applies the per-file results of one batch. Results are matched by file name; if two files in a batch share a
 * name, each result is used once, in order.
 */
export function applyResults(rows: readonly UploadRow[], batchIds: ReadonlySet<string>, results: readonly UploadResult[]): UploadRow[] {
  const remaining = [...results];
  return rows.map((row) => {
    if (!batchIds.has(row.id)) return row;
    const at = remaining.findIndex((r) => r.fileName === row.name);
    if (at === -1) return { ...row, state: 'failed' };
    const [result] = remaining.splice(at, 1);
    if (!result) return { ...row, state: 'failed' };
    return {
      ...row,
      state: result.status,
      flags: result.flags,
      reason: result.reason,
      candidateId: result.candidateId,
      file: result.status === 'rejected' ? undefined : row.file,
    };
  });
}

export function summarize(rows: readonly UploadRow[]): UploadSummary {
  const s: UploadSummary = { total: rows.length, accepted: 0, flagged: 0, rejected: 0, failed: 0, pending: 0 };
  for (const r of rows) {
    if (r.state === 'accepted') s.accepted += 1;
    else if (r.state === 'flagged') s.flagged += 1;
    else if (r.state === 'rejected') s.rejected += 1;
    else if (r.state === 'failed') s.failed += 1;
    else s.pending += 1;
  }
  return s;
}

/** Candidates that exist on the server and can be scored: accepted plus flagged (flagged are scored on visible text). */
export function scorableCount(summary: UploadSummary): number {
  return summary.accepted + summary.flagged;
}
