import { describe, expect, it } from 'vitest';
import { loginSchema, otpSchema } from '@/features/auth/schemas';
import { copy } from '@/lib/copy';

describe('login form validation', () => {
  it('rejects an empty email', () => {
    const r = loginSchema.safeParse({ email: '' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toBe(copy.auth.emailRequired);
  });

  it('rejects a malformed email', () => {
    const r = loginSchema.safeParse({ email: 'not-an-email' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toBe(copy.auth.emailInvalid);
  });

  it('accepts a valid email and trims spaces', () => {
    const r = loginSchema.safeParse({ email: '  hr@company.test ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('hr@company.test');
  });

  it('requires exactly six digits for the code', () => {
    expect(otpSchema.safeParse({ code: '12345' }).success).toBe(false);
    expect(otpSchema.safeParse({ code: '1234567' }).success).toBe(false);
    expect(otpSchema.safeParse({ code: '12a456' }).success).toBe(false);
    expect(otpSchema.safeParse({ code: '123456' }).success).toBe(true);
  });
});
