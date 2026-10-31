import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '@/components/ui';
import { api, ApiError } from '@/services';
import { qk } from '@/services/queryKeys';
import type { MeetingSettings } from '@/types';

export function useMeetingSettings() {
  return useQuery({ queryKey: qk.meetings.settings, queryFn: () => api.meetings.settings() });
}

export function useMeetingCapacity(enabled = true) {
  return useQuery({ queryKey: qk.meetings.capacity, queryFn: () => api.meetings.capacity(), enabled });
}

export function useJobMeetings(jobId: string) {
  return useQuery({ queryKey: qk.meetings.list(jobId), queryFn: () => api.meetings.list(jobId), enabled: jobId !== '' });
}

export function useSaveMeetingSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<MeetingSettings>) => api.meetings.saveSettings(patch),
    onSuccess: () => {
      toastSuccess('Interview settings saved');
      void qc.invalidateQueries({ queryKey: ['meetings'] });
    },
    onError: (e) => toastError(e instanceof ApiError ? e.message : 'Could not save the settings'),
  });
}

export function useSendMeetings(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (candidateIds: string[]) => api.meetings.send(jobId, candidateIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['meetings'] });
      void qc.invalidateQueries({ queryKey: qk.candidates.all(jobId) });
      void qc.invalidateQueries({ queryKey: qk.notifications.list });
    },
    onError: (e) => toastError(e instanceof ApiError ? e.message : 'Could not send the invites'),
  });
}

export function useCancelMeeting(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.meetings.cancel(id),
    onSuccess: () => {
      toastSuccess('Interview cancelled');
      void qc.invalidateQueries({ queryKey: ['meetings'] });
      void qc.invalidateQueries({ queryKey: qk.candidates.all(jobId) });
    },
    onError: () => toastError('Could not cancel the interview'),
  });
}
