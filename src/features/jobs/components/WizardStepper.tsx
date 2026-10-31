import { AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { copy } from '@/lib/copy';

interface WizardStepperProps {
  current: number;
  /** Problems per step (index = step). Only shown for steps that were visited. */
  errorCounts: number[];
  visited: boolean[];
  onSelect: (step: number) => void;
}

/** Persistent stepper with error badges. Usage: <WizardStepper current={2} errorCounts={[0,0,1,0,0,0,0]} visited={v} onSelect={go} /> */
export function WizardStepper({ current, errorCounts, visited, onSelect }: WizardStepperProps) {
  const names = copy.jobs.wizard.stepNames;
  return (
    <nav aria-label={copy.jobs.wizard.stepperLabel} className="overflow-x-auto">
      <ol className="flex min-w-max gap-2 md:min-w-0 md:flex-wrap">
        {names.map((name, i) => {
          const problems = visited[i] ? (errorCounts[i] ?? 0) : 0;
          const isCurrent = i === current;
          const isDone = visited[i] && problems === 0 && i < current;
          return (
            <li key={name}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-2 rounded-md border px-3 text-base transition-colors duration-fast ease-standard focus-visible:shadow-focus',
                  isCurrent ? 'border-primary bg-surface-2 text-text' : 'border-border bg-surface-1 text-muted hover:text-text',
                  problems > 0 && !isCurrent && 'border-danger',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border text-xs tabular-nums',
                    isCurrent ? 'border-primary text-primary' : 'border-border',
                    isDone && 'border-success text-success',
                  )}
                >
                  {isDone ? <Check strokeWidth={1.5} className="h-3 w-3" /> : i + 1}
                </span>
                <span>{name}</span>
                {problems > 0 ? (
                  <span className="flex items-center gap-1 text-xs text-danger">
                    <AlertCircle aria-hidden="true" strokeWidth={1.5} className="h-3.5 w-3.5" />
                    <span>{copy.jobs.wizard.stepHasErrors(problems)}</span>
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
