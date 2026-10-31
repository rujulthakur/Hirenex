import { z } from 'zod';
import { requestMapped, requestVoid } from '../apiClient';
import { NotificationSchema } from '@/types';
import type { Api } from '../contract';
import { toNotification } from './adapters';

export const notifications: Api['notifications'] = {
  list: () => requestMapped('/notifications', z.array(NotificationSchema), (r) => (r as unknown[]).map(toNotification)),
  markRead: (ids) => requestVoid('/notifications/read', { method: 'POST', body: { ids } }),
};
