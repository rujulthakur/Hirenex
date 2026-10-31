import { InlineAlert, TagInput } from '@/components/ui';
import { copy } from '@/lib/copy';
import { fieldError } from './types';
import type { StepProps } from './types';

/** Step 2: required and preferred skills. */
export function SkillsStep(props: StepProps) {
  const { form } = props;
  const skills = form.watch('skills');
  const error = fieldError(props, 'skills');
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <p className="text-base text-muted">{copy.jobs.fields.skillsIntro}</p>
      <TagInput
        value={skills}
        onChange={(next) => form.setValue('skills', next, { shouldDirty: true })}
      />
      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
    </div>
  );
}
