import { api } from '@/services';
import { qk } from '@/services/queryKeys';
import { usePolling } from '@/services/usePolling';

/** GET /jobs/:id/analytics, polled every 3 s while the tab is visible. */
export function useAnalytics(jobId: string) {
  return usePolling({ queryKey: qk.analytics.get(jobId), queryFn: () => api.analytics.get(jobId), enabled: jobId !== '' });
}
