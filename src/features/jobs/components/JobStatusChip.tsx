import { Badge } from '@/components/ui';
import { copy } from '@/lib/copy';
import type { Job } from '@/types';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

const TONES: Record<Job['status'], Tone> = {
  draft: 'neutral',
  open: 'info',
  scored: 'primary',
  approved: 'success',
  scheduled: 'success',
  invited: 'success',
};

/** Status chip for a job. Always text plus colour, never colour alone. Usage: <JobStatusChip status={job.status} /> */
export function JobStatusChip({ status }: { status: Job['status'] }) {
  return <Badge tone={TONES[status]}>{copy.jobs.statusLabel[status]}</Badge>;
}
