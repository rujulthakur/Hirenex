import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services';
import { ApiError } from '@/services/apiClient';
import { qk } from '@/services/queryKeys';

/** True when an error means the candidate link is expired or invalid (TOKEN_EXPIRED). */
export function isExpired(err: unknown): boolean {
  return err instanceof ApiError && err.code === 'TOKEN_EXPIRED';
}

/** GET /portal/:token. Never retried on an expired link. */
export function usePortalView(token: string) {
  return useQuery({
    queryKey: qk.portal.view(token),
    queryFn: () => api.portal.get(token),
    enabled: token !== '',
    retry: (count, err) => !isExpired(err) && count < 1,
  });
}

/** GET /portal/:token/status. */
export function usePortalStatus(token: string) {
  return useQuery({
    queryKey: qk.portal.status(token),
    queryFn: () => api.portal.status(token),
    enabled: token !== '',
    retry: (count, err) => !isExpired(err) && count < 1,
  });
}

export type PortalAnswer = 'accepted' | 'declined' | 'reschedule_requested';

/** POST accept, decline or reschedule. Refreshes the view so the answered state comes from the server. */
export function usePortalAnswer(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (v: { kind: 'accept' } | { kind: 'decline'; reason?: string } | { kind: 'reschedule'; note: string }): Promise<PortalAnswer> => {
      if (v.kind === 'accept') {
        await api.portal.accept(token);
        return 'accepted';
      }
      if (v.kind === 'decline') {
        await api.portal.decline(token, v.reason);
        return 'declined';
      }
      await api.portal.reschedule(token, v.note);
      return 'reschedule_requested';
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.portal.view(token) });
      void queryClient.invalidateQueries({ queryKey: qk.portal.status(token) });
    },
  });
}
