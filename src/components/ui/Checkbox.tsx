import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

/** Usage: <Checkbox label="I reviewed the evidence" checked={v} onChange={...} /> */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label
      htmlFor={inputId}
      className={cn('inline-flex min-h-11 cursor-pointer items-center gap-2 text-base', className)}
    >
      <span className="relative inline-flex h-5 w-5 shrink-0">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-sm border border-border bg-surface-1 transition-colors duration-fast checked:border-primary checked:bg-primary hover:border-muted focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50"
          {...rest}
        />
        <Check
          aria-hidden="true"
          strokeWidth={2}
          className="pointer-events-none absolute left-0.5 top-0.5 hidden h-4 w-4 text-primary-fg peer-checked:block"
        />
      </span>
      <span>{label}</span>
    </label>
  );
});
