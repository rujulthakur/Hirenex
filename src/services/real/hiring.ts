import { requestMapped } from '../apiClient';
import { HiringSettingsSchema } from '@/types';
import type { Api } from '../contract';

const same = (r: unknown): unknown => r;

export const hiring: Api['hiring'] = {
  settings: () => requestMapped('/settings/hiring', HiringSettingsSchema, same),
  save: (patch) => requestMapped('/settings/hiring', HiringSettingsSchema, same, { method: 'PUT', body: patch }),
};
