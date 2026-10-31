import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/services';
import { qk } from '@/services/queryKeys';
import { copy } from '@/lib/copy';
import type { DropzoneRejection } from '@/components/ui';
import {
  UPLOAD_BATCH_SIZE,
  applyResults,
  chunk,
  countedRows,
  duplicateRow,
  rejectedRow,
  rowFromFile,
  setRowsState,
  summarize,
} from '../uploadModel';
import type { UploadRow, UploadSummary } from '../uploadModel';

export interface UploadQueue {
  rows: UploadRow[];
  summary: UploadSummary;
  /** True while at least one batch is in flight or waiting to be sent. */
  busy: boolean;
  /** One-line notice, for example when extra files were skipped. Null when there is nothing to say. */
  notice: string | null;
  addFiles: (files: File[]) => void;
  addRejections: (rejections: DropzoneRejection[]) => void;
  retryFailed: () => void;
  removeRow: (id: string) => void;
  clearList: () => void;
}

/**
 * Owns the per-file upload list for one job. Files go to POST /jobs/:id/resumes in batches of 10 (one batch at a
 * time) so each batch result updates its rows as soon as it arrives. Server data (candidates, jobs) is invalidated
 * afterwards; the list itself is local UI state.
 */
export function useUploadQueue(jobId: string): UploadQueue {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [pendingBatches, setPendingBatches] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  // The ref is the synchronous source of truth so two quick drops never read a stale list.
  const rowsRef = useRef<UploadRow[]>([]);
  const chain = useRef<Promise<void>>(Promise.resolve());

  const commit = useCallback((next: UploadRow[]): void => {
    rowsRef.current = next;
    setRows(next);
  }, []);

  const sendBatch = useCallback(
    async (batch: UploadRow[]): Promise<void> => {
      const ids = new Set(batch.map((r) => r.id));
      commit(setRowsState(rowsRef.current, ids, 'uploading'));
      const files = batch.map((r) => r.file).filter((f): f is File => f !== undefined);
      try {
        const results = await api.resumes.upload(jobId, files);
        commit(applyResults(rowsRef.current, ids, results));
      } catch {
        commit(setRowsState(rowsRef.current, ids, 'failed'));
      }
    },
    [commit, jobId],
  );

  const enqueue = useCallback(
    (target: UploadRow[]): void => {
      const batches = chunk(target, UPLOAD_BATCH_SIZE);
      for (const batch of batches) {
        setPendingBatches((n) => n + 1);
        chain.current = chain.current
          .then(() => sendBatch(batch))
          .finally(() => {
            setPendingBatches((n) => n - 1);
            void queryClient.invalidateQueries({ queryKey: qk.candidates.all(jobId) });
            void queryClient.invalidateQueries({ queryKey: qk.jobs.all });
          });
      }
    },
    [jobId, queryClient, sendBatch],
  );

  const addFiles = useCallback(
    (files: File[]): void => {
      const max = copy.upload.maxFiles;
      const known = new Set(rowsRef.current.filter((r) => r.state !== 'rejected' && r.state !== 'failed').map((r) => r.name));
      let room = max - countedRows(rowsRef.current);
      let skipped = false;
      const added: UploadRow[] = [];
      const refused: UploadRow[] = [];
      for (const file of files) {
        if (known.has(file.name)) {
          refused.push(duplicateRow(file));
          continue;
        }
        if (room <= 0) {
          skipped = true;
          continue;
        }
        known.add(file.name);
        room -= 1;
        added.push(rowFromFile(file));
      }
      setNotice(skipped ? copy.upload.tooManyFiles(max) : null);
      if (added.length === 0 && refused.length === 0) return;
      commit([...rowsRef.current, ...added, ...refused]);
      if (added.length > 0) enqueue(added);
    },
    [commit, enqueue],
  );

  const addRejections = useCallback(
    (rejections: DropzoneRejection[]): void => {
      if (rejections.length === 0) return;
      commit([...rowsRef.current, ...rejections.map((r) => rejectedRow(r.name, r.reason))]);
    },
    [commit],
  );

  const retryFailed = useCallback((): void => {
    const failed = rowsRef.current.filter((r) => r.state === 'failed' && r.file !== undefined);
    if (failed.length === 0) return;
    setNotice(null);
    commit(setRowsState(rowsRef.current, new Set(failed.map((r) => r.id)), 'queued'));
    enqueue(failed);
  }, [commit, enqueue]);

  const removeRow = useCallback(
    (id: string): void => {
      commit(rowsRef.current.filter((r) => r.id !== id || r.state === 'uploading'));
    },
    [commit],
  );

  const clearList = useCallback((): void => {
    commit(rowsRef.current.filter((r) => r.state === 'uploading' || r.state === 'queued'));
    setNotice(null);
  }, [commit]);

  return {
    rows,
    summary: summarize(rows),
    busy: pendingBatches > 0,
    notice,
    addFiles,
    addRejections,
    retryFailed,
    removeRow,
    clearList,
  };
}
