import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

/** Usage: <Radio name="fmt" value="virtual" label="Virtual" checked={...} onChange={...} /> */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
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
      <input
        ref={ref}
        id={inputId}
        type="radio"
        className="h-5 w-5 cursor-pointer appearance-none rounded-full border border-border bg-surface-1 transition-colors duration-fast checked:border-primary checked:bg-primary checked:shadow-[inset_0_0_0_4px_var(--color-surface-1)] hover:border-muted focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50"
        {...rest}
      />
      <span>{label}</span>
    </label>
  );
});
