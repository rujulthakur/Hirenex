import { CheckCircle2 } from 'lucide-react';
import { Badge, Button, Card, InlineAlert } from '@/components/ui';
import { copy } from '@/lib/copy';
import { errorCount } from '../../schemas';
import type { ErrorMap, WizardValues } from '../../schemas';

interface ReviewStepProps {
  values: WizardValues;
  /** Errors per field step (index = step 0 to 5). */
  stepErrors: ErrorMap[];
  onGoToStep: (step: number) => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-2 md:grid-cols-[12rem_1fr] md:gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-base">{children}</dd>
    </div>
  );
}

/** Step 7: error summary (when needed) plus a read-only summary of everything entered. */
export function ReviewStep({ values, stepErrors, onGoToStep }: ReviewStepProps) {
  const names = copy.jobs.wizard.stepNames;
  const problemSteps = stepErrors.map((m, i) => ({ step: i, count: errorCount(m), messages: Object.values(m) })).filter((s) => s.count > 0);
  const c = values.constraints;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {problemSteps.length > 0 ? (
        <InlineAlert tone="danger" title={copy.jobs.wizard.errorSummaryTitle}>
          <ul className="mt-2 flex flex-col gap-3">
            {problemSteps.map((s) => (
              <li key={s.step} className="flex flex-col gap-1">
                <Button variant="ghost" size="sm" className="self-start px-0 text-text underline" onClick={() => onGoToStep(s.step)}>
                  {copy.jobs.wizard.goToStep(names[s.step] ?? '')} ({copy.jobs.wizard.stepHasErrors(s.count)})
                </Button>
                <ul className="list-disc pl-5 text-sm">
                  {Array.from(new Set(s.messages)).map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </InlineAlert>
      ) : (
        <InlineAlert tone="success">
          <span className="flex items-center gap-2">
            <CheckCircle2 aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
            {copy.jobs.wizard.reviewReady}
          </span>
        </InlineAlert>
      )}

      <Card surface={1}>
        <dl className="divide-y divide-border">
          <Row label={copy.jobs.fields.title}>{values.title || '—'}</Row>
          <Row label={copy.jobs.fields.description}>
            <span className="whitespace-pre-wrap">{values.description || '—'}</span>
          </Row>
          <Row label={names[1] ?? ''}>
            <span className="flex flex-wrap gap-2">
              {values.skills.length === 0 ? '—' : null}
              {values.skills.map((s) => (
                <Badge key={s.name} tone={s.required ? 'primary' : 'neutral'}>
                  {s.name} ({s.required ? 'required' : 'preferred'})
                </Badge>
              ))}
            </span>
          </Row>
          <Row label={names[2] ?? ''}>
            <ul className="flex flex-col gap-1 tabular-nums">
              {values.criteria.map((cr) => (
                <li key={cr.id}>
                  {cr.name || '—'}: {Number.isFinite(cr.weight) ? cr.weight : 0}
                </li>
              ))}
            </ul>
          </Row>
          <Row label={names[3] ?? ''}>
            <span className="tabular-nums">
              {copy.jobs.capacityLine(values.capacity, values.waitlistSize)}, {values.durationMinutes} min
            </span>
          </Row>
          <Row label={names[4] ?? ''}>
            <span className="tabular-nums">
              {c.startDate} to {c.endDate}, {c.dailyStart} to {c.dailyEnd} ({c.timeZone}),{' '}
              {c.format === 'virtual' ? `${copy.jobs.fields.formatVirtual}: ${c.meetingLink || '—'}` : `${copy.jobs.fields.formatPhysical}: ${c.location || '—'}`}
              {c.breaks.length > 0 ? `, breaks ${c.breaks.map((b) => `${b.from} to ${b.to}`).join(', ')}` : ''}
            </span>
          </Row>
          <Row label={names[5] ?? ''}>
            <ul className="flex flex-col gap-1">
              {values.interviewers.length === 0 ? '—' : null}
              {values.interviewers.map((iv) => (
                <li key={iv.id}>
                  {iv.name || '—'} ({iv.timeZone}), {iv.windows.length} window{iv.windows.length === 1 ? '' : 's'}
                </li>
              ))}
            </ul>
          </Row>
        </dl>
      </Card>
    </div>
  );
}
