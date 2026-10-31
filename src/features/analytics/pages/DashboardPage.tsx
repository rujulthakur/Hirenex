import { Link } from 'react-router-dom';
import { Card, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { KpiCard, TimeDisplay } from '@/components/domain';
import { useActiveJob } from '@/app/useActiveJob';
import { copy } from '@/lib/copy';
import { api } from '@/services';
import { qk } from '@/services/queryKeys';
import { usePolling } from '@/services/usePolling';
import { useAnalytics } from '../hooks/useAnalytics';
import { actionPath, nextBestAction } from '../dashboardModel';

const HISTORY_SHOWN = 8;
const primaryLink =
  'inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-base font-medium text-primary-fg transition-colors duration-fast ease-standard hover:brightness-110 focus-visible:shadow-focus';

/** /app/dashboard. Kept deliberately small: what to do next, four numbers, and a plain history list. */
export default function DashboardPage() {
  const active = useActiveJob();
  const job = active.job;
  const jobId = job?.id ?? '';
  const analytics = useAnalytics(jobId);
  const history = usePolling({ queryKey: qk.notifications.list, queryFn: () => api.notifications.list() });

  const header = (
    <header className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold">{copy.dashboard.title}</h1>
      <p className="text-base text-muted">{copy.dashboard.subtitle}</p>
    </header>
  );

  if (active.isLoading) {
    return (
      <section aria-busy="true" aria-label={copy.common.loading} className="flex flex-col gap-4 p-4 md:p-6">
        {header}
        <Skeleton variant="card" />
      </section>
    );
  }
  if (active.isError) {
    return (
      <section className="flex flex-col gap-4 p-4 md:p-6">
        {header}
        <ErrorState message={copy.dashboard.loadFailed} />
      </section>
    );
  }
  if (!job) {
    return (
      <section className="flex flex-col gap-6 p-4 md:p-6">
        {header}
        <EmptyState
          title={copy.dashboard.noJobTitle}
          description={copy.dashboard.noJobBody}
          action={
            <Link to="/app/jobs/new" className={primaryLink}>
              {copy.dashboard.createJob}
            </Link>
          }
        />
      </section>
    );
  }

  const action = nextBestAction(job.status, job.candidateCount ?? 0);
  const count = (stages: string[]): number =>
    (analytics.data?.funnel ?? []).filter((f) => stages.includes(f.stage)).reduce((sum, f) => sum + f.count, 0);
  const total = (analytics.data?.funnel ?? []).reduce((sum, f) => sum + f.count, 0);
  const shortlisted = count(['shortlisted', 'invited', 'confirmed']);
  const invited = count(['invited', 'confirmed']);
  const feed = (history.data ?? []).slice(0, HISTORY_SHOWN);

  return (
    <section className="flex flex-col gap-6 p-4 md:p-6">
      {header}

      <Card surface={1} className="flex flex-wrap items-center justify-between gap-4 border-primary">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-wide text-muted">{copy.dashboard.nextBest}</p>
          <h2 className="text-xl font-semibold">{action.title}</h2>
          <p className="text-base text-muted">{action.body}</p>
        </div>
        <Link to={actionPath(job, action)} className={primaryLink}>
          {action.cta}
        </Link>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label={copy.dashboard.statResumes} value={total || (job.candidateCount ?? 0)} />
        <KpiCard label={copy.dashboard.statShortlisted} value={shortlisted} />
        <KpiCard label={copy.dashboard.statInvited} value={invited} />
        <KpiCard label={copy.dashboard.statConfirmed} value={count(['confirmed'])} />
      </div>

      <Card surface={1} className="flex flex-col gap-3">
        <h2 className="text-md font-semibold">{copy.dashboard.history}</h2>
        {history.isLoading ? (
          <Skeleton variant="row" />
        ) : feed.length === 0 ? (
          <p className="text-sm text-muted">{copy.dashboard.historyEmpty}</p>
        ) : (
          <ul aria-label={copy.dashboard.history} className="divide-y divide-border">
            {feed.map((n) => (
              <li key={n.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2 text-sm">
                <span>
                  <span className="font-medium">{n.title}</span>
                  <span className="text-muted"> · {n.body}</span>
                </span>
                <TimeDisplay iso={n.createdAt} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
