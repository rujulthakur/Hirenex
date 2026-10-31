import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

type Tone = 'info' | 'success' | 'warning' | 'danger';

interface InlineAlertProps {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  className?: string;
}

const toneMap = {
  info: { icon: Info, border: 'border-info', text: 'text-info' },
  success: { icon: CheckCircle2, border: 'border-success', text: 'text-success' },
  warning: { icon: AlertTriangle, border: 'border-warning', text: 'text-warning' },
  danger: { icon: XCircle, border: 'border-danger', text: 'text-danger' },
} as const;

/** Usage: <InlineAlert tone="warning" title="Heads up">Body</InlineAlert>. Icon + text, never colour alone. */
export function InlineAlert({ tone = 'info', title, children, className }: InlineAlertProps) {
  const t = toneMap[tone];
  const Icon = t.icon;
  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-md border bg-surface-1 p-3', t.border, className)}
    >
      <Icon aria-hidden="true" strokeWidth={1.5} className={cn('mt-0.5 h-4 w-4 shrink-0', t.text)} />
      <div className="text-base">
        {title ? <p className="font-medium">{title}</p> : null}
        <div className="text-muted">{children}</div>
      </div>
    </div>
  );
}
