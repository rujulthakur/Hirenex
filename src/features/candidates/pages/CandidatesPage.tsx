import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Hourglass, Layers, Search, Send, Upload, UserX } from 'lucide-react';
import { Button, ConfirmDialog, EmptyState, ErrorState, Input, Select, Skeleton } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services';
import { qk } from '@/services/queryKeys';
import { SendInvitesDialog } from '@/features/meetings/components/SendInvitesDialog';
import type { Candidate } from '@/types';
import { useDecideCandidate } from '@/features/hiring/hooks/useHiring';
import { OpeningSelect } from '@/features/jobs/components/OpeningSelect';
import { ResultsList } from '../components/ResultsList';
import { ScoreForOpeningDialog } from '../components/ScoreForOpeningDialog';

const SCORE_OPTIONS = [
  { value: '0', label: 'Any score' },
  { value: '80', label: '80 and above' },
  { value: '70', label: '70 and above' },
  { value: '60', label: '60 and above' },
  { value: '50', label: '50 and above' },
];
const STATUS_OPTIONS = [
  { value: 'all', label: 'All candidates' },
  { value: 'pending', label: 'Not invited yet' },
  { value: 'invited', label: 'Interview scheduled' },
];

const pct = (c: Candidate): number => (c.totalScore === null ? -1 : c.totalScore <= 1 ? c.totalScore * 100 : c.totalScore);
const isInvited = (c: Candidate): boolean => c.stage === 'invited' || c.stage === 'confirmed';

