import { cn } from '@/lib/cn';

interface ProgressBarProps {
  value: number;
  max?: number;
  label: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const toneClass = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
} as const;

/** Usage: <ProgressBar label="Scored" value={12} max={20} />. Exposes progressbar semantics. */
export function ProgressBar({ value, max = 100, label, tone = 'primary', className }: ProgressBarProps) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-2', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-base ease-standard', toneClass[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
