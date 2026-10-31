import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Usage: <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> */
export function Kbd({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'inline-flex min-w-5 items-center justify-center rounded-sm border border-border bg-surface-2 px-1 font-mono text-xs text-muted',
        className,
      )}
      {...rest}
    />
  );
}
