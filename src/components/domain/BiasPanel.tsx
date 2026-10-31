import { Badge, Card } from '@/components/ui';
import { copy } from '@/lib/copy';
import { formatPercent } from '@/lib/format';

export interface BiasGroup { group: string; total: number; selected: number; rate: number; ratio: number }

/** Usage: <BiasPanel groups={g} threshold={0.8} source="synthetic demo cohort" />. Audit only, never used in scoring. */
export function BiasPanel({ groups, threshold, source }: { groups: BiasGroup[]; threshold: number; source: string }) {
  return (
    <Card surface={1} className="flex flex-col gap-3">
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-md font-semibold">{copy.domain.bias.title}</h3>
        <Badge tone="info" outline="dashed">{copy.domain.bias.auditOnly}</Badge>
      </header>
      <ul className="flex flex-col gap-3">
        {groups.map((g) => (
          <li key={g.group} className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between"><span>{g.group}</span><span className="tabular-nums text-muted">{g.selected}/{g.total} · {formatPercent(g.rate)} · {copy.domain.bias.ratio}: {g.ratio.toFixed(2)}</span></div>
            <div className="relative h-3 rounded-full bg-surface-2" role="meter" aria-label={`${g.group} ${copy.domain.bias.rate}`} aria-valuemin={0} aria-valuemax={1} aria-valuenow={g.ratio}>
              <div className={`h-full rounded-full ${g.ratio >= threshold ? 'bg-success' : 'bg-warning'}`} style={{ width: `${Math.min(1, g.ratio) * 100}%` }} />
              <div className="absolute inset-y-[-2px] w-px bg-text" style={{ left: `${threshold * 100}%` }} aria-hidden="true" />
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">{copy.domain.bias.thresholdLabel}: {threshold}</p>
      <p className="text-sm">{copy.domain.bias.caveat}</p>
      <p className="text-xs text-muted">{copy.domain.bias.source(source)}</p>
    </Card>
  );
}
