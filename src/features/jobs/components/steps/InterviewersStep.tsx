import { Plus, Trash2 } from 'lucide-react';
import { Button, Card, Field, InlineAlert, Input } from '@/components/ui';
import { copy } from '@/lib/copy';
import { newLocalId } from '../../schemas';
import type { WizardConstraints, WizardInterviewer, WizardWindow } from '../../schemas';
import { fieldError } from './types';
import type { StepProps } from './types';

/** A blank window pre-filled from the job's scheduling constraints. */
export function blankWindow(c: WizardConstraints): WizardWindow {
  return { id: newLocalId('win'), date: c.startDate, from: c.dailyStart, to: c.dailyEnd };
}

/** A blank interviewer pre-filled from the job's scheduling constraints. */
export function blankInterviewer(c: WizardConstraints): WizardInterviewer {
  return { id: newLocalId('iv'), name: '', email: '', timeZone: c.timeZone, windows: [blankWindow(c)] };
}

/** Step 6: at least 3 interviewers, each with a time zone and availability windows. */
export function InterviewersStep(props: StepProps) {
  const { form } = props;
  const interviewers = form.watch('interviewers');
  const constraints = form.watch('constraints');

  const commit = (next: WizardInterviewer[]) => form.setValue('interviewers', next, { shouldDirty: true });
  const update = (index: number, patch: Partial<WizardInterviewer>) =>
    commit(interviewers.map((iv, i) => (i === index ? { ...iv, ...patch } : iv)));
  const updateWindow = (index: number, wIndex: number, patch: Partial<WizardWindow>) =>
    update(index, { windows: interviewers[index]?.windows.map((w, j) => (j === wIndex ? { ...w, ...patch } : w)) ?? [] });

  const listError = fieldError(props, 'interviewers');

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <p className="text-base text-muted">{copy.jobs.fields.interviewersIntro}</p>

      {interviewers.map((iv, i) => {
        const nameError = fieldError(props, `interviewers.${i}.name`);
        const emailError = fieldError(props, `interviewers.${i}.email`);
        const zoneError = fieldError(props, `interviewers.${i}.timeZone`);
        const windowsError = fieldError(props, `interviewers.${i}.windows`);
        const heading = iv.name.trim() || copy.jobs.fields.interviewerLabel(i + 1);
        return (
          <Card key={iv.id} surface={1} role="group" aria-label={copy.jobs.fields.interviewerLabel(i + 1)} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-medium">{heading}</h3>
              <Button variant="icon" aria-label={copy.jobs.fields.removeInterviewer(heading)} onClick={() => commit(interviewers.filter((_, k) => k !== i))}>
                <Trash2 aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field id={`iv-${iv.id}-name`} label={copy.jobs.fields.interviewerName} error={nameError}>
                <Input id={`iv-${iv.id}-name`} value={iv.name} invalid={!!nameError} aria-describedby={nameError ? `iv-${iv.id}-name-error` : undefined} onChange={(e) => update(i, { name: e.target.value })} />
              </Field>
              <Field id={`iv-${iv.id}-email`} label={copy.jobs.fields.interviewerEmail} error={emailError}>
                <Input id={`iv-${iv.id}-email`} type="email" inputMode="email" value={iv.email} invalid={!!emailError} aria-describedby={emailError ? `iv-${iv.id}-email-error` : undefined} onChange={(e) => update(i, { email: e.target.value })} />
              </Field>
              <Field id={`iv-${iv.id}-zone`} label={copy.jobs.fields.interviewerZone} error={zoneError}>
                <Input id={`iv-${iv.id}-zone`} value={iv.timeZone} invalid={!!zoneError} aria-describedby={zoneError ? `iv-${iv.id}-zone-error` : undefined} onChange={(e) => update(i, { timeZone: e.target.value })} />
              </Field>
            </div>

            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 text-sm font-medium text-text">{copy.jobs.fields.windows}</legend>
              {iv.windows.map((w, j) => {
                const dateError = fieldError(props, `interviewers.${i}.windows.${j}.date`);
                const fromError = fieldError(props, `interviewers.${i}.windows.${j}.from`);
                const toError = fieldError(props, `interviewers.${i}.windows.${j}.to`);
                const rowError = dateError ?? fromError ?? toError;
                return (
                  <div key={w.id} className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-end gap-3">
                      <Field id={`win-${w.id}-date`} label={copy.jobs.fields.windowDate}>
                        <Input id={`win-${w.id}-date`} type="date" value={w.date} invalid={!!dateError} onChange={(e) => updateWindow(i, j, { date: e.target.value })} className="w-auto" />
                      </Field>
                      <Field id={`win-${w.id}-from`} label={copy.jobs.fields.windowFrom}>
                        <Input id={`win-${w.id}-from`} type="time" value={w.from} invalid={!!fromError} onChange={(e) => updateWindow(i, j, { from: e.target.value })} className="w-auto" />
                      </Field>
                      <Field id={`win-${w.id}-to`} label={copy.jobs.fields.windowTo}>
                        <Input id={`win-${w.id}-to`} type="time" value={w.to} invalid={!!toError} onChange={(e) => updateWindow(i, j, { to: e.target.value })} className="w-auto" />
                      </Field>
                      <Button variant="icon" aria-label={copy.jobs.fields.removeWindow(j + 1)} onClick={() => update(i, { windows: iv.windows.filter((_, k) => k !== j) })}>
                        <Trash2 aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
                      </Button>
                    </div>
                    {rowError ? (
                      <p role="alert" className="text-xs text-danger">
                        {rowError}
                      </p>
                    ) : null}
                  </div>
                );
              })}
              {windowsError ? (
                <p role="alert" className="text-xs text-danger">
                  {windowsError}
                </p>
              ) : null}
              <div>
                <Button variant="outline" size="sm" onClick={() => update(i, { windows: [...iv.windows, blankWindow(constraints)] })}>
                  <Plus aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
                  {copy.jobs.fields.addWindow}
                </Button>
              </div>
            </fieldset>
          </Card>
        );
      })}

      <div>
        <Button variant="outline" onClick={() => commit([...interviewers, blankInterviewer(constraints)])}>
          <Plus aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
          {copy.jobs.fields.addInterviewer}
        </Button>
      </div>

      {listError ? <InlineAlert tone="danger">{listError}</InlineAlert> : null}
    </div>
  );
}
