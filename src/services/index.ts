import { USE_MOCKS } from '@/lib/config';
import type { Api } from './contract';
import { mockApi } from './mock';
import { realApi } from './real';

/**
 * The single API entry point for the whole UI.
 * VITE_USE_MOCKS=true (default) uses the in-memory mock backend; VITE_USE_MOCKS=false uses the real API at VITE_API_URL.
 */
export const api: Api = USE_MOCKS ? mockApi : realApi;

export type { Api, AuditQuery, CandidateListQuery, Weights } from './contract';
export { ApiError, setUnauthorizedHandler } from './apiClient';
export type { ListMeta, Paged } from './apiClient';
