import { Card } from '@/components/ui';
import { copy } from '@/lib/copy';
import { formatScore } from '@/lib/format';
import type { SwapTest } from '@/types';

/** Usage: <SwapTestCard result={swap} />. Always renders the mandatory limit sentence from copy, plus the server note when it differs. */
export function SwapTestCard({ result }: { result: SwapTest }) {
  return (
    <Card surface={1} className="flex flex-col gap-3">
      <h3 className="text-md font-semibold">{copy.domain.swap.title}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-border bg-surface-2 p-3">
          <p className="text-xs text-muted">{copy.domain.swap.original}</p>
          <p className="text-2xl font-semibold tabular-nums">{formatScore(result.original)}</p>
        </div>
        <div className="rounded-md border border-border bg-surface-2 p-3">
          <p className="text-xs text-muted">{copy.domain.swap.swapped}</p>
          <p className="text-2xl font-semibold tabular-nums">{formatScore(result.swapped)}</p>
        </div>
      </div>
      <p role="status" className={result.delta === 0 ? 'text-sm text-success' : 'text-sm text-warning'}>{copy.domain.swap.delta(result.delta)}</p>
      <p className="text-xs text-muted">{copy.domain.swap.limit}</p>
      {result.limitNote && result.limitNote !== copy.domain.swap.limit ? <p className="text-xs text-muted">{result.limitNote}</p> : null}
    </Card>
  );
}
