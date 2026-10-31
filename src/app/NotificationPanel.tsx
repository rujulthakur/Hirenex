import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Button, Drawer, EmptyState, ErrorState, Skeleton, toastInfo } from '@/components/ui';
import { copy } from '@/lib/copy';
import { fromNow } from '@/lib/time';
import { api } from '@/services';
import { qk } from '@/services/queryKeys';
import { useNotificationStore } from '@/stores';

const REFETCH_MS = 10_000;

/** Keeps the bell badge in sync with the notifications query. Mount once in the shell. */
export function useNotifications() {
  const setUnread = useNotificationStore((s) => s.setUnreadCount);
  const query = useQuery({ queryKey: qk.notifications.list, queryFn: () => api.notifications.list(), refetchInterval: REFETCH_MS });
  const unread = query.data ? query.data.filter((n) => !n.read).length : 0;
  useEffect(() => {
    setUnread(unread);
  }, [unread, setUnread]);
  return query;
}

/** Right-side panel listing notifications with "mark all as read". */
export function NotificationPanel() {
  const open = useNotificationStore((s) => s.panelOpen);
  const setOpen = useNotificationStore((s) => s.setPanelOpen);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const query = useNotifications();
  const markAll = useMutation({
    mutationFn: () => api.notifications.markRead(),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.notifications.list });
      toastInfo(copy.shell.notifications.markedRead);
    },
  });
  const items = query.data ?? [];
  const hasUnread = items.some((n) => !n.read);

  const markOne = useMutation({
    mutationFn: (id: string) => api.notifications.markRead([id]),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications.list }),
  });
  const go = (href: string | undefined): void => {
    setOpen(false);
    if (href) navigate(href);
  };
  const openItem = (n: { id: string; read: boolean; href?: string }): void => {
    if (!n.read) markOne.mutate(n.id);
    go(n.href);
  };

  return (
    <Drawer open={open} onClose={() => setOpen(false)} title={copy.shell.notifications.title} initialWidth={400}>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={() => markAll.mutate()} disabled={!hasUnread || markAll.isPending}>
            {copy.shell.notifications.markAll}
          </Button>
          <Button variant="outline" onClick={() => go('/app/notifications')}>
            {copy.shell.notifications.viewAll}
          </Button>
        </div>
        {query.isLoading ? (
          <div role="status" aria-busy="true" aria-label={copy.shell.notifications.loading}>
            <Skeleton variant="row" />
          </div>
        ) : query.isError ? (
          <ErrorState message={copy.shell.notifications.error} onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState icon={Bell} title={copy.shell.notifications.empty} description={copy.shell.notifications.emptyBody} />
        ) : (
          <ul className="space-y-2">
            {items.slice(0, 10).map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => openItem(n)}
                  className="flex min-h-11 w-full flex-col gap-1 rounded-md border border-border bg-surface-1 p-3 text-left hover:bg-surface-2 focus-visible:shadow-focus"
                >
                  <span className="flex items-center gap-2 text-base font-medium">
                    {n.read ? null : <span aria-label={copy.shell.notifications.unreadDot} className="h-2 w-2 rounded-full bg-primary" />}
                    {n.title}
                  </span>
                  <span className="text-sm text-muted">{n.body}</span>
                  <span className="text-xs text-muted">{fromNow(n.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Drawer>
  );
}
