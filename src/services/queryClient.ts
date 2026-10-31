import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './apiClient';

const MAX_RETRIES = 2;
const STALE_TIME_MS = 30_000;
const GC_TIME_MS = 5 * 60_000;

/** Never retry 4xx responses (they will not change); retry network and 5xx errors a limited number of times. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < MAX_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export const queryClient: QueryClient = createQueryClient();
