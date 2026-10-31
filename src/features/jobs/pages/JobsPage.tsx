import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, FileUp, Plus } from 'lucide-react';
import { Button, Card, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { copy } from '@/lib/copy';
import { fromNow } from '@/lib/time';
import { ImportJobDialog } from '../components/ImportJobDialog';
import { JobStatusChip } from '../components/JobStatusChip';
import { useJobsList } from '../hooks/useJobs';

const linkBase =
  'inline-flex min-h-11 items-center rounded-md px-3 text-base transition-colors duration-fast ease-standard focus-visible:shadow-focus';
const primaryLink = `${linkBase} bg-primary text-primary-fg hover:brightness-110`;
const quietLink = `${linkBase} border border-border text-text hover:bg-surface-2`;

/** /app/jobs: job cards with status chips, loading, empty and error states. */
export default function JobsPage() {
  const { data, isLoading, isError, error, refetch } = useJobsList();
  const jobs = data?.items ?? [];
  const [importOpen, setImportOpen] = useState(false);

  return (
    <section className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{copy.jobs.listTitle}</h1>
          <p className="mt-1 text-base text-muted">{copy.jobs.listSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <FileUp aria-hidden="true" strokeWidth={1.5} className="mr-2 h-4 w-4" />
            {copy.jobs.import.button}
          </Button>
          <Link to="/app/jobs/new" className={primaryLink}>
            <Plus aria-hidden="true" strokeWidth={1.5} className="mr-2 h-4 w-4" />
            {copy.jobs.newJob}
          </Link>
        </div>
      </header>
      <ImportJobDialog open={importOpen} onClose={() => setImportOpen(false)} />

      {isLoading ? (
        <div aria-busy="true" aria-label={copy.common.loading} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={error instanceof Error ? error.message : copy.jobs.loadFailed} onRetry={() => void refetch()} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={copy.jobs.emptyTitle}
          description={copy.jobs.emptyBody}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                {copy.jobs.import.button}
              </Button>
              <Link to="/app/jobs/new" className={primaryLink}>
                {copy.jobs.newJob}
              </Link>
            </div>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <Card surface={1} className="flex h-full flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-md font-medium">{job.title}</h2>
                  <JobStatusChip status={job.status} />
                </div>
                <dl className="flex flex-col gap-1 text-sm text-muted">
                  <div className="flex gap-2 tabular-nums">
                    <dt className="sr-only">{copy.pages.candidates}</dt>
                    <dd>{copy.jobs.candidatesCount(job.candidateCount ?? 0)}</dd>
                  </div>
                  <div className="tabular-nums">{copy.jobs.capacityLine(job.capacity, job.waitlistSize)}</div>
                  <div>
                    {copy.jobs.updated} {fromNow(job.updatedAt)}
                  </div>
                </dl>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Link to={`/app/jobs/${job.id}/candidates`} className={primaryLink}>
                    {copy.jobs.openJob}
                  </Link>
                  <Link to={`/app/jobs/${job.id}/upload`} className={quietLink}>
                    {copy.jobs.uploadResumes}
                  </Link>
                  <Link to={`/app/jobs/${job.id}`} className={quietLink}>
                    {copy.jobs.editJob}
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
