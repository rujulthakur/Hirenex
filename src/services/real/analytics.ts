import { z } from 'zod';
import { request, requestMapped } from '../apiClient';
import { AnalyticsViewSchema, HrSummarySchema, InterviewerSchema } from '@/types';
import type { Api } from '../contract';
import { toAnalytics, toInterviewer } from './adapters';

export const analytics: Api['analytics'] = {
  get: async (jobId) => {
    const ivs = await requestMapped(`/jobs/${jobId}/interviewers`, z.array(InterviewerSchema), (r) => (r as unknown[]).map(toInterviewer)).catch(() => []);
    const names: Record<string, string> = Object.fromEntries(ivs.map((i) => [i.id, i.name]));
    return requestMapped(`/jobs/${jobId}/analytics`, AnalyticsViewSchema, (r) => toAnalytics(r, names));
  },
  summary: (range, passMark) => requestMapped(`/analytics/summary?range=${range}&passMark=${passMark}`, HrSummarySchema, (r) => r),
};
void request;
