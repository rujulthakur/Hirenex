import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, Send } from 'lucide-react';
import { Banner, Button, EmptyState, ErrorState, InlineAlert, Skeleton } from '@/components/ui';
import { DeliveryStepper, EmailPreviewCard } from '@/components/domain';
import { ApiError } from '@/services/apiClient';
import { copy } from '@/lib/copy';
import { useCandidateList } from '@/features/candidates/hooks/useCandidates';
import { useCandidateName } from '@/features/candidates/hooks/useCandidateName';
import { useInviteList, useInvitePreview, useSendInvites, useUpdateInvite } from '../hooks/useInvites';

const LIST_QUERY = { sort: 'rank', page: 1, limit: 100 } as const;
const linkClass = 'inline-flex min-h-11 items-center gap-1 text-sm text-primary focus-visible:shadow-focus';

/** /app/jobs/:jobId/invites. Editable drafts, bulk send to the test inbox (locked until approval), delivery table. */
export default function InvitesPage() {
  const { jobId = '' } = useParams<{ jobId: string }>();
  const preview = useInvitePreview(jobId);
  const locked = preview.error instanceof ApiError && preview.error.code === 'APPROVAL_REQUIRED';
  const list = useInviteList(jobId, preview.isSuccess);
  const candidatesQ = useCandidateList(jobId, LIST_QUERY);
  const nameOf = useCandidateName();
  const update = useUpdateInvite(jobId);
  const send = useSendInvites(jobId);

  const byId = useMemo(() => {
    const m = new Map<string, NonNullable<typeof candidatesQ.data>['items'][number]>();
    for (const c of candidatesQ.data?.items ?? []) m.set(c.id, c);
    return m;
  }, [candidatesQ.data]);

  const invites = list.data ?? preview.data ?? [];
  const drafts = invites.filter((i) => i.emailStatus === 'queued' || i.emailStatus === 'failed');
  const failed = invites.filter((i) => i.emailStatus === 'failed');
  const allSent = invites.length > 0 && drafts.length === 0;

  if (preview.isLoading) {
    return (
      <section aria-busy="true" aria-label={copy.common.loading} className="flex flex-col gap-3 p-4 md:p-6">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </section>
    );
  }
  if (locked) {
    return (
      <section className="flex flex-col gap-4 p-4 md:p-6">
        <h1 className="text-2xl font-semibold">{copy.invites.title}</h1>
        <Banner tone="locked">{copy.invites.lockedBody}</Banner>
        <EmptyState
          title={copy.invites.lockedTitle}
          description={copy.invites.lockedBody}
          action={
            <Link to={`/app/jobs/${jobId}/shortlist`} className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-base font-medium text-primary-fg focus-visible:shadow-focus">
              {copy.invites.lockedAction}
            </Link>
          }
        />
      </section>
    );
  }
  if (preview.isError) {
    return (
      <section className="p-4 md:p-6">
        <ErrorState message={copy.invites.loadFailed} onRetry={() => void preview.refetch()} />
      </section>
    );
  }
  if (invites.length === 0) {
    return (
      <section className="p-4 md:p-6">
        <EmptyState title={copy.invites.emptyTitle} description={copy.invites.emptyBody} />
      </section>
    );
  }

  const sendDisabledReason = allSent ? copy.invites.sendDisabledAll : null;
  const nameFor = (id: string): string => {
    const c = byId.get(id);
    return c ? nameOf(c) : id;
  };

  return (
    <section className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{copy.invites.title}</h1>
          <p className="text-base text-muted">{copy.invites.subtitle}</p>
          <p className="text-sm text-muted">{copy.invites.inboxNote}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button onClick={() => send.mutate()} loading={send.isPending} disabled={sendDisabledReason !== null}>
            <Send aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
            {send.isPending ? copy.invites.sending : copy.invites.send}
          </Button>
          {sendDisabledReason ? <p className="text-xs text-muted">{sendDisabledReason}</p> : null}
        </div>
      </header>

      {send.isError ? <InlineAlert tone="danger">{send.error instanceof ApiError && send.error.code === 'SLOT_TAKEN' ? copy.invites.slotTaken : send.error instanceof ApiError && send.error.code === 'APPROVAL_REQUIRED' ? copy.invites.approvalRequired : copy.invites.sendFailed}</InlineAlert> : null}

      {drafts.length > 0 ? (
        <section aria-labelledby="drafts-h" className="flex flex-col gap-3">
          <h2 id="drafts-h" className="text-md font-semibold">
            {copy.invites.drafts}
          </h2>
          <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {drafts.map((inv) => {
              const real = byId.get(inv.candidateId);
              return (
                <li key={inv.id}>
                  <EmailPreviewCard
                    to={copy.invites.to(nameFor(inv.candidateId))}
                    subject={inv.subject}
                    body={inv.body}
                    personalised={real ? [real.displayName] : []}
                    onSave={(next) => update.mutate({ id: inv.id, subject: next.subject, body: next.body })}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="deliv-h" className="flex flex-col gap-3">
        <h2 id="deliv-h" className="text-md font-semibold">
          {copy.invites.delivery}
        </h2>
        <div className="overflow-x-auto rounded-md border border-border bg-surface-1">
          <table aria-label={copy.invites.deliveryLabel} className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-muted">
              <tr>
                <th scope="col" className="p-3 font-medium">{copy.invites.cols.candidate}</th>
                <th scope="col" className="p-3 font-medium">{copy.invites.cols.delivery}</th>
                <th scope="col" className="p-3 font-medium">{copy.invites.cols.response}</th>
                <th scope="col" className="p-3 font-medium">{copy.invites.cols.inbox}</th>
                <th scope="col" className="p-3 font-medium">{copy.invites.cols.actions}</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => (
                <tr key={inv.id} className="border-t border-border">
                  <th scope="row" className="p-3 font-medium">{nameFor(inv.candidateId)}</th>
                  <td className="p-3"><DeliveryStepper emailStatus={inv.emailStatus} response={inv.response} /></td>
                  <td className="p-3">{copy.invites.response[inv.response]}</td>
                  <td className="p-3">
                    {inv.previewUrl ? (
                      <a href={inv.previewUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                        {copy.invites.openInbox}
                        <ExternalLink aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="text-muted">{copy.invites.noPreview}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {inv.emailStatus === 'failed' ? (
                      <Button size="sm" variant="secondary" onClick={() => send.mutate()} loading={send.isPending} aria-label={copy.invites.retryLabel(nameFor(inv.candidateId))}>
                        {copy.invites.retry}
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {failed.length > 0 ? <p role="status" className="text-sm text-danger">{copy.invites.sendFailed}</p> : null}
      </section>
    </section>
  );
}
