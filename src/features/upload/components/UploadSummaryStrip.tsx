import { CheckCircle2, RotateCcw, ShieldAlert, Trash2, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { copy } from '@/lib/copy';
import type { UploadSummary } from '../uploadModel';

interface UploadSummaryStripProps {
  summary: UploadSummary;
  busy: boolean;
  onRetryFailed: () => void;
  onClear: () => void;
}

interface StatProps {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: 'success' | 'warning' | 'danger';
}

const toneText = { success: 'text-success', warning: 'text-warning', danger: 'text-danger' } as const;

function Stat({ icon: Icon, label, value, tone }: StatProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon aria-hidden="true" strokeWidth={1.5} className={cn('h-4 w-4 shrink-0', toneText[tone])} />
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-md font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

/**
 * Usage: <UploadSummaryStrip summary={summary} busy={busy} onRetryFailed={retry} onClear={clear} />.
 * Counts are announced politely; every count has a text label and an icon, never colour alone.
 */
export function UploadSummaryStrip({ summary, busy, onRetryFailed, onClear }: UploadSummaryStripProps) {
  return (
    <section
      aria-label={copy.upload.summaryLabel}
      className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-border bg-surface-1 px-4 py-3"
    >
      <dl aria-live="polite" className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Stat icon={CheckCircle2} label={copy.upload.summaryAccepted} value={summary.accepted} tone="success" />
        <Stat icon={ShieldAlert} label={copy.upload.summaryFlagged} value={summary.flagged} tone="warning" />
        <Stat icon={XCircle} label={copy.upload.summaryRejected} value={summary.rejected} tone="danger" />
        {summary.failed > 0 ? <Stat icon={XCircle} label={copy.upload.state.failed} value={summary.failed} tone="danger" /> : null}
      </dl>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {summary.failed > 0 ? (
          <Button variant="secondary" size="sm" disabled={busy} onClick={onRetryFailed}>
            <RotateCcw aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
            {copy.upload.retryFailed}
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" disabled={busy} onClick={onClear}>
          <Trash2 aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
          {copy.upload.clearList}
        </Button>
      </div>
    </section>
  );
}
