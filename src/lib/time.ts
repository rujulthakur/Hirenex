import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

/** Local browser time zone (IANA). */
export function localZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Formats a UTC ISO string in a zone, always showing the zone label. */
export function formatInZone(iso: string, zone: string = localZone(), pattern = 'D MMM YYYY, HH:mm'): string {
  const d = dayjs.utc(iso).tz(zone);
  return `${d.format(pattern)} (${zone})`;
}

/** Relative time, e.g. "3 minutes ago". */
export function fromNow(iso: string): string {
  return dayjs.utc(iso).fromNow();
}

/** Current time as a UTC ISO string. */
export function nowIso(): string {
  return dayjs.utc().toISOString();
}

export { dayjs };
