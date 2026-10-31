import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { ApprovalDialog, Banner, Button, Card, EmptyState, ErrorState, InlineAlert, Skeleton, WeightSliderGroup } from '@/components/ui';
import type { WeightItem } from '@/components/ui';
import { WeightPreviewBar } from '@/components/domain';
import { copy } from '@/lib/copy';
import { useEvidenceDrawerStore } from '@/stores';
import { useCandidateList } from '@/features/candidates/hooks/useCandidates';
import { useCandidateName } from '@/features/candidates/hooks/useCandidateName';
import { useJob } from '@/features/jobs/hooks/useJobs';
import { ShortlistRowItem } from '../components/ShortlistRowItem';
import { RERANK_DEBOUNCE_MS, useApprove, useDebounced, useRerankPreview, useShortlist } from '../hooks/useShortlist';

const LIST_QUERY = { sort: 'rank', page: 1, limit: 100 } as const;

function toRecord(items: WeightItem[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of items) out[i.id] = i.weight;
  return out;
}

/** /app/jobs/:jobId/shortlist. Ranked list, cutoff line, waitlist, live weight preview and the approval gate. */
export default function ShortlistPage() {
  const { jobId = '' } = useParams<{ jobId: string }>();
  const shortlist = useShortlist(jobId);
  const job = useJob(jobId);
  const candidates = useCandidateList(jobId, LIST_QUERY);
  const nameOf = useCandidateName();

  const [weights, setWeights] = useState<WeightItem[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reopened, setReopened] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);

  const criteria = job.data?.criteria;
  const baseline = useMemo<WeightItem[]>(() => (criteria ?? []).map((c) => ({ id: c.id, name: c.name, weight: c.weight })), [criteria]);
  useEffect(() => {
    if (baseline.length > 0) setWeights((w) => w ?? baseline);
  }, [baseline]);

  const changed = weights !== null && weights.some((w) => baseline.find((b) => b.id === w.id)?.weight !== w.weight);
  const debounced = useDebounced(changed && weights ? toRecord(weights) : null, RERANK_DEBOUNCE_MS);
  const preview = useRerankPreview(jobId, changed ? debounced : null);

  const saved = shortlist.data;
  const showPreview = changed && preview.data !== undefined;
  const view = showPreview ? preview.data : saved;
  const approved = saved?.approved === true;
  const locked = approved && !reopened;

  const savedKey = saved ? saved.ranked.concat(saved.waitlist).map((r) => r.candidateId).join(',') : '';
  useEffect(() => {
    if (saved) setSelected(new Set(saved.ranked.concat(saved.waitlist).map((r) => r.candidateId)));
  }, [savedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const approve = useApprove(jobId, setConflict);

  const byId = useMemo(() => {
    const m = new Map<string, NonNullable<typeof candidates.data>['items'][number]>();
    for (const c of candidates.data?.items ?? []) m.set(c.id, c);
    return m;
  }, [candidates.data]);
  const nameFor = (id: string): string => {
    const c = byId.get(id);
    return c ? nameOf(c) : id;
  };
  const siblingIds = useMemo(() => (view ? view.ranked.concat(view.waitlist).map((r) => r.candidateId) : []), [view]);

  const toggle = (id: string): void =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (shortlist.isLoading || job.isLoading) {
    return (
      <section aria-busy="true" aria-label={copy.common.loading} className="flex flex-col gap-3 p-4 md:p-6">
        <Skeleton variant="card" />
        <Skeleton variant="row" />
        <Skeleton variant="row" />
        <Skeleton variant="row" />
      </section>
    );
  }
  if (shortlist.isError || !saved || !view) {
    return (
      <section className="p-4 md:p-6">
        <ErrorState message={copy.shortlist.loadFailed} onRetry={() => void shortlist.refetch()} />
      </section>
    );
  }
  if (saved.ranked.length === 0) {
    return (
      <section className="p-4 md:p-6">
        <EmptyState
          title={copy.shortlist.emptyTitle}
          description={copy.shortlist.emptyBody}
          action={
            <Link to={`/app/jobs/${jobId}/upload`} className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-base font-medium text-primary-fg focus-visible:shadow-focus">
              {copy.shortlist.emptyAction}
            </Link>
          }
        />
      </section>
    );
  }

  const shortlistIds = saved.ranked.map((r) => r.candidateId).filter((id) => selected.has(id));
  const waitlistIds = saved.waitlist.map((r) => r.candidateId).filter((id) => selected.has(id));
  const approveBlocked = changed ? copy.shortlist.approveDisabledPreview : shortlistIds.length === 0 ? copy.shortlist.approveDisabledEmpty : null;

  const open = (id: string): void => useEvidenceDrawerStore.getState().open(id, jobId, siblingIds);
  const renderRow = (r: (typeof view.ranked)[number]) => (
    <ShortlistRowItem key={r.candidateId} row={r} name={nameFor(r.candidateId)} checked={selected.has(r.candidateId)} disabled={locked} showMove={showPreview} onToggle={() => toggle(r.candidateId)} onOpen={() => open(r.candidateId)} />
  );

  return (
    <section className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{copy.shortlist.title}</h1>
        <p className="text-base text-muted">{copy.shortlist.subtitle}</p>
      </header>

      {approved ? (
        <Banner
          tone="info"
          action={
            <div className="flex gap-2">
              <Link to={`/app/jobs/${jobId}/invites`} className="inline-flex min-h-11 items-center text-sm text-primary focus-visible:shadow-focus">
                {copy.shortlist.goInvites}
              </Link>
              {!reopened ? (
                <Button variant="secondary" size="sm" onClick={() => setReopened(true)}>
                  {copy.shortlist.reopen}
                </Button>
              ) : null}
            </div>
          }
        >
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 aria-hidden="true" strokeWidth={1.5} className="h-4 w-4 text-success" />
            {reopened ? copy.shortlist.reopenNote : copy.shortlist.approvedBanner}
          </span>
        </Banner>
      ) : (
        <Banner tone="locked">{copy.shortlist.lockedBanner}</Banner>
      )}
      {conflict ? <InlineAlert tone="danger">{copy.shortlist.conflict(conflict)}</InlineAlert> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6" aria-busy={preview.isFetching}>
          {showPreview ? <InlineAlert tone="info">{copy.shortlist.previewBadge}</InlineAlert> : null}
          <section aria-labelledby="sl-head" className="flex flex-col gap-2">
            <h2 id="sl-head" className="text-md font-semibold">
              {copy.shortlist.shortlistHeading(view.ranked.length, view.capacity)}
            </h2>
            <ul className="flex flex-col gap-2">{view.ranked.map(renderRow)}</ul>
          </section>
          <div role="separator" aria-label={copy.shortlist.cutoff} className="flex items-center gap-3 text-xs uppercase tracking-wide text-warning">
            <span className="h-px flex-1 border-t border-dashed border-warning" />
            {copy.shortlist.cutoff}
            <span className="h-px flex-1 border-t border-dashed border-warning" />
          </div>
          <section aria-labelledby="wl-head" className="flex flex-col gap-2">
            <h2 id="wl-head" className="text-md font-semibold">
              {copy.shortlist.waitlistHeading(view.waitlist.length)}
            </h2>
            <ul className="flex flex-col gap-2">{view.waitlist.map(renderRow)}</ul>
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start" aria-label={copy.shortlist.weightsTitle}>
          <Card surface={1} className="flex flex-col gap-3">
            <h2 className="text-md font-semibold">{copy.shortlist.weightsTitle}</h2>
            <p className="text-sm text-muted">{copy.shortlist.weightsNote}</p>
            {weights ? <WeightSliderGroup items={weights} onChange={setWeights} disabled={locked} /> : null}
            {weights ? <WeightPreviewBar parts={weights} /> : null}
            {preview.isFetching ? <p role="status" className="text-sm text-muted">{copy.shortlist.previewLoading}</p> : null}
            {preview.isError ? <InlineAlert tone="danger">{copy.shortlist.previewFailed}</InlineAlert> : null}
            {changed ? (
              <Button variant="secondary" onClick={() => setWeights(baseline)}>
                {copy.shortlist.previewReset}
              </Button>
            ) : null}
          </Card>
          <Card surface={2} className="flex flex-col gap-3">
            <p className="text-sm tabular-nums" aria-live="polite">
              {copy.shortlist.selectedSummary(shortlistIds.length, waitlistIds.length)}
            </p>
            {approveBlocked ? <p className="text-xs text-muted">{approveBlocked}</p> : null}
            {locked ? (
              <p className="text-xs text-muted">{copy.shortlist.approvedReadOnly}</p>
            ) : (
              <Button onClick={() => setDialogOpen(true)} disabled={approveBlocked !== null}>
                {copy.shortlist.approve}
              </Button>
            )}
          </Card>
          {approved && !reopened ? (
            <Card surface={2} className="flex flex-col gap-1" role="status">
              <h2 className="text-md font-semibold">{copy.shortlist.successTitle}</h2>
              <p className="text-sm text-muted">{copy.shortlist.successBody}</p>
            </Card>
          ) : null}
        </aside>
      </div>

      <ApprovalDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        loading={approve.isPending}
        shortlist={shortlistIds.map((id) => ({ id, label: nameFor(id) }))}
        waitlist={waitlistIds.map((id) => ({ id, label: nameFor(id) }))}
        onApprove={() => {
          setConflict(null);
          approve.mutate({ shortlistIds, waitlistIds }, { onSuccess: () => { setDialogOpen(false); setReopened(false); } });
        }}
      />
    </section>
  );
}
