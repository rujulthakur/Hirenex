import { Field, Input } from '@/components/ui';
import { copy } from '@/lib/copy';
import { fieldError } from './types';
import type { StepProps } from './types';

/** Step 4: shortlist size, waitlist size and interview length. */
export function CapacityStep(props: StepProps) {
  const { register } = props.form;
  const capError = fieldError(props, 'capacity');
  const waitError = fieldError(props, 'waitlistSize');
  const durError = fieldError(props, 'durationMinutes');
  return (
    <div className="grid max-w-2xl gap-5 md:grid-cols-3">
      <Field id="job-capacity" label={copy.jobs.fields.capacity} hint={copy.jobs.fields.capacityHint} error={capError}>
        <Input
          id="job-capacity"
          type="number"
          inputMode="numeric"
          min={1}
          max={100}
          invalid={!!capError}
          aria-describedby={capError ? 'job-capacity-error' : 'job-capacity-hint'}
          className="tabular-nums"
          {...register('capacity', { valueAsNumber: true })}
        />
      </Field>
      <Field id="job-waitlist" label={copy.jobs.fields.waitlistSize} hint={copy.jobs.fields.waitlistHint} error={waitError}>
        <Input
          id="job-waitlist"
          type="number"
          inputMode="numeric"
          min={0}
          max={100}
          invalid={!!waitError}
          aria-describedby={waitError ? 'job-waitlist-error' : 'job-waitlist-hint'}
          className="tabular-nums"
          {...register('waitlistSize', { valueAsNumber: true })}
        />
      </Field>
      <Field id="job-duration" label={copy.jobs.fields.duration} hint={copy.jobs.fields.durationHint} error={durError}>
        <Input
          id="job-duration"
          type="number"
          inputMode="numeric"
          min={15}
          max={180}
          step={5}
          invalid={!!durError}
          aria-describedby={durError ? 'job-duration-error' : 'job-duration-hint'}
          className="tabular-nums"
          {...register('durationMinutes', { valueAsNumber: true })}
        />
      </Field>
    </div>
  );
}
