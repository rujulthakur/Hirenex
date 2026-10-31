import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui';
import { copy } from '@/lib/copy';
import { formatInZone } from '@/lib/time';
import type { RepairDiff } from '@/types';

type Placement = RepairDiff['before'][number];

function Column({ title, rows, labels }: { title: string; rows: Placement[]; labels: Record<string, string> }) {
  return (
    <section aria-label={title} className="flex flex-1 flex-col gap-2">
      <h4 className="text-sm font-medium text-muted">{title}</h4>
      <ul className="flex flex-col gap-1">
        {rows.map((r) => (
          <li key={r.candidateId} className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-sm">
            <span>{labels[r.candidateId] ?? r.candidateId}</span>
            <span className="tabular-nums text-muted">{r.start ? formatInZone(r.start, undefined, 'D MMM HH:mm') : copy.domain.repairUnassigned}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const list = (ids: string[], labels: Record<string, string>) => (ids.length === 0 ? copy.domain.repairNone : ids.map((i) => labels[i] ?? i).join(', '));

/** Usage: <RepairDiffView diff={diff} labels={{ id: 'Candidate 01' }} conflicts={0} />. Summary reads "N moved, 0 conflicts". */
export function RepairDiffView({ diff, labels, conflicts = 0 }: { diff: RepairDiff; labels: Record<string, string>; conflicts?: number }) {
  return (
    <Card surface={1} className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-md font-semibold">{copy.domain.repairTitle}</h3>
        <span role="status" className="rounded-full border border-success px-2 py-0.5 text-xs text-success tabular-nums">
          {copy.domain.repairSummary(diff.moved.length, conflicts)}
        </span>
      </header>
      <p className="text-sm text-muted">{diff.reason}</p>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <Column title={copy.domain.repairBefore} rows={diff.before} labels={labels} />
        <ArrowRight className="hidden h-5 w-5 self-center text-muted md:block" strokeWidth={1.5} aria-hidden="true" />
        <Column title={copy.domain.repairAfter} rows={diff.after} labels={labels} />
      </div>
      <dl className="grid gap-1 text-sm md:grid-cols-3">
        <div><dt className="text-muted">{copy.domain.repairMoved}</dt><dd>{list(diff.moved, labels)}</dd></div>
        <div><dt className="text-muted">{copy.domain.repairUnplaced}</dt><dd>{list(diff.unplaced, labels)}</dd></div>
        <div><dt className="text-muted">{copy.domain.repairPromoted}</dt><dd>{diff.promoted ? (labels[diff.promoted] ?? diff.promoted) : copy.domain.repairNone}</dd></div>
      </dl>
    </Card>
  );
}
