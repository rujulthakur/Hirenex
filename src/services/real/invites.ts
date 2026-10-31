import { z } from 'zod';
import { requestMapped, requestVoid } from '../apiClient';
import { InviteSchema } from '@/types';
import type { Api } from '../contract';
import { toInvite } from './adapters';

const many = (r: unknown): unknown[] => {
  const arr = Array.isArray(r) ? r : ((r as { invites?: unknown[] })?.invites ?? []);
  return arr.map(toInvite);
};

export const invites: Api['invites'] = {
  preview: (jobId) => requestMapped(`/jobs/${jobId}/invites/preview`, z.array(InviteSchema), many),
  update: (id, patch) => requestMapped(`/invites/${id}`, InviteSchema, toInvite, { method: 'PATCH', body: patch }),
  send: (jobId) => requestVoid(`/jobs/${jobId}/invites/send`, { method: 'POST' }),
  list: (jobId) => requestMapped(`/jobs/${jobId}/invites`, z.array(InviteSchema), many),
};
