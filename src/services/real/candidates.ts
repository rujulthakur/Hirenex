import { z } from 'zod';
import { request, requestListMapped, requestMapped, requestVoid } from '../apiClient';
import { CandidateSchema, CriterionScoreSchema, OverrideResultSchema, SwapTestSchema } from '@/types';
import type { Api } from '../contract';
import { scoreToBackend, toCandidate, toScores, toSwap } from './adapters';

const getScores = (id: string) => requestMapped(`/candidates/${id}/scores`, z.array(CriterionScoreSchema), toScores);

export const candidates: Api['candidates'] = {
  list: (jobId, q) => requestListMapped(`/jobs/${jobId}/candidates`, CandidateSchema, toCandidate, { query: { ...q } }),
  get: (id) => requestMapped(`/candidates/${id}`, CandidateSchema, toCandidate),
  scores: getScores,
  overrideScore: async (id, criterionId, input) => {
    const res = await requestMapped(`/candidates/${id}/scores/${criterionId}`, z.object({ total: z.number(), auditSeq: z.number() }), (r) => r, {
      method: 'PATCH', body: { score: scoreToBackend(input.score), reason: input.reason },
    });
    const score = (await getScores(id)).find((s) => s.criterionId === criterionId);
    return OverrideResultSchema.parse({ score, totalScore: res.total, auditSeq: res.auditSeq });
  },
  update: async (id, patch) => {
    await requestVoid(`/candidates/${id}`, { method: 'PATCH', body: patch });
    return requestMapped(`/candidates/${id}`, CandidateSchema, toCandidate);
  },
  decide: async (id, action) => {
    await requestVoid(`/candidates/${id}/decision`, { method: 'POST', body: { action } });
    return requestMapped(`/candidates/${id}`, CandidateSchema, toCandidate);
  },
  remove: (id) => requestVoid(`/candidates/${id}`, { method: 'DELETE' }),
  copyToJob: (targetJobId, fromJobId, candidateIds) =>
    request(`/jobs/${targetJobId}/copy-candidates`, z.object({ added: z.number(), skipped: z.number() }), {
      method: 'POST', body: { fromJobId, candidateIds },
    }),
  swapTest: (id) => requestMapped(`/candidates/${id}/swap-test`, SwapTestSchema, toSwap, { method: 'POST' }),
};
