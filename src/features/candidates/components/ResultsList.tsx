import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ChevronDown, ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import { EvidenceQuote, FlagBadge } from '@/components/domain';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Candidate } from '@/types';
import { useCandidateName } from '../hooks/useCandidateName';
import { useCandidateScores } from '../hooks/useCandidates';

function Proof({ candidateId }: { candidateId: string }) {
  const q = useCandidateScores(candidateId);
  if (q.isLoading) return <div className="flex flex-col gap-2"><Skeleton variant="row" /><Skeleton variant="row" /></div>;
  if (q.isError || !q.data) return <p className="text-sm text-danger">Could not load the proof for this score.</p>;
  if (q.data.length === 0) return <p className="text-sm text-muted">No criteria were scored for this candidate.</p>;
  return (
    <div className="flex flex-col gap-3">
      {q.data.map((s) => <EvidenceQuote key={s.criterionId} score={s} />)}
    </div>
  );
}

function Detail({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-muted" />
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <div className="break-words text-sm">{children}</div>
      </div>
    </div>
  );
}

/** Contact details, skills and key points that were read from the resume. */
function CandidateDetails({ c }: { c: Candidate }) {
  const p = c.profile;
  if (!p) return <p className="text-sm text-muted">Details are not available for this resume.</p>;
  const dash = <span className="text-muted">Not found in resume</span>;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Detail icon={Mail} label="Email">{p.email ? <a className="text-primary hover:underline" href={`mailto:${p.email}`}>{p.email}</a> : dash}</Detail>
        <Detail icon={Phone} label="Phone">{p.phone ? <a className="hover:underline" href={`tel:${p.phone.replace(/[^\d+]/g, '')}`}>{p.phone}</a> : dash}</Detail>
        <Detail icon={MapPin} label="Location">{p.location || dash}</Detail>
      </div>
      {p.skills.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted">Skills</p>
          <ul className="flex flex-wrap gap-1.5">
            {p.skills.map((s) => <li key={s} className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs">{s}</li>)}
          </ul>
        </div>
      ) : null}
      {p.keyPoints.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted">Key points</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {p.keyPoints.map((k) => <li key={k}>{k}</li>)}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

interface ResultsListProps {
  items: Candidate[];
  jobId: string;
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
}

const scoreOf = (c: Candidate): number | null => (c.totalScore === null ? null : Math.round(c.totalScore <= 1 ? c.totalScore * 100 : c.totalScore));

/** One clean row per candidate: checkbox, name, candidate number, score out of 100. Opening a row shows the details. */
export function ResultsList({ items, jobId, selected, onToggle }: ResultsListProps) {
  const nameOf = useCandidateName();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ul className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface-1">
      {items.map((c) => {
        const open = openId === c.id;
        const score = scoreOf(c);
        const invited = c.stage === 'invited' || c.stage === 'confirmed';
        return (
          <li key={c.id} className="border-b border-border last:border-b-0">
            <div className={cn('flex items-center gap-3 px-4 py-3', open && 'bg-surface-2/50')}>
              <input
                type="checkbox"
                aria-label={`Select ${nameOf(c)}`}
                checked={selected.has(c.id)}
                disabled={invited}
                onChange={() => onToggle(c.id)}
                className="h-4 w-4 shrink-0 accent-primary disabled:opacity-40"
              />
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : c.id)}
                className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left focus-visible:shadow-focus"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-medium">{nameOf(c)}</span>
                  <span className="block truncate text-xs text-muted">{c.blindLabel}</span>
                </span>
                {invited ? (
                  <span className="hidden shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary sm:inline-flex">
                    <CalendarCheck size={12} aria-hidden="true" /> Invited
                  </span>
                ) : null}
                <span className="shrink-0 text-right tabular-nums">
                  <span className="text-lg font-semibold">{score === null ? '–' : score}</span>
                  {score !== null ? <span className="text-sm text-muted"> / 100</span> : null}
                </span>
                <ChevronDown size={18} aria-hidden="true" className={cn('shrink-0 text-muted transition-transform', open && 'rotate-180')} />
              </button>
            </div>
            {open ? (
              <div className="flex flex-col gap-5 border-t border-border bg-bg/40 p-4">
                <CandidateDetails c={c} />
                {c.flags.length > 0 ? <div className="flex flex-wrap gap-1">{c.flags.map((f) => <FlagBadge key={f} flag={f} />)}</div> : null}
                <details>
                  <summary className="cursor-pointer text-sm font-medium text-muted hover:text-text">Why this score</summary>
                  <div className="pt-3"><Proof candidateId={c.id} /></div>
                </details>
                <Link to={`/app/jobs/${jobId}/candidates/${c.id}`} className="inline-flex items-center gap-1 self-start text-sm font-medium text-primary hover:underline">
                  Full resume <ExternalLink size={14} aria-hidden="true" />
                </Link>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
