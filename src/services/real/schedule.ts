import { z } from 'zod';
import { request, requestMapped, requestVoid } from '../apiClient';
import { RepairDiffSchema, RunRefSchema, ScheduleViewSchema, ShortfallReportSchema } from '@/types';
import type { Api } from '../contract';
import { toRepairs, toSchedule, toShortfall } from './adapters';

export const schedule: Api['schedule'] = {
  run: (jobId) => request(`/jobs/${jobId}/schedule`, RunRefSchema, { method: 'POST' }),
  get: (jobId) => requestMapped(`/jobs/${jobId}/schedule`, ScheduleViewSchema, toSchedule),
  shortfall: (jobId) => requestMapped(`/jobs/${jobId}/shortfall`, ShortfallReportSchema, toShortfall),
  markUnavailable: (jobId, interviewerId, range) => requestVoid(`/jobs/${jobId}/interviewers/${interviewerId}/unavailable`, { method: 'POST', body: range }),
  repairs: (jobId) => requestMapped(`/jobs/${jobId}/repairs`, z.array(RepairDiffSchema), toRepairs),
};
