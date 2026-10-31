import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarClock, CheckCircle2, ExternalLink, MapPin, XCircle } from 'lucide-react';
import { Badge, Button, Card, ErrorState, InlineAlert, Skeleton, toastError } from '@/components/ui';
import { copy } from '@/lib/copy';
import { formatInZone, localZone } from '@/lib/time';
import type { InviteResponse, PortalView } from '@/types';
import { PortalExpired } from '../components/PortalExpired';
import { PortalLayout } from '../components/PortalLayout';
import { DeclineDialog, RescheduleDialog } from '../components/ReasonDialogs';
import { isExpired, usePortalAnswer, usePortalView } from '../hooks/usePortal';
import type { PortalAnswer } from '../hooks/usePortal';

type Dialogs = 'none' | 'decline' | 'reschedule';

function resultCopy(response: InviteResponse, justNow: boolean): { tone: 'success' | 'info'; title: string; body: string } | null {
  const p = copy.portal;
  if (response === 'accepted') return justNow ? { tone: 'success', title: p.acceptedTitle, body: p.acceptedBody } : { tone: 'success', title: p.answeredTitle, body: p.answeredAccepted };
  if (response === 'declined') return justNow ? { tone: 'info', title: p.declinedTitle, body: p.declinedBody } : { tone: 'info', title: p.answeredTitle, body: p.answeredDeclined };
  if (response === 'reschedule_requested') return justNow ? { tone: 'info', title: p.rescheduledTitle, body: p.rescheduledBody } : { tone: 'info', title: p.answeredTitle, body: p.answeredReschedule };
  return null;
}

function Details({ view }: { view: PortalView }) {
  const zone = localZone();
  const p = copy.portal;
  return (
    <Card surface={1} className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <CalendarClock aria-hidden="true" strokeWidth={1.5} className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-muted">{p.when}</h2>
          <p className="text-lg font-semibold">
            <time dateTime={view.start}>{formatInZone(view.start, zone, 'ddd D MMM YYYY, HH:mm')}</time>
          </p>
          <p className="text-sm text-muted">{p.whenZone(zone)}</p>
          <p className="text-sm text-muted">{p.duration(Math.max(1, Math.round((Date.parse(view.end) - Date.parse(view.start)) / 60000)))}</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <MapPin aria-hidden="true" strokeWidth={1.5} className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-muted">{p.format}</h2>
          <p className="text-base">{view.format === 'virtual' ? p.formatVirtual : p.formatPhysical}</p>
          {view.format === 'virtual' && view.meetingLink ? (
            <a
              href={view.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 text-base text-primary underline focus-visible:shadow-focus"
            >
              {p.joinLink}
              <ExternalLink aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
            </a>
          ) : null}
          {view.format === 'physical' && view.location ? <p className="text-base">{p.location}: {view.location}</p> : null}
        </div>
      </div>
      <div>
        <h2 className="text-sm font-medium text-muted">{p.prep}</h2>
        <p className="mt-1 text-base">{view.preparationNotes}</p>
      </div>
    </Card>
  );
}

/** /c/:token. Public, mobile-first. Accept, decline (with confirm) or request another time. */
export default function PortalPage() {
  const { token = '' } = useParams();
  const view = usePortalView(token);
  const answer = usePortalAnswer(token);
  const [dialog, setDialog] = useState<Dialogs>('none');
  const [justNow, setJustNow] = useState<PortalAnswer | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  const response: InviteResponse = justNow ?? view.data?.response ?? 'pending';
  const result = resultCopy(response, justNow !== null);

  useEffect(() => {
    if (justNow !== null && result) resultRef.current?.focus();
  }, [justNow, result]);

  const send = (v: Parameters<typeof answer.mutate>[0]): void => {
    answer.mutate(v, {
      onSuccess: (kind) => {
        setJustNow(kind);
        setDialog('none');
      },
      onError: (err) => {
        setDialog('none');
        if (isExpired(err)) void view.refetch();
        else toastError(copy.portal.actionFailed);
      },
    });
  };

  let body: JSX.Element;
  if (view.isLoading) {
    body = (
      <div role="status" aria-busy="true" aria-label={copy.common.loading} className="flex flex-col gap-4">
        <Skeleton variant="card" />
        <Skeleton variant="text" lines={3} />
      </div>
    );
  } else if (view.isError) {
    body = isExpired(view.error) ? <PortalExpired /> : <ErrorState message={copy.portal.loadFailed} onRetry={() => void view.refetch()} />;
  } else if (view.data) {
    const d = view.data;
    body = (
      <>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">{copy.portal.heading}</h1>
          <p className="text-base text-muted">{copy.portal.greeting(d.candidateLabel, d.jobTitle)}</p>
          <Badge tone="neutral" className="self-start">{copy.app.testInboxChip}</Badge>
        </div>
        <Details view={d} />
        {result ? (
          <div ref={resultRef} tabIndex={-1} aria-label={copy.portal.resultFocus} className="outline-none">
            <InlineAlert tone={result.tone} title={result.title}>
              <span className="inline-flex items-center gap-2">
                {result.tone === 'success' ? <CheckCircle2 aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" /> : <XCircle aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />}
                {result.body}
              </span>
            </InlineAlert>
          </div>
        ) : (
          <section aria-labelledby="choose-h" className="flex flex-col gap-3">
            <div>
              <h2 id="choose-h" className="text-lg font-semibold">{copy.portal.chooseTitle}</h2>
              <p className="text-sm text-muted">{copy.portal.chooseBody}</p>
            </div>
            <Button size="lg" className="w-full" loading={answer.isPending && answer.variables?.kind === 'accept'} onClick={() => send({ kind: 'accept' })} disabled={answer.isPending}>
              {copy.portal.accept}
            </Button>
            <Button size="lg" variant="secondary" className="w-full" onClick={() => setDialog('reschedule')} disabled={answer.isPending}>
              {copy.portal.reschedule}
            </Button>
            <Button size="lg" variant="outline" className="w-full" onClick={() => setDialog('decline')} disabled={answer.isPending}>
              {copy.portal.decline}
            </Button>
          </section>
        )}
        <Link
          to={`/c/${token}/status`}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-base text-text hover:bg-surface-2 focus-visible:shadow-focus"
        >
          {copy.portal.viewStatus}
        </Link>
        <DeclineDialog
          open={dialog === 'decline'}
          onClose={() => setDialog('none')}
          busy={answer.isPending}
          onConfirm={(reason) => send({ kind: 'decline', reason })}
        />
        <RescheduleDialog open={dialog === 'reschedule'} onClose={() => setDialog('none')} busy={answer.isPending} onSend={(note) => send({ kind: 'reschedule', note })} />
      </>
    );
  } else {
    body = <PortalExpired />;
  }

  return <PortalLayout title={copy.pages.portal}>{body}</PortalLayout>;
}
