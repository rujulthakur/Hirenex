import type { Job, JobStatus } from '@/types';
import { copy } from '@/lib/copy';

export interface NextAction {
  title: string;
  body: string;
  cta: string;
  /** Path under /app/jobs/:jobId, or '' for the job edit page. */
  to: string;
}

type Block = { title: string; body: string; cta: string; to: string };

const pick = (b: Block): NextAction => ({ title: b.title, body: b.body, cta: b.cta, to: b.to === 'edit' ? '' : b.to });

/** One CTA that changes with the job status and the candidate count. Pure, so it is easy to test. */
export function nextBestAction(status: JobStatus, candidateCount: number): NextAction {
  const n = copy.dashboard.next;
  switch (status) {
    case 'draft':
      return pick(n.draft);
    case 'open':
      return pick(candidateCount > 0 ? n.openScored : n.open);
    case 'scored':
      return pick(n.scored);
    case 'approved':
      return pick(n.approved);
    case 'scheduled':
      return pick(n.scheduled);
    case 'invited':
      return pick(n.invited);
  }
}

export function actionPath(job: Pick<Job, 'id'>, a: NextAction): string {
  return a.to === '' ? `/app/jobs/${job.id}` : `/app/jobs/${job.id}/${a.to}`;
}

const SCORED_STATUSES: JobStatus[] = ['scored', 'approved', 'scheduled', 'invited'];
const SCHEDULED_STATUSES: JobStatus[] = ['approved', 'scheduled', 'invited'];

export const hasScores = (s: JobStatus): boolean => SCORED_STATUSES.includes(s);
export const canHaveSchedule = (s: JobStatus): boolean => SCHEDULED_STATUSES.includes(s);

/** Number of onboarding steps done for a status (0 to 4). */
export function onboardingDone(status: JobStatus, candidateCount: number): number {
  if (status === 'draft') return 1;
  if (status === 'open') return candidateCount > 0 ? 2 : 1;
  if (status === 'scored') return 2;
  if (status === 'approved') return 3;
  return 4;
}
