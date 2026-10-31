import { ApiError, type Paged } from '../apiClient';
import type { ErrorCode } from '@/types';

export function lat(): Promise<void> {
  const ms = 200 + Math.floor(Math.random() * 500);
  return new Promise((r) => setTimeout(r, ms));
}

export function fail(code: ErrorCode, message: string, status = 400): never {
  throw new ApiError(code, message, status);
}

export function paginate<T>(all: T[], page = 1, limit = 20): Paged<T> {
  const start = (page - 1) * limit;
  return { items: all.slice(start, start + limit), meta: { page, limit, total: all.length } };
}

export function clone<T>(v: T): T {
  return structuredClone(v);
}

export function uid(prefix: string): string {
  return `${prefix}${Math.random().toString(16).slice(2, 10)}${Date.now().toString(16).slice(-4)}`;
}
