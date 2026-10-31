import { cn } from '@/lib/cn';
import { copy } from '@/lib/copy';

interface SpinnerProps {
  size?: 'sm' | 'md';
  className?: string;
}

/** Usage: <Spinner size="sm" />. Static ring when reduced motion is on (CSS handles it). */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={copy.common.loading}
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-border border-t-primary',
        size === 'sm' ? 'h-4 w-4' : 'h-6 w-6',
        className,
      )}
    />
  );
}