/** /app/jobs/:jobId/candidates: simple ranked list with search, score and status filters, and one-click interview invites. */
export default function CandidatesPage() {
  const { jobId = '' } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [history, setHistory] = useState(false);
  const decide = useDecideCandidate(jobId);
  const [bulk, setBulk] = useState<'hold' | 'reject' | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const query = { sort: '-totalScore', limit: 100, page: 1, ...(history ? { history: '1' } : {}) };
  const list = useQuery({
    queryKey: qk.candidates.list(jobId, query),
    queryFn: () => api.candidates.list(jobId, query),
    enabled: jobId !== '',
  });
  const [q, setQ] = useState('');
  const [minScore, setMinScore] = useState('0');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState(false);
  const [moveDialog, setMoveDialog] = useState(false);

  // Ticks belong to one opening: switching opening starts clean.
  useEffect(() => {
    setSelected(new Set());
    setQ('');
    setMinScore('0');
    setStatus('all');
  }, [jobId]);

  const all = list.data?.items ?? [];
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((c) => {
      if (needle && !`${c.displayName} ${c.profile?.email ?? ''} ${c.blindLabel}`.toLowerCase().includes(needle)) return false;
      if (Number(minScore) > 0 && pct(c) < Number(minScore)) return false;
      if (status === 'pending' && isInvited(c)) return false;
      if (status === 'invited' && !isInvited(c)) return false;
      return true;
    });
  }, [all, q, minScore, status]);

  const selectable = shown.filter((c) => !isInvited(c));
  const picked = [...selected].filter((id) => all.some((c) => c.id === id && !isInvited(c) && c.stage !== 'rejected'));
  const DECIDABLE = ['applied', 'scored', 'shortlisted', 'waitlisted', 'on_hold'];
  const holdable = [...selected].filter((id) => all.some((c) => c.id === id && DECIDABLE.includes(c.stage) && c.stage !== 'on_hold'));
  const rejectable = [...selected].filter((id) => all.some((c) => c.id === id && DECIDABLE.includes(c.stage)));
  const runBulk = async (action: 'hold' | 'reject'): Promise<void> => {
    setBulkBusy(true);
    const ids = action === 'hold' ? holdable : rejectable;
    for (const id of ids) {
      try { await decide.mutateAsync({ id, action }); } catch { /* the hook already shows the error */ }
    }
    setBulkBusy(false);
    setBulk(null);
    setSelected(new Set());
  };
  const ticked = [...selected].filter((id) => all.some((c) => c.id === id));
  const allPicked = selectable.length > 0 && selectable.every((c) => selected.has(c.id));
  const toggle = (id: string) => setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSelected((prev) => { const n = new Set(prev); for (const c of selectable) { if (allPicked) n.delete(c.id); else n.add(c.id); } return n; });
  const filtered = q !== '' || minScore !== '0' || status !== 'all';

  let body;
  if (list.isLoading) {
    body = <div aria-busy="true" className="flex flex-col gap-2">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} variant="row" />)}</div>;
  } else if (list.isError) {
    body = <ErrorState message="Could not load candidates." onRetry={() => void list.refetch()} />;
  } else if (all.length === 0) {
    body = (
      <EmptyState
        title="No candidates yet"
        description="Upload resumes and they will appear here, ranked by score."
        action={<Link to="/app" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 font-medium text-primary-fg"><Upload size={16} aria-hidden="true" />Upload resumes</Link>}
      />
    );
  } else if (shown.length === 0) {
    body = <EmptyState title="No matches" description="No candidate fits these filters." action={<Button variant="secondary" onClick={() => { setQ(''); setMinScore('0'); setStatus('all'); }}>Clear filters</Button>} />;
  } else {
    body = <ResultsList items={shown} jobId={jobId} selected={selected} onToggle={toggle} />;
  }

  return (
    <section className="flex flex-col gap-5 p-4 pb-28 md:p-6 md:pb-28">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Candidates</h1>
        <p className="text-base text-muted">Ranked by score for the opening below. Tick candidates to invite them, or to score them for another opening.</p>
        <div className="mt-2 max-w-md">
          <OpeningSelect label="Opening" value={jobId} onChange={(id) => navigate(`/app/jobs/${id}/candidates`)} />
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-[1fr_12rem_12rem]">
        <div className="relative">
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input aria-label="Search candidates" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select aria-label="Score filter" options={SCORE_OPTIONS} value={minScore} onChange={(e) => setMinScore(e.target.value)} />
        <Select aria-label="Status filter" options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
      </div>

      {all.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 accent-primary" checked={history} onChange={(e) => { setHistory(e.target.checked); setSelected(new Set()); }} />
            History (show saved and rejected)
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 accent-primary" checked={allPicked} onChange={toggleAll} disabled={selectable.length === 0} />
            Select all shown
          </label>
          <p aria-live="polite" className="tabular-nums">{filtered ? `${shown.length} of ${all.length}` : all.length} candidate{all.length === 1 ? '' : 's'}</p>
        </div>
      ) : null}

      {body}

      {ticked.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface-1/95 p-3 backdrop-blur md:left-60">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">{ticked.length} selected</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setSelected(new Set())}>Clear</Button>
              <Button variant="outline" onClick={() => setMoveDialog(true)}><Layers size={16} aria-hidden="true" />Score for another opening</Button>
              <Button variant="secondary" disabled={holdable.length === 0} onClick={() => setBulk('hold')}><Hourglass size={16} aria-hidden="true" />Save for later</Button>
              <Button variant="danger" disabled={rejectable.length === 0} onClick={() => setBulk('reject')}><UserX size={16} aria-hidden="true" />Reject</Button>
              <Button disabled={picked.length === 0} onClick={() => setDialog(true)}><Send size={16} aria-hidden="true" />Send interview invites</Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={bulk === 'hold'}
        onClose={() => setBulk(null)}
        title={`Save ${holdable.length} for later?`}
        description="They get a waiting-list email and stay on your dashboard for 7 days. After that they are rejected automatically and HR is notified. You can still find them in History."
        confirmLabel="Save and email"
        loading={bulkBusy}
        onConfirm={() => void runBulk('hold')}
      />
      <ConfirmDialog
        open={bulk === 'reject'}
        onClose={() => setBulk(null)}
        title={`Reject ${rejectable.length} candidate${rejectable.length === 1 ? '' : 's'}?`}
        description="They get a polite email. Rejected candidates leave the dashboard after 1 hour and stay in History."
        confirmLabel="Reject and email"
        tone="danger"
        loading={bulkBusy}
        onConfirm={() => void runBulk('reject')}
      />
      <ScoreForOpeningDialog open={moveDialog} onClose={() => setMoveDialog(false)} fromJobId={jobId} candidateIds={ticked} onDone={() => setSelected(new Set())} />
      <SendInvitesDialog open={dialog} onClose={() => setDialog(false)} jobId={jobId} candidateIds={picked} onSent={() => setSelected(new Set())} />
    </section>
  );
}
