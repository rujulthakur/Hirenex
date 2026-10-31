import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { copy } from '@/lib/copy';
import type { EmailStatus, InviteResponse } from '@/types';

const steps = ['queued', 'sent', 'viewed', 'responded'] as const;

function reached(email: EmailStatus, response: InviteResponse): number {
  if (email === 'failed') return 0;
  if (response !== 'pending') return 3;
  return email === 'queued' ? 0 : email === 'sent' ? 1 : 2;
}

/** Usage: <DeliveryStepper emailStatus="sent" response="pending" />. Failed shows an error line. */
export function DeliveryStepper({ emailStatus, response }: { emailStatus: EmailStatus; response: InviteResponse }) {
  const at = reached(emailStatus, response);
  return (
    <ol aria-label={copy.domain.deliveryLabel} className="flex items-center gap-2 text-xs">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2" aria-current={i === at ? 'step' : undefined}>
          <span className={cn('flex h-5 w-5 items-center justify-center rounded-full border', i <= at && emailStatus !== 'failed' ? 'border-success text-success' : 'border-border text-muted')}>
            {i <= at && emailStatus !== 'failed' ? <Check className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" /> : i + 1}
          </span>
          <span className={i <= at ? 'text-text' : 'text-muted'}>{copy.domain.delivery[s]}</span>
        </li>
      ))}
      {emailStatus === 'failed' && <li className="text-danger">Failed</li>}
    </ol>
  );
}
