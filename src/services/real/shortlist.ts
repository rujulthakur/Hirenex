import { requestMapped, requestVoid } from '../apiClient';
import { ShortlistResultSchema } from '@/types';
import type { Api } from '../contract';
import { toShortlist } from './adapters';

export const shortlist: Api['shortlist'] = {
  get: (jobId) => requestMapped(`/jobs/${jobId}/shortlist`, ShortlistResultSchema, toShortlist),
  rerank: (jobId, weights) => requestMapped(`/jobs/${jobId}/rerank`, ShortlistResultSchema, toShortlist, { method: 'POST', body: { weights } }),
  approve: (jobId, shortlistIds, waitlistIds) => requestVoid(`/jobs/${jobId}/approve`, { method: 'POST', body: { shortlistIds, waitlistIds } }),
};
