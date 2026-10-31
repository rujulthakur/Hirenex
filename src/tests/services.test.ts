import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('service switch', () => {
  it('uses the mock API by default', async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'true');
    const { api } = await import('@/services');
    const { mockApi } = await import('@/services/mock');
    expect(api).toBe(mockApi);
  });
  it('uses the real API when VITE_USE_MOCKS=false', async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'false');
    const { api } = await import('@/services');
    const { realApi } = await import('@/services/real');
    expect(api).toBe(realApi);
  });
});

describe('mock approval lock', () => {
  it('blocks invites until the shortlist is approved', async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'true');
    const { mockApi } = await import('@/services/mock');
    const { resetDb } = await import('@/services/mock/db');
    resetDb();
    const { JOB_ID: jobId } = await import('@/services/mock/seed');
    await expect(mockApi.invites.preview(jobId)).rejects.toMatchObject({ code: 'APPROVAL_REQUIRED' });
  });
});
