import type { ReactNode } from 'react';
import { Info, Lock, WifiOff } from 'lucide-react';
import { cn } from '@/lib/cn';

type Tone = 'info' | 'locked' | 'offline';

interface BannerProps {
  tone?: Tone;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

const toneMap = {
  info: { icon: Info, style: 'border-info text-info' },
  locked: { icon: Lock, style: 'border-warning text-warning' },
  offline: { icon: WifiOff, style: 'border-danger text-danger' },
} as const;

/** Usage: <Banner tone="locked">Invitations are locked until you approve</Banner>. Full-width, page-level. */
export function Banner({ tone = 'info', children, action, className }: BannerProps) {
  const t = toneMap[tone];
  const Icon = t.icon;
  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-3 border-b bg-surface-1 px-4 py-2 text-base',
        t.style,
        className,
      )}
    >
      <Icon aria-hidden="true" strokeWidth={1.5} className="h-4 w-4 shrink-0" />
      <div className="flex-1 text-text">{children}</div>
      {action}
    </div>
  );
}
