import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
  invalid?: boolean;
}

/**
 * Native-styled select: chosen because the OS picker gives free keyboard, screen-reader and
 * mobile support. Usage: <Select id="s" options={[{ value: 'a', label: 'A' }]} />
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, invalid = false, className, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'h-10 w-full appearance-none rounded-md border bg-surface-1 pl-3 pr-10 text-base text-text transition-colors duration-fast ease-standard hover:border-muted focus-visible:border-primary focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50',
          invalid ? 'border-danger' : 'border-border',
          className,
        )}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        strokeWidth={1.5}
        className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted"
      />
    </div>
  );
});
