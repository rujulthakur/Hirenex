import { Plus, Trash2 } from 'lucide-react';
import { Button, DateRangePicker, Field, Input, Select, TimeRangeInput } from '@/components/ui';
import { copy } from '@/lib/copy';
import type { WizardBreak, WizardConstraints } from '../../schemas';
import { fieldError } from './types';
import type { StepProps } from './types';

const FORMAT_OPTIONS = [
  { value: 'virtual', label: copy.jobs.fields.formatVirtual },
  { value: 'physical', label: copy.jobs.fields.formatPhysical },
];

function FieldMessage({ text }: { text: string | undefined }) {
  return text ? (
    <p role="alert" className="text-xs text-danger">
      {text}
    </p>
  ) : null;
}

/** Step 5: dates, daily hours, breaks, time zone and meeting format. */
export function ConstraintsStep(props: StepProps) {
  const { form } = props;
  const c = form.watch('constraints');
  const patch = (next: Partial<WizardConstraints>) =>
    form.setValue('constraints', { ...c, ...next }, { shouldDirty: true });

  const setBreak = (index: number, next: Partial<WizardBreak>) =>
    patch({ breaks: c.breaks.map((b, i) => (i === index ? { ...b, ...next } : b)) });
  const addBreak = () => patch({ breaks: [...c.breaks, { from: '12:00', to: '12:30' }] });
  const removeBreak = (index: number) => patch({ breaks: c.breaks.filter((_, i) => i !== index) });

  const zoneError = fieldError(props, 'constraints.timeZone');
  const linkError = fieldError(props, 'constraints.meetingLink');
  const locationError = fieldError(props, 'constraints.location');

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <DateRangePicker value={{ from: c.startDate, to: c.endDate }} onChange={(r) => patch({ startDate: r.from, endDate: r.to })} />
        <FieldMessage text={fieldError(props, 'constraints.startDate') ?? fieldError(props, 'constraints.endDate')} />
      </div>

      <div className="flex flex-col gap-1">
        <TimeRangeInput
          label={copy.jobs.fields.dailyHours}
          value={{ start: c.dailyStart, end: c.dailyEnd }}
          onChange={(r) => patch({ dailyStart: r.start, dailyEnd: r.end })}
        />
        <FieldMessage text={fieldError(props, 'constraints.dailyStart') ?? fieldError(props, 'constraints.dailyEnd')} />
      </div>

      <Field id="job-zone" label={copy.jobs.fields.timeZone} hint={copy.jobs.fields.timeZoneHint} error={zoneError}>
        <Input
          id="job-zone"
          value={c.timeZone}
          invalid={!!zoneError}
          aria-describedby={zoneError ? 'job-zone-error' : 'job-zone-hint'}
          onChange={(e) => patch({ timeZone: e.target.value })}
          className="max-w-xs"
        />
      </Field>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium text-text">{copy.jobs.fields.breaks}</legend>
        {c.breaks.map((b, i) => {
          const breakError = fieldError(props, `constraints.breaks.${i}.from`) ?? fieldError(props, `constraints.breaks.${i}.to`);
          return (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-end gap-3">
                <Field id={`break-${i}-from`} label={copy.jobs.fields.breakFrom}>
                  <Input id={`break-${i}-from`} type="time" value={b.from} onChange={(e) => setBreak(i, { from: e.target.value })} className="w-auto" />
                </Field>
                <Field id={`break-${i}-to`} label={copy.jobs.fields.breakTo}>
                  <Input id={`break-${i}-to`} type="time" value={b.to} onChange={(e) => setBreak(i, { to: e.target.value })} className="w-auto" />
                </Field>
                <Button variant="icon" aria-label={copy.jobs.fields.removeBreak(i + 1)} onClick={() => removeBreak(i)}>
                  <Trash2 aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
                </Button>
              </div>
              <FieldMessage text={breakError} />
            </div>
          );
        })}
        <div>
          <Button variant="outline" onClick={addBreak}>
            <Plus aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
            {copy.jobs.fields.addBreak}
          </Button>
        </div>
      </fieldset>

      <Field id="job-format" label={copy.jobs.fields.format}>
        <Select
          id="job-format"
          options={FORMAT_OPTIONS}
          value={c.format}
          onChange={(e) => patch({ format: e.target.value === 'physical' ? 'physical' : 'virtual' })}
          className="max-w-xs"
        />
      </Field>

      {c.format === 'virtual' ? (
        <Field id="job-link" label={copy.jobs.fields.meetingLink} hint={copy.jobs.fields.meetingLinkHint} error={linkError}>
          <Input
            id="job-link"
            type="url"
            inputMode="url"
            placeholder="https://"
            value={c.meetingLink}
            invalid={!!linkError}
            aria-describedby={linkError ? 'job-link-error' : 'job-link-hint'}
            onChange={(e) => patch({ meetingLink: e.target.value })}
          />
        </Field>
      ) : (
        <Field id="job-location" label={copy.jobs.fields.location} hint={copy.jobs.fields.locationHint} error={locationError}>
          <Input
            id="job-location"
            value={c.location}
            invalid={!!locationError}
            aria-describedby={locationError ? 'job-location-error' : 'job-location-hint'}
            onChange={(e) => patch({ location: e.target.value })}
          />
        </Field>
      )}
    </div>
  );
}
