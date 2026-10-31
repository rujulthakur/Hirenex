import type { Candidate, HiringSettings } from '@/types';

const DAY = 86_400_000;
const PENDING: readonly string[] = ['applied', 'scored', 'shortlisted', 'waitlisted'];

export type Urgency = 'ok' | 'soon' | 'urgent' | 'done';
export interface Clock { label: string; urgency: Urgency }

/** "1d 4h", "5h 20m", "12m". */
export function formatLeft(ms: number): string {
  const m = Math.max(0, Math.floor(ms / 60_000));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

const urgencyFor = (ms: number): Urgency => (ms < 6 * 3_600_000 ? 'urgent' : ms < DAY ? 'soon' : 'ok');

/** What the countdown chip should say for a candidate, or null when no clock applies. */
export function clockFor(c: Candidate, s: HiringSettings, now: number = Date.now()): Clock | null {
  if (c.stage === 'rejected') {
    const why = c.rejectionReason === 'no_response' ? `Auto-rejected: no action in ${s.autoRejectDays} day${s.autoRejectDays === 1 ? '' : 's'}`
      : c.rejectionReason === 'hold_expired' ? 'Auto-rejected: hold period ended' : 'Rejected';
    return { label: why, urgency: 'done' };
  }
  if (c.stage === 'on_hold' && c.holdUntil) {
    const ms = new Date(c.holdUntil).getTime() - now;
    return ms <= 0 ? { label: 'Hold ended. Rejecting soon', urgency: 'urgent' } : { label: `On hold: ${formatLeft(ms)} left`, urgency: urgencyFor(ms) };
  }
  if (PENDING.includes(c.stage) && s.autoRejectEnabled) {
    const start = new Date(c.reviewClockStart ?? c.createdAt).getTime();
    const ms = start + s.autoRejectDays * DAY - now;
    return ms <= 0 ? { label: 'Auto-reject due', urgency: 'urgent' } : { label: `Auto-rejects in ${formatLeft(ms)}`, urgency: urgencyFor(ms) };
  }
  return null;
}
