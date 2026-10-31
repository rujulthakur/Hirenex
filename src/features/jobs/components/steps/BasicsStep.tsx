import { Field, Input, Textarea } from '@/components/ui';
import { copy } from '@/lib/copy';
import { fieldError } from './types';
import type { StepProps } from './types';

/** Step 1: job title and description. */
export function BasicsStep(props: StepProps) {
  const { register } = props.form;
  const titleError = fieldError(props, 'title');
  const descError = fieldError(props, 'description');
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <Field id="job-title" label={copy.jobs.fields.title} error={titleError}>
        <Input
          id="job-title"
          autoFocus
          placeholder={copy.jobs.fields.titlePlaceholder}
          invalid={!!titleError}
          aria-describedby={titleError ? 'job-title-error' : undefined}
          {...register('title')}
        />
      </Field>
      <Field id="job-description" label={copy.jobs.fields.description} hint={copy.jobs.fields.descriptionHint} error={descError}>
        <Textarea
          id="job-description"
          rows={8}
          invalid={!!descError}
          aria-describedby={descError ? 'job-description-error' : 'job-description-hint'}
          {...register('description')}
        />
      </Field>
    </div>
  );
}
