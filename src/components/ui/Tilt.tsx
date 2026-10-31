import { useRef } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Usage: <Tilt max={6}>content</Tilt>. Cursor-follow 3D tilt with a soft glare. Disabled on touch and reduced motion. */
export function Tilt({ children, max = 6, className }: { children: ReactNode; max?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--ry', `${(px - 0.5) * 2 * max}deg`);
    el.style.setProperty('--rx', `${(0.5 - py) * 2 * max}deg`);
    el.style.setProperty('--gx', `${px * 100}%`);
    el.style.setProperty('--gy', `${py * 100}%`);
  };
  const leave = () => {
    ref.current?.style.setProperty('--rx', '0deg');
    ref.current?.style.setProperty('--ry', '0deg');
  };
  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} className={cn('tilt relative', className)}>
      {children}
      <span aria-hidden="true" className="tilt-glare" />
    </div>
  );
}
