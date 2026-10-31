import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui';
import { copy } from '@/lib/copy';
import type { ShortfallReport } from '@/types';

/** Usage: <ShortfallCard report={report} />. */
export function ShortfallCard({ report }: { report: ShortfallReport }) {
  return (
    <Card surface={2} role="alert" className="flex flex-col gap-2 border-warning">
      <h3 className="flex items-center gap-2 text-md font-semibold text-warning">
        <AlertTriangle className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />{copy.domain.shortfallTitle}
      </h3>
      <p className="text-base tabular-nums">{copy.domain.shortfallBody(report.needed, report.available)}</p>
      <h4 className="text-sm font-medium">{copy.domain.shortfallFixes}</h4>
      <ul className="list-disc pl-5 text-sm">{report.fixes.map((f) => (<li key={f}>{f}</li>))}</ul>
    </Card>
  );
}
