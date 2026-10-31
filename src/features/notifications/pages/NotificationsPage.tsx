import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { Button, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { dayjs, fromNow } from '@/lib/time';
import { api } from '@/services';
import { qk } from '@/services/queryKeys';
import type { Notification } from '@/types';

type Filter = 'all' | 'unread';

const dayLabel = (iso: string): string => {
  const d = dayjs(iso);
  if (d.isSame(dayjs(), 'day')) return 'Today';
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Yesterday';
  return d.format('dddd, D MMMM');
};

/** /app/notifications. Everything that happened, newest first, grouped by day. Click one to open it and mark it read. */
export default function NotificationsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  const query = useQuery({ queryKey: qk.notifications.list, queryFn: () => api.notifications.list() });
  const refresh = (): Promise<void> => qc.invalidateQueries({ queryKey: qk.notifications.list });
  const markAll = useMutation({ mutationFn: () => api.notifications.markRead(), onSuccess: refresh });
  const markOne = useMutation({ mutationFn: (id: string) => api.notifications.markRead([id]), onSuccess: refresh });

  const items = query.data ?? [];
  const unread = items.filter((n) => !n.read).length;
  const shown = filter === 'unread' ? items.filter((n) => !n.read) : items;

  const groups = useMemo(() => {
    const map = new Map<string, Notification[]>();
    for (const n of shown) {
      const key = dayLabel(n.createdAt);
      map.set(key, [...(map.get(key) ?? []), n]);
    }
    return [...map.entries()];
  }, [shown]);

  const open = (n: Notification): void => {
    if (!n.read) markOne.mutate(n.id);
    if (n.href) navigate(n.href);
  };

  return (
    <section className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-base text-muted">{unread === 0 ? 'You are all caught up.' : `${unread} unread`}</p>
        </div>
        <Button variant="secondary" onClick={() => markAll.mutate()} disabled={unread === 0 || markAll.isPending}>
          <CheckCheck size={16} aria-hidden="true" />
          Mark all as read
        </Button>
      </header>

      <div role="tablist" aria-label="Filter notifications" className="flex gap-2">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`min-h-11 rounded-full border px-4 text-sm font-medium focus-visible:shadow-focus ${filter === f ? 'border-primary bg-surface-2 text-primary' : 'border-border text-muted hover:text-text'}`}
          >
            {f === 'all' ? 'All' : `Unread${unread ? ` (${unread})` : ''}`}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <div aria-busy="true" className="flex flex-col gap-2">{[0, 1, 2].map((i) => <Skeleton key={i} variant="row" />)}</div>
      ) : query.isError ? (
        <ErrorState message="Could not load notifications." onRetry={() => void query.refetch()} />
      ) : shown.length === 0 ? (
        <EmptyState icon={Bell} title={filter === 'unread' ? 'No unread notifications' : 'Nothing here yet'} description="Updates about uploads, scoring and interview invites appear here." />
      ) : (
        groups.map(([label, rows]) => (
          <div key={label} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-muted">{label}</h2>
            <ul className="flex flex-col gap-2">
              {rows.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => open(n)}
                    className="flex min-h-11 w-full items-start gap-3 rounded-lg border border-border bg-surface-1 p-3 text-left transition-colors duration-fast ease-standard hover:bg-surface-2 focus-visible:shadow-focus"
                  >
                    <span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-primary'}`} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className={`text-base ${n.read ? '' : 'font-semibold'}`}>{n.title}{n.read ? null : <span className="sr-only"> (unread)</span>}</span>
                      <span className="text-sm text-muted">{n.body}</span>
                    </span>
                    <time dateTime={n.createdAt} title={dayjs(n.createdAt).format('D MMM YYYY, h:mm A')} className="shrink-0 text-xs tabular-nums text-muted">{fromNow(n.createdAt)}</time>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
