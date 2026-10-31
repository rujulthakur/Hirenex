import { request, requestMapped } from '../apiClient';
import { RunRefSchema, ScoreStatusSchema } from '@/types';
import type { Api } from '../contract';
import { toScoreStatus } from './adapters';

export const scoring: Api['scoring'] = {
  start: (jobId) => request(`/jobs/${jobId}/score`, RunRefSchema, { method: 'POST' }),
  status: (jobId) => requestMapped(`/jobs/${jobId}/score/status`, ScoreStatusSchema, toScoreStatus),
};
