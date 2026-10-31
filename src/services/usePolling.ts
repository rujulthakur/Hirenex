import { useEffect, useState } from 'react';
import { useQuery, type QueryKey, type UseQueryResult } from '@tanstack/react-query';

export const POLL_INTERVAL_MS = 3000;

/** True while the browser tab is visible. Polling hooks use it to pause on hidden tabs. */
export function useTabVisible(): boolean {
  const [visible, setVisible] = useState<boolean>(() => typeof document === 'undefined' || document.visibilityState === 'visible');
  useEffect(() => {
    const onChange = (): void => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return visible;
}

export interface UsePollingOptions<T> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  /** Set to false to disable the query entirely. */
  enabled?: boolean;
  /** Interval in ms. Defaults to 3000 as required by the API contract. */
  intervalMs?: number;
  /** Return true to stop polling (for example when a run is done). */
  stopWhen?: (data: T) => boolean;
}

/**
 * Polls an endpoint every 3000 ms by default and pauses automatically when the tab is hidden.
 * Server data stays in TanStack Query; callers read the returned query result.
 */
export function usePolling<T>(opts: UsePollingOptions<T>): UseQueryResult<T> {
  const { queryKey, queryFn, enabled = true, intervalMs = POLL_INTERVAL_MS, stopWhen } = opts;
  const visible = useTabVisible();
  return useQuery<T>({
    queryKey,
    queryFn,
    enabled,
    staleTime: 0,
    refetchIntervalInBackground: false,
    refetchInterval: (query) => {
      if (!visible) return false;
      const data = query.state.data;
      if (data !== undefined && stopWhen?.(data)) return false;
      return intervalMs;
    },
  });
}
