import { Sparkles, ListChecks, BarChart3, Bell, Briefcase, CalendarClock, ClipboardList, FileUp, LayoutDashboard, LifeBuoy, Mail, Settings, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { copy } from '@/lib/copy';
import type { Role } from '@/types';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Builds the destination. Job-scoped items receive the active job id. */
  to: (jobId: string | null) => string;
  /** True for items that need an active job. */
  needsJob?: boolean;
  /** Roles that may see the item. */
  roles: Role[];
  /** Matches nested paths too (for example /app/jobs). */
  end?: boolean;
}

const HR: Role[] = ['hr_admin', 'demo_hr'];
const ALL: Role[] = ['hr_admin', 'demo_hr', 'interviewer'];

/** Workspace items, top of the sidebar, in the order they appear. */
export const WORKSPACE_ITEMS: NavItem[] = [
  { id: 'dashboard', label: copy.nav.dashboard, icon: LayoutDashboard, to: () => '/app/dashboard', roles: HR, end: true },
  { id: 'jobs', label: copy.nav.jobs, icon: Briefcase, to: () => '/app/jobs', roles: HR, end: true },
  { id: 'analytics', label: copy.nav.analytics, icon: BarChart3, to: () => '/app/analytics', roles: HR },
  { id: 'notifications', label: copy.nav.notifications, icon: Bell, to: () => '/app/notifications', roles: HR },
];

/** Job pipeline items, shown after the job switcher, in workflow order. */
export const JOB_ITEMS: NavItem[] = [
  { id: 'upload', label: copy.nav.upload, icon: FileUp, to: (j) => `/app/jobs/${j ?? ''}/upload`, needsJob: true, roles: HR },
  { id: 'candidates', label: copy.nav.candidates, icon: Users, to: (j) => `/app/jobs/${j ?? ''}/candidates`, needsJob: true, roles: HR },
  { id: 'shortlist', label: copy.nav.shortlist, icon: ClipboardList, to: (j) => `/app/jobs/${j ?? ''}/shortlist`, needsJob: true, roles: HR },
  { id: 'schedule', label: copy.nav.schedule, icon: CalendarClock, to: (j) => `/app/jobs/${j ?? ''}/schedule`, needsJob: true, roles: ALL },
  { id: 'invites', label: copy.nav.invites, icon: Mail, to: (j) => `/app/jobs/${j ?? ''}/invites`, needsJob: true, roles: HR },
];

/** Bottom area of the sidebar. */
export const BOTTOM_ITEMS: NavItem[] = [
  { id: 'settings', label: copy.nav.settings, icon: Settings, to: () => '/app/settings', roles: HR },
  { id: 'help', label: copy.nav.help, icon: LifeBuoy, to: () => '/app/help', roles: HR },
];

export function visibleFor(items: NavItem[], role: Role | null): NavItem[] {
  if (!role) return [];
  return items.filter((i) => i.roles.includes(role));
}

/** Slim primary nav: the two things a recruiter does all day. */
export const PRIMARY_ITEMS: NavItem[] = [
  { id: 'screen', label: 'Screen resumes', icon: Sparkles, to: () => '/app', roles: HR, end: true },
  { id: 'results', label: 'Results', icon: ListChecks, to: (j) => `/app/jobs/${j ?? ''}/candidates`, needsJob: true, roles: HR },
  { id: 'schedule-primary', label: copy.nav.schedule, icon: CalendarClock, to: (j) => `/app/jobs/${j ?? ''}/schedule`, needsJob: true, roles: ['interviewer'] },
];

/** Everything else lives under "More" so the sidebar stays calm. */
export const MORE_ITEMS: NavItem[] = [
  WORKSPACE_ITEMS[0], WORKSPACE_ITEMS[1],
  JOB_ITEMS[0], JOB_ITEMS[2], JOB_ITEMS[3], JOB_ITEMS[4],
  WORKSPACE_ITEMS[2], WORKSPACE_ITEMS[3],
  BOTTOM_ITEMS[1],
];
