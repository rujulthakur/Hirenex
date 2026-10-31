import { requestMapped } from '../apiClient';
import { ProfileSchema } from '@/types';
import type { Api } from '../contract';

const toProfile = (r: { name: string; avatar?: string | null; preferences?: unknown }): unknown => ({ name: r.name, avatar: r.avatar ?? null, preferences: r.preferences ?? {} });

export const profile: Api['profile'] = {
  get: () => requestMapped('/settings/profile', ProfileSchema, toProfile),
  save: (patch) => requestMapped('/settings/profile', ProfileSchema, toProfile, { method: 'PUT', body: patch }),
};
