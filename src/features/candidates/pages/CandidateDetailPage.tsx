import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Trash2, Scale } from 'lucide-react';
import { Button, ConfirmDialog, ErrorState, Skeleton, Tabs } from '@/components/ui';
import type { TabItem } from '@/components/ui';
import { SwapTestCard } from '@/components/domain';
import { copy } from '@/lib/copy';
import { DecisionBar } from '@/features/hiring/components/DecisionBar';
import { CandidateHeader } from '../components/CandidateHeader';
import { EvidenceTab } from '../components/EvidenceTab';
import { NotesTab, ProbeTab, ResumeTab, TimelineTab } from '../components/DetailTabs';
import { useCandidate, useCandidateScores, useDeleteCandidate, useSaveNotes, useSwapTest } from '../hooks/useCandidates';
import { parseTab } from '../candidateDetailModel';
import type { DetailTab } from '../candidateDetailModel';

/** /app/jobs/:jobId/candidates/:candidateId. The active tab lives in the URL (?tab=) so it can be shared. */
export default function CandidateDetailPage() {
  const { jobId = '', candidateId = '' } = useParams<{ jobId: string; candidateId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseTab(searchParams.get('tab'));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const candidate = useCandidate(candidateId);
  const scores = useCandidateScores(candidateId);
  const saveNotes = useSaveNotes(candidateId, jobId);
  const remove = useDeleteCandidate(jobId);
  const swap = useSwapTest(candidateId);

  if (candidate.isLoading) {
    return (
      <section aria-busy="true" aria-label={copy.common.loading} className="flex flex-col gap-4 p-4 md:p-6">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </section>
    );
  }
  if (candidate.isError || !candidate.data) {
    return (
      <section className="p-4 md:p-6">
        <ErrorState message={copy.candidates.detail.loadFailed} onRetry={() => void candidate.refetch()} />
      </section>
    );
  }
  const c = candidate.data;
  const scoreList = scores.data ?? [];

  const onSelect = (id: string): void => {
    setActiveId(id);
    setSearchParams({ tab: 'resume' });
  };

  const items: TabItem[] = [
    {
      id: 'evidence',
      label: copy.candidates.detail.tabEvidence,
      panel: <EvidenceTab scores={scores.data} isLoading={scores.isLoading} isError={scores.isError} onRetry={() => void scores.refetch()} activeId={activeId} onSelect={onSelect} />,
    },
    { id: 'resume', label: copy.candidates.detail.tabResume, panel: <ResumeTab candidate={c} scores={scoreList} activeId={activeId} /> },
    { id: 'probe', label: copy.candidates.detail.tabProbe, panel: <ProbeTab scores={scoreList} /> },
    { id: 'timeline', label: copy.candidates.detail.tabTimeline, panel: <TimelineTab candidate={c} /> },
    { id: 'notes', label: copy.candidates.detail.tabNotes, panel: <NotesTab initial={c.notes ?? ''} saving={saveNotes.isPending} onSave={(n) => saveNotes.mutate(n)} /> },
  ];

  return (
    <section className="flex flex-col gap-6 p-4 md:p-6">
      <CandidateHeader
        candidate={c}
        jobId={jobId}
        actions={
          <>
            <DecisionBar candidate={c} jobId={jobId} variant="inline" />
            <Button variant="secondary" onClick={() => swap.mutate()} loading={swap.isPending}>
              <Scale aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
              {swap.isPending ? copy.candidates.detail.swapRunning : copy.candidates.detail.swapRun}
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
              {copy.candidates.detail.deleteAction}
            </Button>
          </>
        }
      />
      {swap.data ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-md font-semibold">{copy.candidates.detail.swapTitle}</h2>
          <p className="text-sm text-muted">{copy.candidates.detail.swapIntro}</p>
          <SwapTestCard result={swap.data} />
        </div>
      ) : null}
      <Tabs label={copy.candidates.detail.tabsLabel} items={items} value={tab} onValueChange={(id) => setSearchParams({ tab: id as DetailTab })} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={copy.candidates.detail.deleteTitle}
        description={copy.candidates.detail.deleteBody}
        confirmLabel={copy.candidates.detail.deleteConfirm}
        tone="danger"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(candidateId, { onSuccess: () => navigate(`/app/jobs/${jobId}/candidates`) })}
      />
      <DecisionBar candidate={c} jobId={jobId} variant="sticky" />
    </section>
  );
}
