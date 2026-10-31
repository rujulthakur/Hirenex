import { useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useDismiss } from './overlayHooks';

export interface PopoverTriggerProps {
  onClick: () => void;
  'aria-expanded': boolean;
  'aria-haspopup': 'dialog';
  'aria-controls': string;
}

export interface PopoverProps {
  trigger: (props: PopoverTriggerProps) => ReactNode;
  label: string;
  children: ReactNode;
  align?: 'start' | 'end';
  className?: string;
}

/** Usage: <Popover label="Details" trigger={(p) => <Button {...p}>Open</Button>}>content</Popover>. ESC and outside click close. */
export function Popover({ trigger, label, children, align = 'start', className }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const close = () => {
    setOpen(false);
    wrapRef.current?.querySelector<HTMLElement>('button')?.focus();
  };
  useDismiss(wrapRef, open, close);
  return (
    <div ref={wrapRef} className="relative inline-block">
      {trigger({
        onClick: () => setOpen((o) => !o),
        'aria-expanded': open,
        'aria-haspopup': 'dialog',
        'aria-controls': id,
      })}
      {open ? (
        <div
          id={id}
          role="dialog"
          aria-label={label}
          className={cn(
            'absolute top-full z-40 mt-2 min-w-48 rounded-md border border-border bg-surface-2 p-3 shadow-md',
            align === 'end' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
