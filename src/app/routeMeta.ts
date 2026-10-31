import { matchPath } from 'react-router-dom';
import { copy } from '@/lib/copy';

export interface Crumb {
  label: string;
  /** Omitted for the current page (last crumb). */
  to?: string;
}

interface RouteMeta {
  pattern: string;
  /** Page title shown in the document title and as the last breadcrumb. */
  title: string;
  /** Builds the parent crumbs for this route. */
  parents: (params: Record<string, string | undefined>) => Crumb[];
}

const dash: Crumb = { label: 'Screen resumes', to: '/app' };
const jobsCrumb: Crumb = { label: copy.pages.jobs, to: '/app/jobs' };
const jobCrumbs = (p: Record<string, string | undefined>): Crumb[] => [
  dash,
  jobsCrumb,
  { label: copy.pages.jobEdit, to: `/app/jobs/${p.jobId ?? ''}` },
];

/** Ordered most specific first. Single source for breadcrumbs and document titles. */
const ROUTES: RouteMeta[] = [
  { pattern: '/app', title: 'Screen resumes', parents: () => [] },
  { pattern: '/app/dashboard', title: copy.pages.dashboard, parents: () => [dash] },
  { pattern: '/app/jobs', title: copy.pages.jobs, parents: () => [dash] },
  { pattern: '/app/jobs/new', title: copy.pages.jobNew, parents: () => [dash, jobsCrumb] },
  { pattern: '/app/jobs/:jobId/upload', title: copy.pages.upload, parents: jobCrumbs },
  {
    pattern: '/app/jobs/:jobId/candidates/:candidateId',
    title: copy.pages.candidateDetail,
    parents: (p) => [...jobCrumbs(p), { label: copy.pages.candidates, to: `/app/jobs/${p.jobId ?? ''}/candidates` }],
  },
  { pattern: '/app/jobs/:jobId/candidates', title: copy.pages.candidates, parents: jobCrumbs },
  { pattern: '/app/jobs/:jobId/shortlist', title: copy.pages.shortlist, parents: jobCrumbs },
  { pattern: '/app/jobs/:jobId/schedule', title: copy.pages.schedule, parents: jobCrumbs },
  { pattern: '/app/jobs/:jobId/invites', title: copy.pages.invites, parents: jobCrumbs },
  { pattern: '/app/jobs/:jobId', title: copy.pages.jobEdit, parents: () => [dash, jobsCrumb] },
  { pattern: '/app/analytics', title: copy.pages.analytics, parents: () => [dash] },
  { pattern: '/app/settings', title: copy.pages.settings, parents: () => [dash] },
  { pattern: '/app/notifications', title: copy.pages.notifications, parents: () => [dash] },
  { pattern: '/app/help', title: copy.pages.help, parents: () => [dash] },
  { pattern: '/app/demo/attack', title: copy.pages.attack, parents: () => [dash] },
  { pattern: '/app/demo/swap-test', title: copy.pages.swapTest, parents: () => [dash] },
  { pattern: '/500', title: copy.pages.serverError, parents: () => [dash] },
];

export interface ResolvedRoute {
  title: string;
  crumbs: Crumb[];
}

/** Resolves breadcrumb trail and title from a pathname. Unknown paths fall back to the dashboard crumb. */
export function resolveRoute(pathname: string): ResolvedRoute {
  for (const r of ROUTES) {
    const m = matchPath({ path: r.pattern, end: true }, pathname);
    if (m) {
      const params: Record<string, string | undefined> = { ...m.params };
      return { title: r.title, crumbs: [...r.parents(params), { label: r.title }] };
    }
  }
  return { title: copy.pages.dashboard, crumbs: [{ label: copy.pages.dashboard }] };
}

/** Extracts the job id from any /app/jobs/:jobId/... path. "new" is not a job id. */
export function jobIdFromPath(pathname: string): string | null {
  const m = matchPath({ path: '/app/jobs/:jobId', end: false }, pathname);
  const id = m?.params.jobId;
  return id && id !== 'new' ? id : null;
}
