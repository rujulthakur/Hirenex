import { useId, useState } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';
import { X } from 'lucide-react';
import { copy } from '@/lib/copy';
import { Button } from './Button';
import { Overlay } from './Overlay';

const MIN_WIDTH = 360;
const KEY_STEP = 24;

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  footer?: ReactNode;
  initialWidth?: number;
  maxWidth?: number;
}

/** Usage: <Drawer open onClose title="Evidence">...</Drawer>. Right side, resizable by drag or arrow keys on the handle. */
export function Drawer({ open, onClose, title, children, footer, initialWidth = 520, maxWidth = 960 }: DrawerProps) {
  const titleId = `${useId()}-title`;
  const [width, setWidth] = useState(initialWidth);
  const clamp = (w: number) => Math.min(maxWidth, Math.max(MIN_WIDTH, w));

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => e.currentTarget.setPointerCapture(e.pointerId);
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) setWidth(clamp(window.innerWidth - e.clientX));
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setWidth((w) => clamp(w + KEY_STEP));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setWidth((w) => clamp(w - KEY_STEP));
    }
  };

  return (
    <Overlay
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      placement="right"
      panelClassName="flex h-full max-w-full flex-col border-l border-border bg-surface-1 shadow-lg"
      panelStyle={{ width }}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={copy.overlays.resizeDrawer}
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={maxWidth}
        aria-valuenow={width}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
        className="absolute left-0 top-0 hidden h-full w-2 -translate-x-1 cursor-col-resize hover:bg-primary focus-visible:bg-primary focus-visible:outline-none md:block"
      />
      <header className="flex items-center justify-between gap-3 border-b border-border p-4">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <Button variant="icon" aria-label={copy.overlays.close} onClick={onClose}>
          <X aria-hidden="true" strokeWidth={1.5} className="h-5 w-5" />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      {footer ? <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-4">{footer}</footer> : null}
    </Overlay>
  );
}
