import { cloneElement, useId, useState } from 'react';
import type { ReactElement } from 'react';

interface TooltipProps {
  content: string;
  children: ReactElement<{ 'aria-describedby'?: string }>;
}

/** Usage: <Tooltip content="Copy"><Button variant="icon" aria-label="Copy" /></Tooltip>. Shows on hover and focus; Esc hides. */
export function Tooltip({ content, children }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
    >
      {cloneElement(children, { 'aria-describedby': id })}
      <span
        id={id}
        role="tooltip"
        className={`pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-text shadow-md transition-opacity duration-fast ${open ? 'opacity-100' : 'opacity-0'}`}
      >
        {content}
      </span>
    </span>
  );
}
