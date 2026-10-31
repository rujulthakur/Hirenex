import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '@/components/ui';
import { copy } from '@/lib/copy';
import { api } from '@/services';
import { ApiError } from '@/services/apiClient';
import { qk } from '@/services/queryKeys';
import { usePolling } from '@/services/usePolling';

/** GET /jobs/:id/invites/preview. Returns APPROVAL_REQUIRED until the shortlist is approved, so retries are off. */
export function useInvitePreview(jobId: string) {
  return useQuery({ queryKey: qk.invites.preview(jobId), queryFn: () => api.invites.preview(jobId), enabled: jobId !== '', retry: false });
}

/** GET /jobs/:id/invites, polled every 3 s (tab visible only) so delivery and responses update live. */
export function useInviteList(jobId: string, enabled: boolean) {
  return usePolling({ queryKey: qk.invites.list(jobId), queryFn: () => api.invites.list(jobId), enabled: enabled && jobId !== '' });
}

/** Maps an error from the invites endpoints to the specific message for the page. */
export function inviteErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.code === 'APPROVAL_REQUIRED') return copy.invites.approvalRequired;
    if (err.code === 'SLOT_TAKEN') return copy.invites.slotTaken;
  }
  return fallback;
}

/** PATCH /invites/:id (HR edits subject or body before sending). */
export function useUpdateInvite(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; subject: string; body: string }) => api.invites.update(v.id, { subject: v.subject, body: v.body }),
    onSuccess: () => {
      toastSuccess(copy.invites.saved);
      void queryClient.invalidateQueries({ queryKey: qk.invites.preview(jobId) });
      void queryClient.invalidateQueries({ queryKey: qk.invites.list(jobId) });
    },
    onError: (err: unknown) => toastError(inviteErrorMessage(err, copy.invites.saveFailed)),
  });
}

/** POST /jobs/:id/invites/send (test inbox only). Also used to retry failed emails. */
export function useSendInvites(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.invites.send(jobId),
    onSuccess: () => {
      toastSuccess(copy.invites.sendSuccess);
      void queryClient.invalidateQueries({ queryKey: qk.invites.list(jobId) });
      void queryClient.invalidateQueries({ queryKey: qk.invites.preview(jobId) });
      void queryClient.invalidateQueries({ queryKey: qk.candidates.all(jobId) });
      void queryClient.invalidateQueries({ queryKey: qk.jobs.all });
    },
    onError: (err: unknown) => toastError(inviteErrorMessage(err, copy.invites.sendFailed)),
  });
}
