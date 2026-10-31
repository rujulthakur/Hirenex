import type { CandidateListQuery } from './contract';

/** Central TanStack Query key factory. Every query in the app must use these keys so invalidation stays predictable. */
export const qk = {
  auth: { me: ['auth', 'me'] as const },
  profile: { get: ['profile'] as const },
  health: ['health'] as const,
  jobs: {
    all: ['jobs'] as const,
    list: (page: number, limit: number) => ['jobs', 'list', page, limit] as const,
    detail: (jobId: string) => ['jobs', 'detail', jobId] as const,
    interviewers: (jobId: string) => ['jobs', jobId, 'interviewers'] as const,
  },
  candidates: {
    all: (jobId: string) => ['candidates', jobId] as const,
    list: (jobId: string, q: CandidateListQuery) => ['candidates', jobId, 'list', q] as const,
    detail: (candidateId: string) => ['candidates', 'detail', candidateId] as const,
    scores: (candidateId: string) => ['candidates', 'scores', candidateId] as const,
  },
  scoring: {
    status: (jobId: string) => ['scoring', jobId, 'status'] as const,
  },
  shortlist: {
    get: (jobId: string) => ['shortlist', jobId] as const,
    rerank: (jobId: string, weightsKey: string) => ['shortlist', jobId, 'rerank', weightsKey] as const,
  },
  schedule: {
    get: (jobId: string) => ['schedule', jobId] as const,
    shortfall: (jobId: string) => ['schedule', jobId, 'shortfall'] as const,
    repairs: (jobId: string) => ['schedule', jobId, 'repairs'] as const,
  },
  invites: {
    preview: (jobId: string) => ['invites', jobId, 'preview'] as const,
    list: (jobId: string) => ['invites', jobId, 'list'] as const,
  },
  portal: {
    view: (token: string) => ['portal', token] as const,
    status: (token: string) => ['portal', token, 'status'] as const,
  },
  analytics: {
    get: (jobId: string) => ['analytics', jobId] as const,
    summary: (range: string, passMark: number) => ['analytics', 'summary', range, passMark] as const,
  },
  meetings: {
    settings: ['meetings', 'settings'] as const,
    capacity: ['meetings', 'capacity'] as const,
    list: (jobId: string) => ['meetings', jobId, 'list'] as const,
  },
  notifications: {
    list: ['notifications'] as const,
  },
  demo: {
    qr: ['demo', 'qr'] as const,
  },
} as const;
