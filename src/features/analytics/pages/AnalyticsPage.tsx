import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button, Card, ErrorState, Select, Skeleton } from '@/components/ui';
import { KpiCard } from '@/components/domain';
import { api } from '@/services';
import { qk } from '@/services/queryKeys';
import { useQuery } from '@tanstack/react-query';
import type { HrSummary, SummaryRange } from '@/types';

const RANGES: Array<{ value: SummaryRange; label: string }> = [
  { value: '7d', label: 'Past 7 days' },
  { value: '30d', label: 'Past 30 days' },
  { value: '90d', label: 'Past 3 months' },
  { value: '180d', label: 'Past 6 months' },
  { value: '365d', label: 'Past 12 months' },
  { value: 'all', label: 'All time' },
];
const PASS_MARKS = [50, 60, 70, 80].map((n) => ({ value: String(n), label: `${n} out of 100 or more` }));
const RESULT_LABEL = { passed: 'Passed', failed: 'Did not pass', not_scored: 'Not scored' } as const;

const csvCell = (v: string | number | null): string => {
  const s = v === null ? '' : String(v);
  // Cells starting with = + - @ would run as formulas in Excel, so they get a leading quote.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** PURE. Summary block first, then one row per candidate, as CSV text. */
export function buildCsv(d: HrSummary, rangeLabel: string): string {
  const lines: string[] = [
    ['Report', rangeLabel].map(csvCell).join(','),
    ['Pass mark (out of 100)', d.passMark].map(csvCell).join(','),
    ['Resumes received', d.applied].map(csvCell).join(','),
    ['Interviewed (invited)', d.interviewed].map(csvCell).join(','),
    ['Passed', d.passed].map(csvCell).join(','),
    ['Did not pass', d.failed].map(csvCell).join(','),
    ['Not scored', d.notScored].map(csvCell).join(','),
    '',
    ['Name', 'Email', 'Phone', 'Job', 'Score (out of 100)', 'Result', 'Interview invited', 'Received on'].join(','),
    ...d.rows.map((r) => [r.name, r.email, r.phone, r.job, r.score, RESULT_LABEL[r.result], r.invited ? 'Yes' : 'No', r.uploadedAt.slice(0, 10)].map(csvCell).join(',')),
  ];
  return lines.join('\n');
}

function download(name: string, text: string): void {
  const url = URL.createObjectURL(new Blob([`\uFEFF${text}`], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** /app/analytics. Four numbers for a chosen period and a download. Nothing else. */
export default function AnalyticsPage() {
  const [range, setRange] = useState<SummaryRange>('30d');
  const [passMark, setPassMark] = useState(60);
  const q = useQuery({ queryKey: qk.analytics.summary(range, passMark), queryFn: () => api.analytics.summary(range, passMark) });
  const d = q.data;
  const rangeLabel = RANGES.find((r) => r.value === range)?.label ?? range;

  return (
    <section className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-base text-muted">How your hiring is going across all jobs.</p>
        </div>
        <Button variant="secondary" disabled={!d} onClick={() => d && download(`hiring-report-${range}.csv`, buildCsv(d, rangeLabel))}>
          <Download size={16} aria-hidden="true" />
          Download report
        </Button>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">Period
          <Select value={range} onChange={(e) => setRange(e.target.value as SummaryRange)} options={RANGES} className="min-h-11" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">A candidate passes with
          <Select value={String(passMark)} onChange={(e) => setPassMark(Number(e.target.value))} options={PASS_MARKS} className="min-h-11" />
        </label>
      </div>

      {q.isLoading ? (
        <div aria-busy="true" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="card" />)}
        </div>
      ) : q.isError || !d ? (
        <ErrorState message="Analytics could not be loaded." onRetry={() => void q.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label="Applied" value={d.applied} />
            <KpiCard label="Interviewed" value={d.interviewed} />
            <KpiCard label="Passed" value={d.passed} />
            <KpiCard label="Did not pass" value={d.failed} />
          </div>
          <Card surface={2} className="text-sm text-muted">
            <p>
              Applied is every resume received in this period. Interviewed is everyone who was sent an interview invite. Passed and did not pass compare the AI score with the mark above
              {d.notScored > 0 ? `; ${d.notScored} resume${d.notScored === 1 ? ' is' : 's are'} not scored yet.` : '.'}
            </p>
          </Card>
        </>
      )}
    </section>
  );
}
