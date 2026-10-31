import { z } from 'zod';
import { OTP_SEND_WINDOW_MS } from './schemas';

/**
 * Tiny sessionStorage record that survives a refresh of /verify.
 * It holds only the email and send timestamps. Never a token, never the code.
 */
const KEY = 'trusthire.otp';

const OtpSessionSchema = z.object({
  email: z.string(),
  sentAt: z.number(),
  sends: z.array(z.number()),
});
export type OtpSession = z.infer<typeof OtpSessionSchema>;

export function readOtpSession(): OtpSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = OtpSessionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function write(session: OtpSession): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* storage unavailable: the flow still works for this page view */
  }
}

/** Records that a code was sent to this email now. Keeps only sends inside the one-hour window. */
export function recordOtpSend(email: string, now: number = Date.now()): OtpSession {
  const previous = readOtpSession();
  const sameEmail = previous && previous.email === email ? previous.sends : [];
  const sends = [...sameEmail.filter((t) => now - t < OTP_SEND_WINDOW_MS), now];
  const session: OtpSession = { email, sentAt: now, sends };
  write(session);
  return session;
}

export function clearOtpSession(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
