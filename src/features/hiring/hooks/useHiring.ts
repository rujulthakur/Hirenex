import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '@/components/ui';
import { api, ApiError } from '@/services';
import type { HiringSettings } from '@/types';

export const HIRING_DEFAULTS: HiringSettings = { autoRejectEnabled: true, autoRejectDays: 3, holdDays: 7, emailCandidates: true };

/** GET /settings/hiring. Falls back to the defaults while loading so countdowns never flash empty. */
export function useHiringSettings(): HiringSettings {
  const q = useQuery({ queryKey: ['hiring', 'settings'], queryFn: () => api.hiring.settings(), staleTime: 60_000 });
  return q.data ?? HIRING_DEFAULTS;
}

export function useSaveHiringSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<HiringSettings>) => api.hiring.save(patch),
    onSuccess: () => {
      toastSuccess('Review timeline saved');
      void qc.invalidateQueries({ queryKey: ['hiring'] });
    },
    onError: (e) => toastError(e instanceof ApiError ? e.message : 'Could not save the review timeline'),
  });
}

export type DecisionAction = 'hold' | 'reject' | 'reopen';

export function useDecideCandidate(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; action: DecisionAction }) => api.candidates.decide(v.id, v.action),
    onSuccess: (_c, v) => {
      toastSuccess(v.action === 'hold' ? 'Put on hold. The candidate was emailed.' : v.action === 'reject' ? 'Rejected. The candidate was emailed.' : 'Moved back to review. The clock restarted.');
      void qc.invalidateQueries({ queryKey: ['candidates'] });
      void qc.invalidateQueries({ queryKey: ['notifications'] });
      void qc.invalidateQueries({ queryKey: ['jobs', jobId] });
    },
    onError: (e) => toastError(e instanceof ApiError ? e.message : 'Could not update the candidate'),
  });
}
