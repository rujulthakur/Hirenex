import { requestMapped, requestVoid } from '../apiClient';
import { PortalStatusSchema, PortalViewSchema } from '@/types';
import type { Api } from '../contract';
import { toPortalStatus, toPortalView } from './adapters';

const opt = { skipAuthRedirect: true } as const;
export const portal: Api['portal'] = {
  get: (t) => requestMapped(`/portal/${t}`, PortalViewSchema, toPortalView, opt),
  accept: (t) => requestVoid(`/portal/${t}/accept`, { method: 'POST', ...opt }),
  decline: (t, reason) => requestVoid(`/portal/${t}/decline`, { method: 'POST', body: { reason }, ...opt }),
  reschedule: (t, note) => requestVoid(`/portal/${t}/reschedule`, { method: 'POST', body: { note }, ...opt }),
  status: (t) => requestMapped(`/portal/${t}/status`, PortalStatusSchema, toPortalStatus, opt),
};
