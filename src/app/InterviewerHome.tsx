import { Navigate } from 'react-router-dom';
import { copy } from '@/lib/copy';
import { EmptyState, Skeleton } from '@/components/ui';
import { CalendarClock } from 'lucide-react';
import { useActiveJob } from './useActiveJob';

/** Landing for interviewers: sends them straight to the schedule of their job. */
export default function InterviewerHome() {
  const { jobId, isLoading } = useActiveJob();
  if (isLoading) {
    return (
      <div className="p-6" role="status" aria-busy="true" aria-label={copy.shell.pageLoading}>
        <Skeleton variant="card" />
      </div>
    );
  }
  if (jobId) return <Navigate to={`/app/jobs/${jobId}/schedule`} replace />;
  return (
    <div className="p-6">
      <EmptyState icon={CalendarClock} title={copy.shell.interviewerHome} description={copy.shell.interviewerNoJob} />
    </div>
  );
}
