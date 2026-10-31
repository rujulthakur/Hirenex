import { request, requestVoid } from '../apiClient';
import { HealthSchema, QrSchema } from '@/types';
import type { Api } from '../contract';

export const demo: Api['demo'] = {
  seed: () => requestVoid('/demo/seed', { method: 'POST' }),
  reset: () => requestVoid('/demo/reset', { method: 'POST' }),
  qr: () => request('/demo/qr', QrSchema, { skipAuthRedirect: true }),
};
export const health: Api['health'] = { get: () => request('/health', HealthSchema, { skipAuthRedirect: true }) };
