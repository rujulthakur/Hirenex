import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '@/components/ui';
import { copy } from '@/lib/copy';
import { api } from '@/services';
import type { CandidateListQuery } from '@/services';
import { qk } from '@/services/queryKeys';
import { CANDIDATE_PAGE_SIZE, KANBAN_LIMIT } from '../candidatesModel';
import type { CandidateParams } from '../candidatesModel';

/** Builds the API query for the table view: every filter, the sort and the page come from the URL. */
export function tableQuery(p: CandidateParams): CandidateListQuery {
  return { stage: p.stage, flag: p.flag, q: p.q.trim() || undefined, sort: p.sort, page: p.page, limit: CANDIDATE_PAGE_SIZE };
}

/** The kanban shows all stages at once, so it ignores stage, sort and page and asks for a large first page. */
export function kanbanQuery(p: CandidateParams): CandidateListQuery {
  return { flag: p.flag, q: p.q.trim() || undefined, sort: 'rank', page: 1, limit: KANBAN_LIMIT };
}

/** GET /jobs/:id/candidates. The previous page stays visible while the next one loads. */
export function useCandidateList(jobId: string, query: CandidateListQuery) {
  return useQuery({
    queryKey: qk.candidates.list(jobId, query),
    queryFn: () => api.candidates.list(jobId, query),
    placeholderData: keepPreviousData,
    enabled: jobId !== '',
  });
}

/** GET /candidates/:id (redacted text, parsed fields, flags, hidden-text findings). */
export function useCandidate(candidateId: string) {
  return useQuery({
    queryKey: qk.candidates.detail(candidateId),
    queryFn: () => api.candidates.get(candidateId),
    enabled: candidateId !== '',
  });
}

/** GET /candidates/:id/scores (per criterion score, quote, verified, authority). */
export function useCandidateScores(candidateId: string) {
  return useQuery({
    queryKey: qk.candidates.scores(candidateId),
    queryFn: () => api.candidates.scores(candidateId),
    enabled: candidateId !== '',
  });
}

/** PATCH /candidates/:id with notes. The save is audited by the backend. */
export function useSaveNotes(candidateId: string, jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notes: string) => api.candidates.update(candidateId, { notes }),
    onSuccess: () => {
      toastSuccess(copy.candidates.detail.notesSaved);
      void queryClient.invalidateQueries({ queryKey: qk.candidates.detail(candidateId) });
      void queryClient.invalidateQueries({ queryKey: qk.candidates.all(jobId) });
    },
    onError: () => toastError(copy.candidates.detail.notesFailed),
  });
}

/** DELETE /candidates/:id (audited). Not optimistic: it is a destructive action. */
export function useDeleteCandidate(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (candidateId: string) => api.candidates.remove(candidateId),
    onSuccess: () => {
      toastSuccess(copy.candidates.detail.deleted);
      void queryClient.invalidateQueries({ queryKey: qk.candidates.all(jobId) });
      void queryClient.invalidateQueries({ queryKey: qk.jobs.all });
    },
    onError: () => toastError(copy.candidates.detail.deleteFailed),
  });
}

/** POST /candidates/:id/swap-test. A read-only audit check; it never changes the stored score. */
export function useSwapTest(candidateId: string) {
  return useMutation({
    mutationFn: () => api.candidates.swapTest(candidateId),
    onError: () => toastError(copy.candidates.detail.swapFailed),
  });
}
