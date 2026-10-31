import { formatInZone, fromNow, localZone } from '@/lib/time';

/** Usage: <TimeDisplay iso={e.createdAt} zone="Asia/Kolkata" />. Relative text, absolute time + zone on hover. */
export function TimeDisplay({ iso, zone = localZone() }: { iso: string; zone?: string }) {
  return (
    <time dateTime={iso} title={formatInZone(iso, zone)} className="tabular-nums text-muted">
      {fromNow(iso)}
    </time>
  );
}
