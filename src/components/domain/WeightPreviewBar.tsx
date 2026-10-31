import { copy } from '@/lib/copy';

export interface WeightPart { id: string; name: string; weight: number }
const fills = ['bg-primary', 'bg-success', 'bg-warning', 'bg-info', 'bg-danger'] as const;

/** Usage: <WeightPreviewBar parts={weights} />. Stacked bar, legend with numbers. */
export function WeightPreviewBar({ parts }: { parts: WeightPart[] }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted">{copy.domain.weightPreview}</span>
      <div className="flex h-3 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={parts.map((p) => `${p.name} ${p.weight}`).join(', ')}>
        {parts.map((p, i) => (<div key={p.id} className={fills[i % fills.length]} style={{ width: `${p.weight}%` }} />))}
      </div>
      <ul className="flex flex-wrap gap-3 text-xs">
        {parts.map((p, i) => (
          <li key={p.id} className="flex items-center gap-1"><span className={`inline-block h-2 w-2 rounded-sm ${fills[i % fills.length]}`} />{p.name} <span className="tabular-nums text-muted">{p.weight}</span></li>
        ))}
      </ul>
    </div>
  );
}
