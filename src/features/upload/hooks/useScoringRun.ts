import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/services';
import { qk } from '@/services/queryKeys';
import { usePolling } from '@/services/usePolling';
import type { ScoreStatus } from '@/types';

export type ScoringPhase = 'idle' | 'starting' | 'running' | 'done' | 'failed';

export type ScoringProblem = 'ai_unavailable' | 'start_failed' | 'status_failed' | 'run_failed' | null;

export interface ScoringRun {
  phase: ScoringPhase;
  status: ScoreStatus | undefined;
  /** What went wrong, if anything. "ai_unavailable" means cached scores will be used and the run can be retried. */
  problem: ScoringProblem;
  start: () => void;
}

function isFinished(status: ScoreStatus): boolean {
  return status.state === 'done' || status.state === 'failed';
}

function isAiUnavailable(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'AI_UNAVAILABLE';
}

/**
 * Starts a scoring run (POST /jobs/:id/score, 202) and then polls GET /jobs/:id/score/status every 3 seconds until
 * the run is done or failed. Polling pauses on hidden tabs (see usePolling). Server data stays in TanStack Query.
 */
export function useScoringRun(jobId: string): ScoringRun {
  const queryClient = useQueryClient();
  const [started, setStarted] = useState(false);
  const [startProblem, setStartProblem] = useState<ScoringProblem>(null);

  const startMutation = useMutation({
    mutationFn: () => api.scoring.start(jobId),
    onMutate: () => {
      setStartProblem(null);
      // Drop the previous run's status so an old "done" cannot stop polling for the new run.
      queryClient.removeQueries({ queryKey: qk.scoring.status(jobId) });
    },
    onSuccess: () => {
      setStarted(true);
      void queryClient.invalidateQueries({ queryKey: qk.jobs.all });
    },
    onError: (error) => {
      setStartProblem(isAiUnavailable(error) ? 'ai_unavailable' : 'start_failed');
    },
  });

  const statusQuery = usePolling<ScoreStatus>({
    queryKey: qk.scoring.status(jobId),
    queryFn: () => api.scoring.status(jobId),
    enabled: started,
    stopWhen: isFinished,
  });

  const status = statusQuery.data;
  // Only trust the status of a run started in this session; a cached "done" from an earlier run must not leak in.
  const finished = started && status !== undefined && isFinished(status);

  // Refresh the lists that depend on scores once the run ends. A re-run clears the status first, so this fires again.
  useEffect(() => {
    if (!finished) return;
    void queryClient.invalidateQueries({ queryKey: qk.candidates.all(jobId) });
    void queryClient.invalidateQueries({ queryKey: qk.jobs.all });
  }, [finished, jobId, queryClient]);

  const { mutate } = startMutation;
  const start = useCallback((): void => {
    mutate();
  }, [mutate]);

  let phase: ScoringPhase = 'idle';
  if (startMutation.isPending) phase = 'starting';
  else if (started && status !== undefined && status.state === 'done') phase = 'done';
  else if (started && status !== undefined && status.state === 'failed') phase = 'failed';
  else if (started && startProblem === null) phase = 'running';

  let problem: ScoringProblem = startProblem;
  if (problem === null && statusQuery.isError) problem = isAiUnavailable(statusQuery.error) ? 'ai_unavailable' : 'status_failed';
  if (problem === null && phase === 'failed') problem = 'run_failed';

  return { phase, status: started ? status : undefined, problem, start };
}
