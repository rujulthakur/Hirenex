import { useMemo, useState } from 'react';
import { EmptyState, Button, Textarea, Field } from '@/components/ui';
import { HighlightedText, StageBadge } from '@/components/domain';
import { copy } from '@/lib/copy';
import { formatInZone } from '@/lib/time';
import type { Candidate, CriterionScore } from '@/types';
import { buildProbeQuestions, buildTimeline } from '../candidateDetailModel';

interface ResumeTabProps {
  candidate: Candidate;
  scores: CriterionScore[];
  activeId: string | null;
}

/** Redacted resume text with quote highlights and a toggle that reveals hidden text. */
export function ResumeTab({ candidate, scores, activeId }: ResumeTabProps) {
  const [showHidden, setShowHidden] = useState(false);
  const ranges = useMemo(
    () => scores.filter((s) => s.verified && s.location).map((s) => ({ id: s.criterionId, start: s.location?.start ?? 0, end: s.location?.end ?? 0 })),
    [scores],
  );
  const findings = candidate.hiddenFindings ?? [];
  if (!candidate.redactedText) return <EmptyState title={copy.candidates.detail.resumeEmpty} />;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{copy.candidates.detail.resumeNote}</p>
      {findings.length === 0 ? (
        <p className="text-sm text-muted">{copy.candidates.detail.hiddenNone}</p>
      ) : (
        <label className="flex min-h-11 items-center gap-2 text-base">
          <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} className="h-4 w-4" />
          {copy.candidates.detail.showHidden}
        </label>
      )}
      <div className="rounded-md border border-border bg-surface-1 p-4">
        <HighlightedText text={candidate.redactedText} ranges={ranges} activeId={activeId} hiddenFindings={findings} showHidden={showHidden} />
      </div>
    </div>
  );
}

export function ProbeTab({ scores }: { scores: CriterionScore[] }) {
  const questions = buildProbeQuestions(scores);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-base text-muted">{copy.candidates.detail.probeIntro}</p>
      {questions.length === 0 ? (
        <p className="text-base">{copy.candidates.detail.probeNone}</p>
      ) : (
        <ol className="flex list-decimal flex-col gap-3 pl-5 text-base">
          {questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function TimelineTab({ candidate }: { candidate: Candidate }) {
  const steps = buildTimeline(candidate);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-base text-muted">{copy.candidates.detail.timelineIntro}</p>
      <p className="text-sm text-muted">
        {copy.candidates.detail.timelineUploaded}: <span className="tabular-nums">{formatInZone(candidate.createdAt)}</span>
      </p>
      <ol className="flex flex-col gap-2">
        {steps.map((s) => (
          <li key={s.stage} aria-current={s.state === 'current' ? 'step' : undefined} className="flex items-center gap-3">
            <StageBadge stage={s.stage} />
            <span className="text-sm text-muted">
              {s.state === 'reached' ? copy.candidates.detail.timelineReached : s.state === 'current' ? copy.candidates.detail.timelineCurrent : copy.candidates.detail.timelineNotReached}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

interface NotesTabProps {
  initial: string;
  saving: boolean;
  onSave: (notes: string) => void;
}

export function NotesTab({ initial, saving, onSave }: NotesTabProps) {
  const [value, setValue] = useState(initial);
  const dirty = value !== initial;
  return (
    <div className="flex flex-col gap-3">
      <Field id="candidate-notes" label={copy.candidates.detail.notesLabel} hint={dirty ? copy.candidates.detail.notesUnsaved : undefined}>
        <Textarea id="candidate-notes" rows={6} value={value} placeholder={copy.candidates.detail.notesPlaceholder} onChange={(e) => setValue(e.target.value)} />
      </Field>
      <div>
        <Button onClick={() => onSave(value)} disabled={!dirty || saving} loading={saving}>
          {copy.candidates.detail.notesSave}
        </Button>
      </div>
    </div>
  );
}
