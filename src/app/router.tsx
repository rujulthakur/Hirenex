import { Suspense, lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { AppShell } from '@/app/AppShell';
import { AuthGate, RoleGuard } from '@/app/guards';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { SkeletonFallback } from '@/app/SkeletonFallback';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const VerifyPage = lazy(() => import('@/features/auth/pages/VerifyPage'));
const PortalPage = lazy(() => import('@/features/portal/pages/PortalPage'));
const PortalStatusPage = lazy(() => import('@/features/portal/pages/PortalStatusPage'));
const StartPage = lazy(() => import('@/features/start/pages/StartPage'));
const DashboardPage = lazy(() => import('@/features/analytics/pages/DashboardPage'));
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage'));
const JobsPage = lazy(() => import('@/features/jobs/pages/JobsPage'));
const JobWizardPage = lazy(() => import('@/features/jobs/pages/JobWizardPage'));
const UploadPage = lazy(() => import('@/features/upload/pages/UploadPage'));
const CandidatesPage = lazy(() => import('@/features/candidates/pages/CandidatesPage'));
const CandidateDetailPage = lazy(() => import('@/features/candidates/pages/CandidateDetailPage'));
const ShortlistPage = lazy(() => import('@/features/shortlist/pages/ShortlistPage'));
const SchedulePage = lazy(() => import('@/features/scheduler/pages/SchedulePage'));
const InvitesPage = lazy(() => import('@/features/invites/pages/InvitesPage'));
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'));
const HelpPage = lazy(() => import('@/features/settings/pages/HelpPage'));
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage'));
const InterviewerHome = lazy(() => import('@/app/InterviewerHome'));
const NotFoundPage = lazy(() => import('@/app/pages/NotFoundPage'));
const ServerErrorPage = lazy(() => import('@/app/pages/ServerErrorPage'));

function withSuspense(node: JSX.Element): JSX.Element {
  return <Suspense fallback={<SkeletonFallback />}>{node}</Suspense>;
}

const routes: RouteObject[] = [
  {
    errorElement: <ErrorBoundary>{withSuspense(<ServerErrorPage />)}</ErrorBoundary>,
    children: [
      // HR-only product: no marketing page. Signed-in users land in the app, everyone else on the login page.
      { path: '/', element: <Navigate to="/app" replace /> },
      { path: '/login', element: withSuspense(<LoginPage />) },
      { path: '/verify', element: withSuspense(<VerifyPage />) },
      { path: '/c/:token', element: withSuspense(<PortalPage />) },
      { path: '/c/:token/status', element: withSuspense(<PortalStatusPage />) },
      {
        element: <AuthGate />,
        children: [
          {
            element: <AppShell />,
            children: [
              {
                element: <RoleGuard />,
                children: [
                  { path: '/app', element: withSuspense(<StartPage />) },
                  { path: '/app/dashboard', element: withSuspense(<DashboardPage />) },
                  { path: '/app/interviewer', element: withSuspense(<InterviewerHome />) },
                  { path: '/app/jobs', element: withSuspense(<JobsPage />) },
                  { path: '/app/jobs/new', element: withSuspense(<JobWizardPage />) },
                  { path: '/app/jobs/:jobId', element: withSuspense(<JobWizardPage />) },
                  { path: '/app/jobs/:jobId/upload', element: withSuspense(<UploadPage />) },
                  { path: '/app/jobs/:jobId/candidates', element: withSuspense(<CandidatesPage />) },
                  {
                    path: '/app/jobs/:jobId/candidates/:candidateId',
                    element: withSuspense(<CandidateDetailPage />),
                  },
                  { path: '/app/jobs/:jobId/shortlist', element: withSuspense(<ShortlistPage />) },
                  { path: '/app/jobs/:jobId/schedule', element: withSuspense(<SchedulePage />) },
                  { path: '/app/jobs/:jobId/invites', element: withSuspense(<InvitesPage />) },
                  { path: '/app/analytics', element: withSuspense(<AnalyticsPage />) },
                  { path: '/app/settings', element: withSuspense(<SettingsPage />) },
                  { path: '/app/notifications', element: withSuspense(<NotificationsPage />) },
                  { path: '/app/help', element: withSuspense(<HelpPage />) },
                  { path: '/500', element: withSuspense(<ServerErrorPage />) },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: withSuspense(<NotFoundPage />) },
    ],
  },
];

export const router = createBrowserRouter(routes);
