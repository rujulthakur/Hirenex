import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  surface?: 1 | 2;
  interactive?: boolean;
}

/** Usage: <Card surface={1} interactive tabIndex={0}>...</Card>. Interactive adds hover + focus styles. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { surface = 1, interactive = false, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-border p-4',
        surface === 1 ? 'bg-surface-1' : 'bg-surface-2',
        interactive &&
          'cursor-pointer transition-colors duration-fast ease-standard hover:border-muted focus-visible:shadow-focus',
        className,
      )}
      {...rest}
    />
  );
});
