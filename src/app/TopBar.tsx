import { Link, useLocation } from 'react-router-dom';
import { Bell, ChevronRight, Menu, Search } from 'lucide-react';
import { Kbd } from '@/components/ui';
import { copy } from '@/lib/copy';
import { useNotificationStore, useUiStore } from '@/stores';
import { resolveRoute } from './routeMeta';
import { ProfileMenu } from './ProfileMenu';

interface TopBarProps {
  jobId: string | null;
}

/** Breadcrumb, search trigger, AI status pill, bell, profile menu and the two persistent trust chips. */
export function TopBar(_props: TopBarProps) {
  const { pathname } = useLocation();
  const unread = useNotificationStore((s) => s.unreadCount);
  const togglePanel = useNotificationStore((s) => s.togglePanel);
  const setPalette = useUiStore((s) => s.setPaletteOpen);
  const setMobileNav = useUiStore((s) => s.setMobileNavOpen);
  const { crumbs } = resolveRoute(pathname);

  return (
    <header className="sticky top-0 z-20 flex min-h-14 flex-wrap items-center gap-2 border-b border-border bg-surface-1 px-3 py-2 md:px-4">
      <button
        type="button"
        onClick={() => setMobileNav(true)}
        aria-label={copy.shell.openMenu}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-text hover:bg-surface-2 focus-visible:shadow-focus md:hidden"
      >
        <Menu size={20} strokeWidth={1.5} aria-hidden="true" />
      </button>

      <nav aria-label={copy.shell.breadcrumbLabel} className="hidden min-w-0 flex-1 md:block">
        <ol className="flex items-center gap-1 text-sm text-muted">
          {crumbs.map((c, i) => (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1">
              {i > 0 ? <ChevronRight size={14} strokeWidth={1.5} aria-hidden="true" /> : null}
              {c.to ? (
                <Link to={c.to} className="hover:text-text focus-visible:shadow-focus">
                  {c.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-medium text-text">
                  {c.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex-1 md:hidden" />

      <button
        type="button"
        onClick={() => setPalette(true)}
        aria-label={copy.shell.searchTrigger}
        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface-2 px-3 text-sm text-muted hover:text-text focus-visible:shadow-focus"
      >
        <Search size={16} strokeWidth={1.5} aria-hidden="true" />
        <span className="hidden lg:inline">{copy.shell.searchHint}</span>
        <Kbd>Ctrl K</Kbd>
      </button>

      <button
        type="button"
        onClick={togglePanel}
        aria-label={copy.shell.bell(unread)}
        title={copy.shell.bellOpen}
        className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-surface-2 focus-visible:shadow-focus"
      >
        <Bell size={20} strokeWidth={1.5} aria-hidden="true" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 min-w-4 rounded-full bg-danger px-1 text-center text-xs text-bg">{unread > 9 ? '9+' : unread}</span>
        ) : null}
      </button>

      <ProfileMenu />
    </header>
  );
}
