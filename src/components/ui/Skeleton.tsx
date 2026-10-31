import { cn } from '@/lib/cn';

interface SkeletonProps {
  variant?: 'text' | 'card' | 'row' | 'chart';
  lines?: number;
  className?: string;
}

const pulse = 'animate-pulse rounded-md bg-surface-2';

/** Usage: <Skeleton variant="card" />. Decorative; wrapper announces loading via aria-busy. */
export function Skeleton({ variant = 'text', lines = 3, className }: SkeletonProps) {
  if (variant === 'text') {
    return (
      <div aria-hidden="true" className={cn('flex flex-col gap-2', className)}>
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className={cn(pulse, 'h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
        ))}
      </div>
    );
  }
  if (variant === 'row') {
    return (
      <div aria-hidden="true" className={cn('flex items-center gap-3 py-2', className)}>
        <div className={cn(pulse, 'h-8 w-8 rounded-full')} />
        <div className={cn(pulse, 'h-3 flex-1')} />
        <div className={cn(pulse, 'h-3 w-16')} />
      </div>
    );
  }
  if (variant === 'chart') {
    return (
      <div aria-hidden="true" className={cn('flex h-40 items-end gap-2', className)}>
        {[40, 70, 55, 90, 65, 80].map((h, i) => (
          <div key={i} className={cn(pulse, 'flex-1')} style={{ height: `${h}%` }} />
        ))}
      </div>
    );
  }
  return (
    <div aria-hidden="true" className={cn('rounded-lg border border-border bg-surface-1 p-4', className)}>
      <div className={cn(pulse, 'mb-3 h-4 w-1/3')} />
      <Skeleton variant="text" lines={3} />
    </div>
  );
}
