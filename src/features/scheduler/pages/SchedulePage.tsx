import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarCheck, ExternalLink, Users, X } from 'lucide-react';
import { Badge, Button, Card, EmptyState, ErrorState, ProgressBar, Skeleton } from '@/components/ui';
import { dayjs } from '@/lib/time';
import { MeetingSettingsForm } from '@/features/meetings/components/MeetingSettingsForm';
import { useCancelMeeting, useJobMeetings, useMeetingCapacity } from '@/features/meetings/hooks/useMeetings';
import type { Meeting } from '@/types';

const primaryLink =
  'inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-base font-medium text-primary-fg transition-colors duration-fast ease-standard hover:brightness-110 focus-visible:shadow-focus';

/** /app/jobs/:jobId/schedule. HR runs every interview, so this is just: your hours, tomorrow's slots, and who is booked. */
export default function SchedulePage() {
  const { jobId = '' } = useParams<{ jobId: string }>();
  const capacity = useMeetingCapacity();
  const meetings = useJobMeetings(jobId);
  const cancel = useCancelMeeting(jobId);

  const zone = capacity.data?.settings.timeZone ?? 'Asia/Kolkata';
  const days = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    for (const m of meetings.data ?? []) {
      const key = dayjs(m.start).tz(zone).format('YYYY-MM-DD');
      map.set(key, [...(map.get(key) ?? []), m]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [meetings.data, zone]);

  const total = capacity.data?.total ?? 0;
  const free = capacity.data?.free ?? 0;
  const tomorrowLabel = capacity.data ? dayjs(capacity.data.date).format('dddd, D MMMM') : 'tomorrow';

  return (
    <section className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Interview schedule</h1>
        <p className="text-base text-muted">You take every interview yourself. Set your hours once, then invite candidates from the Candidates page. Invites always go out for tomorrow.</p>
      </header>

      <Card surface={1} className="flex flex-col gap-4">
        <h2 className="text-md font-semibold">Your interview hours</h2>
        <MeetingSettingsForm />
      </Card>

      <Card surface={1} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-md font-semibold">Tomorrow, {tomorrowLabel}</h2>
            {capacity.isLoading ? (
              <p className="text-sm text-muted">Checking slots…</p>
            ) : capacity.isError ? (
              <p className="text-sm text-danger">Could not check tomorrow’s slots.</p>
            ) : (
              <p className="text-sm text-muted tabular-nums">{total - free} of {total} slots booked · {free} free</p>
            )}
          </div>
          <Link to={`/app/jobs/${jobId}/candidates`} className={primaryLink}>
            <Users size={16} aria-hidden="true" />
            Choose candidates to invite
          </Link>
        </div>
        {total > 0 ? <ProgressBar label="Slots booked tomorrow" value={total - free} max={total} /> : null}
      </Card>

      <Card surface={1} className="flex flex-col gap-3">
        <h2 className="text-md font-semibold">Booked interviews</h2>
        {meetings.isLoading ? (
          <Skeleton variant="row" />
        ) : meetings.isError ? (
          <ErrorState message="Could not load the interviews." onRetry={() => void meetings.refetch()} />
        ) : days.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No interviews booked yet" description="Tick candidates on the Candidates page and send the invites. They appear here with their time." />
        ) : (
          days.map(([day, rows]) => (
            <div key={day} className="flex flex-col gap-1">
              <h3 className="text-sm font-medium text-muted">{dayjs(day).format('dddd, D MMMM')}</h3>
              <ul className="divide-y divide-border">
                {rows.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                    <div className="flex min-w-0 flex-col">
                      <span className="font-medium">{m.candidateName}</span>
                      <span className="truncate text-sm text-muted">{m.candidateEmail}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm tabular-nums">{dayjs(m.start).tz(zone).format('h:mm A')} – {dayjs(m.end).tz(zone).format('h:mm A')}</span>
                      <Badge tone={m.emailStatus === 'sent' ? 'success' : 'warning'}>{m.emailStatus === 'sent' ? 'Invited' : 'Email not sent'}</Badge>
                      <a href={m.meetLink} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sm text-primary focus-visible:shadow-focus">
                        Meet link <ExternalLink size={14} aria-hidden="true" />
                      </a>
                      <Button variant="ghost" onClick={() => cancel.mutate(m.id)} disabled={cancel.isPending} aria-label={`Cancel interview with ${m.candidateName}`}>
                        <X size={16} aria-hidden="true" /> Cancel
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </Card>
    </section>
  );
}
