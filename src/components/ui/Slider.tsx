import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: number;
  onValueChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  showValue?: boolean;
}

/** Usage: <Slider label="Weight" value={30} onValueChange={setV} />. Native range = keyboard for free. */
export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  className,
  disabled,
  ...rest
}: SliderProps) {
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onValueChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, var(--color-primary) ${pct}%, var(--color-border) ${pct}%)`,
        }}
        className="h-1 w-full cursor-pointer appearance-none rounded-full focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-text [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-text"
        {...rest}
      />
      {showValue ? (
        <span className="w-10 text-right text-sm tabular-nums text-muted">{value}</span>
      ) : null}
    </div>
  );
}
