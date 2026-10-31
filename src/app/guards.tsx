import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { copy } from '@/lib/copy';
import { Skeleton } from '@/components/ui';
import { setUnauthorizedHandler } from '@/services';
import { useAuthStore } from '@/stores';
import type { Role } from '@/types';

export type { Role };

/** Interviewers may only open schedule pages (and their landing redirect); hr_admin and demo_hr see everything. */
export function isPathAllowed(role: Role, pathname: string): boolean {
  if (role !== 'interviewer') return true;
  return /^\/app\/jobs\/[^/]+\/schedule\/?$/.test(pathname) || /^\/app\/interviewer\/?$/.test(pathname);
}

/** Splash shown while GET /auth/me is in flight. */
function Splash() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={copy.shell.splash}
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg p-6 text-text"
    >
      <p className="text-lg font-semibold">{copy.app.name}</p>
      <div className="w-64">
        <Skeleton variant="text" lines={3} />
      </div>
      <p className="text-base text-muted">{copy.shell.splash}</p>
    </div>
  );
}

/**
 * Loads GET /auth/me once on start, shows the splash while it runs, and redirects anonymous
 * visitors to /login. A 401 anywhere later sends them to /login?reason=expired.
 */
export function AuthGate() {
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const clear = useAuthStore((s) => s.clear);
  const location = useLocation();

  useEffect(() => {
    if (useAuthStore.getState().status === 'unknown') void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clear();
      window.location.assign('/login?reason=expired');
    });
  }, [clear]);

  if (status === 'unknown' || status === 'loading') return <Splash />;
  if (status === 'anonymous') {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }
  return <Outlet />;
}

/** Role-based route guard. Interviewers are sent to their schedule (or the dashboard when none exists). */
export function RoleGuard() {
  const user = useAuthStore((s) => s.user);
  const { pathname } = useLocation();
  if (!user) return <Navigate to="/login" replace />;
  if (!isPathAllowed(user.role, pathname)) {
    return <Navigate to="/app/interviewer" replace />;
  }
  return <Outlet />;
}
