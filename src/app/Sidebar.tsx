import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';
import { copy } from '@/lib/copy';
import { useRole, useUiStore } from '@/stores';
import { MORE_ITEMS, PRIMARY_ITEMS, visibleFor } from './navItems';
import type { NavItem } from './navItems';
import type { ActiveJob } from './useActiveJob';

interface SidebarContentProps {
  active: ActiveJob;
  collapsed: boolean;
  onNavigate?: () => void;
}

function NavRow({ item, jobId, collapsed, onNavigate }: { item: NavItem; jobId: string | null; collapsed: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  const disabled = item.needsJob === true && !jobId;
  const base = 'flex min-h-11 items-center gap-3 rounded-md px-3 text-base transition-colors duration-fast ease-standard focus-visible:shadow-focus';
  if (disabled) {
    return (
      <span aria-disabled="true" title={copy.shell.commands.needsJob} className={cn(base, 'cursor-not-allowed text-muted opacity-60')}>
        <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
        {collapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
      </span>
    );
  }
  return (
    <NavLink
      to={item.to(jobId)}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) => cn(base, isActive ? 'bg-surface-2 text-text' : 'text-muted hover:bg-surface-2 hover:text-text')}
    >
      <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
      {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

function Group({ label, items, jobId, collapsed, onNavigate }: { label?: string; items: NavItem[]; jobId: string | null; collapsed: boolean; onNavigate?: () => void }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1">
      {label && !collapsed ? <p className="px-3 pt-2 text-xs font-medium uppercase text-muted">{label}</p> : null}
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i.id}>
            <NavRow item={i} jobId={jobId} collapsed={collapsed} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Nav body shared by the desktop sidebar and the mobile drawer: two primary links plus a collapsible "More". */
export function SidebarContent({ active, collapsed, onNavigate }: SidebarContentProps) {
  const role = useRole();
  const { pathname } = useLocation();
  const { jobId } = active;
  const more = visibleFor(MORE_ITEMS, role);
  const moreActive = more.some((i) => {
    if (i.needsJob && !jobId) return false;
    const to = i.to(jobId);
    return i.end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  });
  const [openMore, setOpenMore] = useState(moreActive);
  // Open "More" when the user lands on one of its pages, but never force it open: the toggle always closes it.
  useEffect(() => {
    setOpenMore(moreActive);
  }, [moreActive, pathname]);
  const showMore = openMore;

  return (
    <nav aria-label={copy.shell.mainNav} className="flex h-full flex-col gap-4 p-3">
      <Group items={visibleFor(PRIMARY_ITEMS, role)} jobId={jobId} collapsed={collapsed} onNavigate={onNavigate} />

      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setOpenMore((o) => !o)}
          aria-expanded={showMore}
          title={collapsed ? 'More' : undefined}
          className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-base text-muted transition-colors hover:bg-surface-2 hover:text-text focus-visible:shadow-focus"
        >
          <MoreHorizontal size={18} strokeWidth={1.5} aria-hidden="true" />
          {collapsed ? <span className="sr-only">More</span> : <><span className="flex-1 text-left">More</span><ChevronDown size={16} aria-hidden="true" className={cn('transition-transform', showMore && 'rotate-180')} /></>}
        </button>
        {showMore ? (
          <div className={cn(!collapsed && 'ml-3 border-l border-border pl-2')}>
            <Group items={more} jobId={jobId} collapsed={collapsed} onNavigate={onNavigate} />
          </div>
        ) : null}
      </div>
    </nav>
  );
}

/** Desktop sidebar. Fixed widths per state so toggling never shifts the main column unexpectedly. */
export function Sidebar({ active }: { active: ActiveJob }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const Toggle = collapsed ? ChevronsRight : ChevronsLeft;
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-surface-1 transition-[width] duration-base ease-standard motion-reduce:transition-none md:flex',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex min-h-14 items-center justify-between gap-2 border-b border-border px-3">
        {collapsed ? <span className="sr-only">{copy.app.name}</span> : <strong className="truncate text-lg">{copy.app.name}</strong>}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? copy.shell.sidebarExpand : copy.shell.sidebarCollapse}
          aria-expanded={!collapsed}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-text focus-visible:shadow-focus"
        >
          <Toggle size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <SidebarContent active={active} collapsed={collapsed} />
      </div>
    </aside>
  );
}
