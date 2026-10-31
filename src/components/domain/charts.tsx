import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { copy } from '@/lib/copy';

export interface Datum { label: string; value: number }

interface FrameProps { name: string; data: Datum[]; children: ReactNode }

/** Wraps a chart with a text alternative and a data-table fallback toggle. */
export function ChartFrame({ name, data, children }: FrameProps) {
  const [table, setTable] = useState(false);
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="flex items-center justify-between gap-2 text-sm font-medium">
        {name}
        <Button size="sm" variant="ghost" onClick={() => setTable((t) => !t)} aria-pressed={table}>
          {table ? copy.domain.showChart : copy.domain.showTable}
        </Button>
      </figcaption>
      {table ? (
        <table className="w-full text-sm">
          <caption className="sr-only">{name}</caption>
          <thead><tr><th scope="col" className="text-left text-muted">{copy.domain.tableCol.label}</th><th scope="col" className="text-right text-muted">{copy.domain.tableCol.value}</th></tr></thead>
          <tbody>{data.map((d) => (<tr key={d.label}><td>{d.label}</td><td className="text-right tabular-nums">{d.value}</td></tr>))}</tbody>
        </table>
      ) : (
        <div role="img" aria-label={`${copy.domain.chartAlt(name)} ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}>{children}</div>
      )}
    </figure>
  );
}

const max = (d: Datum[]) => Math.max(1, ...d.map((x) => x.value));

/** Usage: <FunnelChart name="Pipeline" data={[...]} />. Horizontal tapering bars. */
export function FunnelChart({ name, data }: { name: string; data: Datum[] }) {
  const m = max(data);
  return (
    <ChartFrame name={name} data={data}>
      <ul className="flex flex-col gap-2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 text-muted">{d.label}</span>
            <div className="h-6 flex-1"><div className="h-full rounded-sm bg-primary" style={{ width: `${(d.value / m) * 100}%` }} /></div>
            <span className="w-8 text-right tabular-nums">{d.value}</span>
          </li>
        ))}
      </ul>
    </ChartFrame>
  );
}

/** Usage: <BarChart name="Time in stage (h)" data={[...]} />. Vertical bars in plain SVG. */
export function BarChart({ name, data }: { name: string; data: Datum[] }) {
  const m = max(data);
  const w = 40;
  return (
    <ChartFrame name={name} data={data}>
      <svg viewBox={`0 0 ${data.length * w} 120`} className="h-40 w-full" aria-hidden="true">
        {data.map((d, i) => {
          const h = (d.value / m) * 90;
          return (
            <g key={d.label}>
              <rect x={i * w + 8} y={100 - h} width={w - 16} height={h} rx={2} className="fill-primary" />
              <text x={i * w + w / 2} y={114} textAnchor="middle" className="fill-muted" fontSize="8">{d.label.slice(0, 6)}</text>
            </g>
          );
        })}
      </svg>
    </ChartFrame>
  );
}

const donutFill = ['fill-primary', 'fill-success', 'fill-warning', 'fill-danger', 'fill-info'] as const;
const donutStroke = ['stroke-primary', 'stroke-success', 'stroke-warning', 'stroke-danger', 'stroke-info'] as const;

/** Usage: <DonutChart name="Stage mix" data={[...]} />. Legend carries labels, so colour is not the only cue. */
export function DonutChart({ name, data }: { name: string; data: Datum[] }) {
  const total = Math.max(1, data.reduce((a, d) => a + d.value, 0));
  const r = 40;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <ChartFrame name={name} data={data}>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90" aria-hidden="true">
          {data.map((d, i) => {
            const len = (d.value / total) * c;
            const el = (
              <circle key={d.label} cx="50" cy="50" r={r} fill="none" strokeWidth="14"
                strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset}
                className={donutStroke[i % donutStroke.length]} />
            );
            offset += len;
            return el;
          })}
        </svg>
        <ul className="flex flex-col gap-1 text-sm">
          {data.map((d, i) => (
            <li key={d.label} className="flex items-center gap-2">
              <span className={cn('inline-block h-3 w-3 rounded-sm', donutFill[i % donutFill.length].replace('fill-', 'bg-'))} />
              {d.label} <span className="tabular-nums text-muted">{d.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartFrame>
  );
}

export interface HeatRow { name: string; cells: Datum[] }

/** Usage: <HeatmapGrid name="Utilization" rows={[...]} />. Cell values printed so colour is not the only cue. */
export function HeatmapGrid({ name, rows }: { name: string; rows: HeatRow[] }) {
  const flat: Datum[] = rows.flatMap((r) => r.cells.map((c) => ({ label: `${r.name} ${c.label}`, value: c.value })));
  const m = max(flat);
  return (
    <ChartFrame name={name} data={flat}>
      <div className="flex flex-col gap-1 overflow-x-auto">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-1">
            <span className="w-24 shrink-0 text-sm text-muted">{r.name}</span>
            {r.cells.map((c) => (
              <span key={c.label} title={`${c.label}: ${c.value}`} className="flex h-8 w-10 shrink-0 items-center justify-center rounded-sm border border-border bg-surface-2 text-xs tabular-nums"
                style={{ boxShadow: `inset 0 0 0 100px color-mix(in srgb, var(--color-primary) ${Math.round((c.value / m) * 60)}%, transparent)` }}>
                {c.value}
              </span>
            ))}
          </div>
        ))}
      </div>
    </ChartFrame>
  );
}
