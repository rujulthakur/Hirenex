import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '@/components/ui';
import { copy } from '@/lib/copy';
import { api } from '@/services';
import { qk } from '@/services/queryKeys';
import { usePolling } from '@/services/usePolling';

/** GET /jobs/:id/schedule. Polled every 3 s only while a run is queued or running. */
export function useSchedule(jobId: string) {
  return usePolling({
    queryKey: qk.schedule.get(jobId),
    queryFn: () => api.schedule.get(jobId),
    enabled: jobId !== '',
    stopWhen: (d) => d.state === undefined || d.state === 'done' || d.state === 'failed',
  });
}

/** GET /jobs/:id/shortfall. */
export function useShortfall(jobId: string) {
  return useQuery({ queryKey: qk.schedule.shortfall(jobId), queryFn: () => api.schedule.shortfall(jobId), enabled: jobId !== '' });
}

/** GET /jobs/:id/repairs, polled every 3 s so a decline from a phone shows up without a reload. */
export function useRepairs(jobId: string) {
  return usePolling({ queryKey: qk.schedule.repairs(jobId), queryFn: () => api.schedule.repairs(jobId), enabled: jobId !== '' });
}

function refreshAll(queryClient: ReturnType<typeof useQueryClient>, jobId: string): void {
  void queryClient.invalidateQueries({ queryKey: qk.schedule.get(jobId) });
  void queryClient.invalidateQueries({ queryKey: qk.schedule.shortfall(jobId) });
  void queryClient.invalidateQueries({ queryKey: qk.schedule.repairs(jobId) });
  void queryClient.invalidateQueries({ queryKey: qk.candidates.all(jobId) });
  void queryClient.invalidateQueries({ queryKey: qk.jobs.all });
}

/** POST /jobs/:id/schedule (202 + runId). The page then polls the schedule. */
export function useRunScheduler(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.schedule.run(jobId),
    onSuccess: () => {
      toastSuccess(copy.scheduler.runDone);
      refreshAll(queryClient, jobId);
    },
    onError: () => toastError(copy.scheduler.runFailed),
  });
}

/** POST /jobs/:id/interviewers/:iid/unavailable. Triggers a repair on the backend. */
export function useMarkUnavailable(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { interviewerId: string; from: string; to: string }) => api.schedule.markUnavailable(jobId, v.interviewerId, { from: v.from, to: v.to }),
    onSuccess: () => {
      toastSuccess(copy.scheduler.unavailDone);
      refreshAll(queryClient, jobId);
    },
    onError: () => toastError(copy.scheduler.unavailFailed),
  });
}
