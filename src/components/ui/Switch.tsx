import { cn } from '@/lib/cn';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  id?: string;
}

/** Usage: <Switch label="Blind mode" checked={on} onCheckedChange={setOn} /> */
export function Switch({ checked, onCheckedChange, label, disabled = false, id }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border transition-colors duration-fast ease-standard focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-surface-2',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-text transition-transform duration-fast ease-standard',
          checked ? 'translate-x-5 bg-primary-fg' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}
