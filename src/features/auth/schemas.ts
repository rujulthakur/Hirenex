import { z } from 'zod';
import { copy } from '@/lib/copy';

/** Login form: one email field. */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, copy.auth.emailRequired)
    .email(copy.auth.emailInvalid),
});
export type LoginForm = z.infer<typeof loginSchema>;

/** OTP step: exactly six digits. */
export const OTP_LENGTH = 6;
export const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, copy.auth.codeIncomplete),
});
export type OtpForm = z.infer<typeof otpSchema>;

/** Limits that mirror the API contract (5 sends per hour per email, 5 attempts per code, 5 minute code life). */
export const OTP_MAX_SENDS_PER_HOUR = 5;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_LIFETIME_MS = 5 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
export const OTP_SEND_WINDOW_MS = 60 * 60 * 1000;
