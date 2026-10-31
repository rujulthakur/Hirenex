import { z } from 'zod';
import { request, requestListMapped, requestMapped } from '../apiClient';
import { InterviewerSchema, JobSchema } from '@/types';
import type { Api } from '../contract';
import { fromInterviewer, fromJobInput, toInterviewer, toJob } from './adapters';

export const jobs: Api['jobs'] = {
  list: (page = 1, limit = 20) => requestListMapped('/jobs', JobSchema, toJob, { query: { page, limit } }),
  create: (input) => requestMapped('/jobs', JobSchema, toJob, { method: 'POST', body: fromJobInput(input) }),
  get: (id) => requestMapped(`/jobs/${id}`, JobSchema, toJob),
  update: (id, input) => requestMapped(`/jobs/${id}`, JobSchema, toJob, { method: 'PATCH', body: fromJobInput(input) }),
  getInterviewers: (id) => requestMapped(`/jobs/${id}/interviewers`, z.array(InterviewerSchema), (r) => (r as unknown[]).map(toInterviewer)),
  importDocument: (file, timeZone) => {
    const form = new FormData();
    form.append('file', file);
    if (timeZone) form.append('timeZone', timeZone);
    return requestMapped(
      '/jobs/import',
      z.object({ job: JobSchema, summary: z.object({ requiredSkills: z.number(), preferredSkills: z.number(), criteria: z.number(), openingsFound: z.boolean() }) }),
      (r: { job: unknown; summary: unknown }) => ({ job: toJob(r.job as Record<string, unknown>), summary: r.summary }),
      { method: 'POST', form },
    );
  },
  putInterviewers: (id, list) =>
    requestMapped(`/jobs/${id}/interviewers`, z.array(InterviewerSchema), (r) => (r as unknown[]).map(toInterviewer), {
      method: 'PUT', body: { interviewers: list.map(fromInterviewer) },
    }),
};
void request;
