import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button, ErrorState, Skeleton, Drawer } from '@/components/ui';
import { AuthorityMarker, EvidenceQuote, FlagBadge, HighlightedText, TotalScore } from '@/components/domain';
import { copy } from '@/lib/copy';
import { useEvidenceDrawerStore } from '@/stores';
import { useCandidate, useCandidateScores } from '../hooks/useCandidates';
import { useScoreOverride } from '../hooks/useEvidence';
import { useCandidateName } from '../hooks/useCandidateName';
import { OverrideForm } from './OverrideForm';

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;
}

/** Mounted once in AppShell. Open it from anywhere with useEvidenceDrawerStore.getState().open(id, jobId, siblingIds). */
export function EvidenceDrawer() {
  const { candidateId, jobId, siblingIds, close, step } = useEvidenceDrawerStore();
  const open = candidateId !== null;
  const id = candidateId ?? '';
  const candidate = useCandidate(id);
  const scores = useCandidateScores(id);
  const override = useScoreOverride(id, jobId ?? '');
  const nameOf = useCandidateName();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setActiveId(null);
    setEditingId(null);
  }, [candidateId]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'j') step(1);
      else if (e.key === 'k') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, step]);

  const list = scores.data ?? [];
  const ranges = useMemo(
    () => list.filter((s) => s.verified && s.location).map((s) => ({ id: s.criterionId, start: s.location?.start ?? 0, end: s.location?.end ?? 0 })),
    [list],
  );
  const at = candidateId === null ? -1 : siblingIds.indexOf(candidateId);
  const c = candidate.data;

  const header = c ? (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border pb-3">
      <div className="flex flex-col">
        <span className="text-sm text-muted">{copy.candidates.detail.rank}</span>
        <span className="text-xl font-semibold tabular-nums">{c.rank === null ? copy.candidates.noRank : `#${c.rank}`}</span>
      </div>
      <TotalScore value={c.totalScore} authority="code" />
      <div className="flex flex-wrap items-center gap-1">
        {c.flags.map((f) => (
          <FlagBadge key={f} flag={f} />
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <AuthorityMarker authority="ai" />
        <AuthorityMarker authority="code" />
        <AuthorityMarker authority="human" />
      </div>
    </div>
  ) : null;

  let body;
  if (candidate.isLoading || scores.isLoading) {
    body = (
      <div aria-busy="true" aria-label={copy.common.loading} className="flex flex-col gap-3">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    );
  } else if (candidate.isError || !c) {
    body = <ErrorState message={copy.evidence.loadFailed} onRetry={() => void candidate.refetch()} />;
  } else {
    body = (
      <div className="flex flex-col gap-4">
        {header}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section aria-label={copy.evidence.resumePane} className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto rounded-md border border-border bg-surface-1 p-3">
            <h3 className="text-sm font-medium text-muted">{copy.evidence.resumePane}</h3>
            {c.redactedText ? (
              <HighlightedText text={c.redactedText} ranges={ranges} activeId={activeId} hiddenFindings={c.hiddenFindings ?? []} showHidden={false} />
            ) : (
              <p className="text-sm text-muted">{copy.evidence.noText}</p>
            )}
          </section>
          <section aria-label={copy.evidence.criteriaPane} className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-muted">{copy.evidence.criteriaPane}</h3>
            <ul className="flex flex-col gap-3">
              {list.map((s) => (
                <li key={s.criterionId}>
                  <EvidenceQuote score={s} active={s.criterionId === activeId} onSelect={() => setActiveId(s.criterionId)} />
                  {editingId === s.criterionId ? (
                    <OverrideForm
                      criterionId={s.criterionId}
                      initialScore={s.score}
                      saving={override.isPending}
                      onCancel={() => setEditingId(null)}
                      onSubmit={(input) => override.mutate({ criterionId: s.criterionId, input }, { onSuccess: () => setEditingId(null) })}
                    />
                  ) : (
                    <Button variant="ghost" size="sm" className="mt-1" onClick={() => setEditingId(s.criterionId)}>
                      {copy.evidence.override}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    );
  }

  const footer = (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => step(-1)} disabled={at <= 0} aria-label={copy.evidence.prev}>
          <ChevronLeft aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted tabular-nums">{at >= 0 ? copy.evidence.position(at + 1, siblingIds.length) : ''}</span>
        <Button variant="secondary" size="sm" onClick={() => step(1)} disabled={at === -1 || at >= siblingIds.length - 1} aria-label={copy.evidence.next}>
          <ChevronRight aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
        </Button>
      </div>
      <span className="text-xs text-muted">{copy.evidence.keysHint}</span>
      {c && jobId ? (
        <Link to={`/app/jobs/${jobId}/candidates/${c.id}`} onClick={close} className="inline-flex min-h-11 items-center gap-1 text-sm text-primary focus-visible:shadow-focus">
          {copy.evidence.openFull}
          <ExternalLink aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );

  return (
    <Drawer open={open} onClose={close} title={c ? `${copy.evidence.title}: ${nameOf(c)}` : copy.evidence.title} footer={footer} initialWidth={880} maxWidth={1100}>
      {body}
    </Drawer>
  );
}
