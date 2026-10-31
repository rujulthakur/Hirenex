import { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '@/components/ui';
import { copy } from '@/lib/copy';
import { api } from '@/services';
import { qk } from '@/services/queryKeys';
import { ApiError } from '@/services/apiClient';

/** Delay before a slider change is sent to POST /jobs/:id/rerank. */
export const RERANK_DEBOUNCE_MS = 250;

/** GET /jobs/:id/shortlist. */
export function useShortlist(jobId: string) {
  return useQuery({ queryKey: qk.shortlist.get(jobId), queryFn: () => api.shortlist.get(jobId), enabled: jobId !== '' });
}

/** Returns the value after it has stopped changing for `ms`. */
export function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** POST /jobs/:id/rerank (preview only, never saved). Only runs while `weights` is not null. */
export function useRerankPreview(jobId: string, weights: Record<string, number> | null) {
  const key = weights ? JSON.stringify(weights) : '';
  return useQuery({
    queryKey: qk.shortlist.rerank(jobId, key),
    queryFn: () => api.shortlist.rerank(jobId, weights ?? {}),
    enabled: jobId !== '' && weights !== null,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

/** POST /jobs/:id/approve. CONFLICT is returned to the caller so the page can explain why. */
export function useApprove(jobId: string, onConflict: (why: string) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { shortlistIds: string[]; waitlistIds: string[] }) => api.shortlist.approve(jobId, v.shortlistIds, v.waitlistIds),
    onSuccess: () => {
      toastSuccess(copy.shortlist.approveSuccess);
      void queryClient.invalidateQueries({ queryKey: qk.shortlist.get(jobId) });
      void queryClient.invalidateQueries({ queryKey: qk.candidates.all(jobId) });
      void queryClient.invalidateQueries({ queryKey: qk.jobs.all });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.code === 'CONFLICT') onConflict(err.message);
      else toastError(copy.shortlist.approveFailed);
    },
  });
}
