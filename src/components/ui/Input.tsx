import { forwardRef } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const fieldBase =
  'w-full rounded-md border bg-surface-1 px-3 text-base text-text placeholder:text-muted transition-colors duration-fast ease-standard hover:border-muted focus-visible:border-primary focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50 read-only:bg-surface-2';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

/** Usage: <Input id="x" invalid={!!err} aria-describedby="x-error" /> */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(fieldBase, 'h-10', invalid ? 'border-danger' : 'border-border', className)}
      {...rest}
    />
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

/** Usage: <Textarea id="jd" rows={4} /> */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, className, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(fieldBase, 'min-h-20 py-2', invalid ? 'border-danger' : 'border-border', className)}
      {...rest}
    />
  );
});
