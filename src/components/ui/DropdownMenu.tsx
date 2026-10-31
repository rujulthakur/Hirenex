import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import { useDismiss } from './overlayHooks';

export interface MenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownMenuProps {
  triggerLabel: string;
  trigger?: ReactNode;
  items: MenuItem[];
  align?: 'start' | 'end';
}

/** Usage: <DropdownMenu triggerLabel="Actions" items={[{ id, label, onSelect }]} />. Arrow keys/Home/End rove focus. */
export function DropdownMenu({ triggerLabel, trigger, items, align = 'end' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();
  const enabledIdx = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };
  useDismiss(wrapRef, open, () => close(true));

  useEffect(() => {
    if (open && enabledIdx.length > 0) itemRefs.current[enabledIdx[0]]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const move = (current: number, dir: 1 | -1 | 'first' | 'last') => {
    if (enabledIdx.length === 0) return;
    const pos = enabledIdx.indexOf(current);
    let next: number;
    if (dir === 'first') next = enabledIdx[0];
    else if (dir === 'last') next = enabledIdx[enabledIdx.length - 1];
    else next = enabledIdx[(pos + dir + enabledIdx.length) % enabledIdx.length];
    itemRefs.current[next]?.focus();
  };

  const onMenuKey = (e: KeyboardEvent<HTMLElement>, index: number) => {
    const map: Record<string, 1 | -1 | 'first' | 'last'> = { ArrowDown: 1, ArrowUp: -1, Home: 'first', End: 'last' };
    const dir = map[e.key];
    if (dir !== undefined) {
      e.preventDefault();
      move(index, dir);
    } else if (e.key === 'Tab') {
      close(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative inline-block">
      <Button
        ref={triggerRef}
        variant={trigger ? 'secondary' : 'icon'}
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        {trigger}
      </Button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={triggerLabel}
          className={cn(
            'absolute top-full z-40 mt-2 min-w-44 rounded-md border border-border bg-surface-2 p-1 shadow-md',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((it, i) => (
            <button
              key={it.id}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={it.disabled}
              onKeyDown={(e) => onMenuKey(e, i)}
              onClick={() => {
                close(true);
                it.onSelect();
              }}
              className={cn(
                'flex min-h-11 w-full items-center gap-2 rounded-sm px-3 text-left text-base transition-colors duration-fast hover:bg-surface-1 focus-visible:bg-surface-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                it.danger ? 'text-danger' : 'text-text',
              )}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
