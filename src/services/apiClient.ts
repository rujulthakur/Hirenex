import { z } from 'zod';
import { API_URL } from '@/lib/config';
import { ErrorCode } from '@/types/enums';

export interface ListMeta { page: number; limit: number; total: number }
export interface Paged<T> { items: T[]; meta: ListMeta }

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: unknown[];
  constructor(code: ErrorCode, message: string, status: number, details: unknown[] = []) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler = () => {
  window.location.assign('/login?reason=expired');
};
export function setUnauthorizedHandler(fn: UnauthorizedHandler): void {
  onUnauthorized = fn;
}

const BASE = `${API_URL}/api/v1`;

const ErrorEnvelope = z.object({
  error: z.object({ code: z.string(), message: z.string(), details: z.array(z.unknown()).optional() }),
});
const MetaSchema = z.object({ page: z.number(), limit: z.number(), total: z.number() });

type Query = Record<string, string | number | boolean | undefined>;
interface ReqOptions { method?: string; body?: unknown; query?: Query; form?: FormData; skipAuthRedirect?: boolean }

function buildUrl(path: string, query?: Query): string {
  const qs = new URLSearchParams();
  if (query) for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== '') qs.set(k, String(v));
  const s = qs.toString();
  return `${BASE}${path}${s ? `?${s}` : ''}`;
}

function toCode(raw: string): ErrorCode {
  const r = ErrorCode.safeParse(raw);
  return r.success ? r.data : 'INTERNAL';
}

/** One shared refresh at a time, so several 401s at once do not spend the rotating refresh token twice. */
let refreshing: Promise<boolean> | null = null;
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include', headers: { 'X-Requested-By': 'trusthire' } })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => { setTimeout(() => { refreshing = null; }, 0); });
  return refreshing;
}

async function send(path: string, opts: ReqOptions, retried = false): Promise<unknown> {
  // CSRF defence required by the backend on every non-GET request (cookie auth).
  const headers: Record<string, string> = { 'X-Requested-By': 'trusthire' };
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }
  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), { method: opts.method ?? 'GET', credentials: 'include', headers, body });
  } catch {
    throw new ApiError('INTERNAL', 'Network error. Check your connection.', 0);
  }
  // The access token lasts 15 minutes. Renew it quietly with the refresh token and retry once, so HR stays signed in.
  if (res.status === 401 && !opts.skipAuthRedirect && !retried && !opts.form && (await refreshSession())) return send(path, opts, true);
  if (res.status === 401 && !opts.skipAuthRedirect) onUnauthorized();
  const text = await res.text();
  const json: unknown = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const e = ErrorEnvelope.safeParse(json);
    if (e.success) throw new ApiError(toCode(e.data.error.code), e.data.error.message, res.status, e.data.error.details ?? []);
    throw new ApiError('INTERNAL', `Request failed (${res.status})`, res.status);
  }
  return json;
}

export async function request<T>(path: string, schema: z.ZodType<T>, opts: ReqOptions = {}): Promise<T> {
  const json = await send(path, opts);
  const env = z.object({ data: z.unknown() }).parse(json);
  return schema.parse(env.data);
}

export async function requestList<T>(path: string, item: z.ZodType<T>, opts: ReqOptions = {}): Promise<Paged<T>> {
  const json = await send(path, opts);
  const env = z.object({ data: z.array(z.unknown()), meta: MetaSchema.optional() }).parse(json);
  const items = env.data.map((d) => item.parse(d));
  return { items, meta: env.meta ?? { page: 1, limit: items.length, total: items.length } };
}

export async function requestVoid(path: string, opts: ReqOptions = {}): Promise<void> {
  await send(path, opts);
}

export async function requestBlob(path: string, query?: Query): Promise<Blob> {
  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), { credentials: 'include' });
  } catch {
    throw new ApiError('INTERNAL', 'Network error. Check your connection.', 0);
  }
  if (!res.ok) throw new ApiError('INTERNAL', `Download failed (${res.status})`, res.status);
  return res.blob();
}

/** Like request(), but runs the backend payload through a translator before validating it. */
export async function requestMapped<T>(path: string, schema: z.ZodType<T>, map: (raw: any) => unknown, opts: ReqOptions = {}): Promise<T> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const json = await send(path, opts);
  const env = z.object({ data: z.unknown() }).parse(json);
  return schema.parse(map(env.data));
}

export async function requestListMapped<T>(path: string, item: z.ZodType<T>, map: (raw: any) => unknown, opts: ReqOptions = {}): Promise<Paged<T>> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const json = await send(path, opts);
  const env = z.object({ data: z.array(z.unknown()), meta: MetaSchema.optional() }).parse(json);
  const items = env.data.map((d) => item.parse(map(d)));
  return { items, meta: env.meta ?? { page: 1, limit: items.length, total: items.length } };
}
