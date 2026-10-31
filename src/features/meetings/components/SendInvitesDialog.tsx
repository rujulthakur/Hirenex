import { useState } from 'react';
import { CalendarCheck, CircleAlert } from 'lucide-react';
import { Button, Dialog } from '@/components/ui';
import { dayjs } from '@/lib/time';
import type { SendMeetingsResult } from '@/types';
import { useMeetingCapacity, useSendMeetings } from '../hooks/useMeetings';
import { MeetingSettingsForm } from './MeetingSettingsForm';

const REASON: Record<string, string> = { day_full: 'no free slot left tomorrow', no_email: 'no email found in the resume', already_invited: 'already invited' };

interface Props {
  open: boolean;
  onClose: () => void;
  jobId: string;
  candidateIds: string[];
  onSent: () => void;
}

/** Confirms who gets an interview invite and for which day. Invites are always for tomorrow. */
export function SendInvitesDialog({ open, onClose, jobId, candidateIds, onSent }: Props) {
  const cap = useMeetingCapacity(open);
  const send = useSendMeetings(jobId);
  const [result, setResult] = useState<SendMeetingsResult | null>(null);
  const [editing, setEditing] = useState(false);

  const close = () => { setResult(null); setEditing(false); onClose(); };
  const hasLink = (cap.data?.settings.meetLink ?? '') !== '';
  const free = cap.data?.free ?? 0;
  const willSend = Math.min(candidateIds.length, free);
  const dateLabel = cap.data ? dayjs(cap.data.date).format('dddd, D MMMM') : 'tomorrow';

  let body;
  if (result) {
    const sent = result.scheduled.filter((m) => m.emailStatus === 'sent').length;
    body = (
      <div className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-base font-medium"><CalendarCheck size={18} aria-hidden="true" /> {sent} invite{sent === 1 ? '' : 's'} sent for {dateLabel}</p>
        {result.emailChannel === 'test' ? <p className="rounded-md border border-border bg-surface-2 p-3 text-sm text-muted">Email is running in test mode on this server, so nothing reached the candidates yet. Add the Gmail sender in the server settings to deliver real emails.</p> : null}
        {result.scheduled.some((m) => m.emailStatus !== 'sent') ? <p className="text-sm text-danger">Some emails could not be sent. Those candidates were not marked as invited.</p> : null}
        {result.skipped.length > 0 ? (
          <div className="text-sm">
            <p className="font-medium">Not scheduled</p>
            <ul className="list-disc pl-5 text-muted">{result.skipped.map((s) => <li key={s.candidateId}>{s.name}: {REASON[s.reason]}</li>)}</ul>
          </div>
        ) : null}
      </div>
    );
  } else if (cap.isLoading) {
    body = <p className="text-sm text-muted">Checking tomorrow’s availability…</p>;
  } else if (!hasLink || editing) {
    body = (
      <div className="flex flex-col gap-3">
        {!hasLink ? <p className="flex items-center gap-2 text-sm"><CircleAlert size={16} aria-hidden="true" /> Add your interview window and Google Meet link first.</p> : null}
        <MeetingSettingsForm compact onSaved={() => { setEditing(false); void cap.refetch(); }} />
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col gap-3 text-base">
        <p><b>{candidateIds.length}</b> candidate{candidateIds.length === 1 ? '' : 's'} selected. Interviews are booked for <b>{dateLabel}</b>, {cap.data?.settings.windowStart}–{cap.data?.settings.windowEnd}, {cap.data?.settings.slotMinutes} minutes each.</p>
        <p className="text-sm text-muted">{free} of {cap.data?.total} slots are free.{candidateIds.length > free ? ` Only the top ${free} scoring candidate${free === 1 ? '' : 's'} will get a slot; send the rest tomorrow for the next day.` : ''}</p>
        <button type="button" className="self-start text-sm text-primary hover:underline" onClick={() => setEditing(true)}>Change window or Meet link</button>
      </div>
    );
  }

  const footer = result ? (
    <Button onClick={close}>Done</Button>
  ) : (
    <>
      <Button variant="secondary" onClick={close}>Cancel</Button>
      {hasLink && !editing ? (
        <Button disabled={willSend === 0 || send.isPending} onClick={() => send.mutate(candidateIds, { onSuccess: (r) => { setResult(r); onSent(); } })}>
          {send.isPending ? 'Sending…' : `Send ${willSend} invite${willSend === 1 ? '' : 's'}`}
        </Button>
      ) : null}
    </>
  );

  return <Dialog open={open} onClose={close} title="Send interview invites" size="md" footer={footer}>{body}</Dialog>;
}
