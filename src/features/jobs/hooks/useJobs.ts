import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { JOB_LIST_LIMIT, JOB_LIST_PAGE } from '@/app/useActiveJob';
import { api } from '@/services';
import { qk } from '@/services/queryKeys';
import type { Job } from '@/types';
import { valuesToInterviewers, valuesToJobInput } from '../schemas';
import type { WizardValues } from '../schemas';

/** Jobs list (shares its cache entry with the job switcher). */
export function useJobsList() {
  return useQuery({
    queryKey: qk.jobs.list(JOB_LIST_PAGE, JOB_LIST_LIMIT),
    queryFn: () => api.jobs.list(JOB_LIST_PAGE, JOB_LIST_LIMIT),
  });
}

/** One job, for the edit wizard. Disabled when there is no id (create mode). */
export function useJob(jobId: string | undefined) {
  return useQuery({
    queryKey: qk.jobs.detail(jobId ?? ''),
    queryFn: () => api.jobs.get(jobId ?? ''),
    enabled: Boolean(jobId),
  });
}

export function useJobInterviewers(jobId: string | undefined) {
  return useQuery({
    queryKey: qk.jobs.interviewers(jobId ?? ''),
    queryFn: () => api.jobs.getInterviewers(jobId ?? ''),
    enabled: Boolean(jobId),
  });
}

export interface SaveJobVariables {
  jobId?: string;
  values: WizardValues;
}

/**
 * Saves the wizard: POST /jobs (create) or PATCH /jobs/:id (edit), then PUT /jobs/:id/interviewers.
 * Not optimistic on purpose: a job is a critical record, so the UI waits for the server.
 */
export function useSaveJob() {
  const client = useQueryClient();
  return useMutation<Job, Error, SaveJobVariables>({
    mutationFn: async ({ jobId, values }) => {
      const input = valuesToJobInput(values);
      const job = jobId ? await api.jobs.update(jobId, input) : await api.jobs.create(input);
      await api.jobs.putInterviewers(job.id, valuesToInterviewers(values));
      return job;
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: qk.jobs.all });
    },
  });
}
