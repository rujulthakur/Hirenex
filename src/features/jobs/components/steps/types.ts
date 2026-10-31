import type { UseFormReturn } from 'react-hook-form';
import type { ErrorMap, WizardValues } from '../../schemas';

/** Props every wizard step receives. Errors are shown only after the person tried to leave the step (or visited it). */
export interface StepProps {
  form: UseFormReturn<WizardValues>;
  errors: ErrorMap;
  showErrors: boolean;
}

/** Returns the message for a field path, or undefined while errors are hidden. */
export function fieldError(props: Pick<StepProps, 'errors' | 'showErrors'>, path: string): string | undefined {
  return props.showErrors ? props.errors[path] : undefined;
}
