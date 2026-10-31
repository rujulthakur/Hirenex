import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services';
import { qk } from '@/services/queryKeys';
import type { Job } from '@/types';
import { jobIdFromPath } from './routeMeta';

const LAST_JOB_KEY = 'trusthire-last-job';

function readLast(): string | null {
  try {
    return sessionStorage.getItem(LAST_JOB_KEY);
  } catch {
    return null;
  }
}

function writeLast(id: string): void {
  try {
    sessionStorage.setItem(LAST_JOB_KEY, id);
  } catch {
    /* storage unavailable: remembering the last job is optional */
  }
}

export const JOB_LIST_PAGE = 1;
export const JOB_LIST_LIMIT = 50;

export interface ActiveJob {
  /** Job id from the URL, or the last opened job when the page is not job-scoped. */
  jobId: string | null;
  job: Job | undefined;
  jobs: Job[];
  isLoading: boolean;
  isError: boolean;
}

/** Resolves the job the sidebar, palette and top bar act on. Server data stays in TanStack Query. */
export function useActiveJob(): ActiveJob {
  const { pathname } = useLocation();
  const fromPath = jobIdFromPath(pathname);

  useEffect(() => {
    if (fromPath) writeLast(fromPath);
  }, [fromPath]);

  const list = useQuery({
    queryKey: qk.jobs.list(JOB_LIST_PAGE, JOB_LIST_LIMIT),
    queryFn: () => api.jobs.list(JOB_LIST_PAGE, JOB_LIST_LIMIT),
  });

  const jobs = list.data?.items ?? [];
  const remembered = readLast();
  const rememberedValid = remembered !== null && jobs.some((j) => j.id === remembered) ? remembered : null;
  const jobId = fromPath ?? rememberedValid ?? jobs[0]?.id ?? null;
  const job = jobs.find((j) => j.id === jobId);

  return { jobId, job, jobs, isLoading: list.isLoading, isError: list.isError };
}
