import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

/** Usage: <Field id="email" label="Email" error={err}><Input id="email" invalid /></Field> */
export function Field({ id, label, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
