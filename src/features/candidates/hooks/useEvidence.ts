import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toastAudit, toastError } from '@/components/ui';
import { copy } from '@/lib/copy';
import { api } from '@/services';
import { qk } from '@/services/queryKeys';
import type { ScoreOverrideInput } from '@/types';

/** PATCH /candidates/:id/scores/:criterionId. The backend audits it; the toast shows the audit sequence number. */
export function useScoreOverride(candidateId: string, jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { criterionId: string; input: ScoreOverrideInput }) => api.candidates.overrideScore(candidateId, v.criterionId, v.input),
    onSuccess: (res) => {
      toastAudit(res.auditSeq);
      void queryClient.invalidateQueries({ queryKey: qk.candidates.scores(candidateId) });
      void queryClient.invalidateQueries({ queryKey: qk.candidates.detail(candidateId) });
      void queryClient.invalidateQueries({ queryKey: qk.candidates.all(jobId) });
      void queryClient.invalidateQueries({ queryKey: qk.shortlist.get(jobId) });
    },
    onError: () => toastError(copy.evidence.overrideFailed),
  });
}
