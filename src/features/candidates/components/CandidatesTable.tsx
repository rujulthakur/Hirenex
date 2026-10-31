import { useMemo, useRef } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { OnChangeFn, RowSelectionState } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { FlagBadge, StageBadge } from '@/components/domain';
import { ReviewClock } from '@/features/hiring/components/ReviewClock';
import { cn } from '@/lib/cn';
import { copy } from '@/lib/copy';
import { formatScore } from '@/lib/format';
import type { Density } from '@/stores';
import type { Candidate } from '@/types';
import { VIRTUALIZE_ABOVE, isDescending, sortKeyOf } from '../candidatesModel';
import type { SortKey } from '../candidatesModel';
import { useCandidateName } from '../hooks/useCandidateName';

interface CandidatesTableProps {
  items: Candidate[];
  /** Current sort value from the URL, for example "-totalScore". */
  sort: string;
  onSortChange: (key: SortKey) => void;
  density: Density;
  selection: RowSelectionState;
  onSelectionChange: OnChangeFn<RowSelectionState>;
  onOpen: (candidate: Candidate) => void;
}

/** Row heights (px) the virtualizer uses to estimate positions. They match the row classes below. */
const ROW_HEIGHT = { comfortable: 56, compact: 40 } as const;
const OVERSCAN_ROWS = 8;

const SORTABLE: Record<string, SortKey> = { rank: 'rank', name: 'name', total: 'totalScore' };

const helper = createColumnHelper<Candidate>();

function SortIcon({ active, desc }: { active: boolean; desc: boolean }) {
  const Icon = !active ? ArrowUpDown : desc ? ArrowDown : ArrowUp;
  return <Icon aria-hidden="true" strokeWidth={1.5} className={cn('h-3 w-3', active ? 'text-text' : 'text-muted')} />;
}

/**
 * Usage: <CandidatesTable items={items} sort={sort} onSortChange={...} density={density} selection={sel}
 * onSelectionChange={setSel} onOpen={openDrawer} />.
 * Sorting, search, filters and paging are server-driven (the URL decides); TanStack Table only renders the rows.
 * Above 50 rows the body is virtualized with TanStack Virtual. Clicking a row, or pressing Enter on the name, opens
 * the evidence drawer.
 */
export function CandidatesTable({ items, sort, onSortChange, density, selection, onSelectionChange, onOpen }: CandidatesTableProps) {
  const nameOf = useCandidateName();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeKey = sortKeyOf(sort);
  const desc = isDescending(sort);
  const cellPad = density === 'compact' ? 'py-1' : 'py-3';

  const columns = useMemo(
    () => [
      helper.display({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label={copy.candidates.selectAll}
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="h-4 w-4 accent-primary"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={copy.candidates.selectRow(nameOf(row.original))}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 accent-primary"
          />
        ),
      }),
      helper.accessor('rank', {
        id: 'rank',
        header: copy.candidates.columns.rank,
        cell: (ctx) => {
          const v = ctx.getValue();
          return <span className="tabular-nums">{v === null ? copy.candidates.noRank : `#${v}`}</span>;
        },
      }),
      helper.display({
        id: 'name',
        header: copy.candidates.columns.name,
        cell: ({ row }) => {
          const name = nameOf(row.original);
          return (
            <button
              type="button"
              aria-label={copy.candidates.openEvidence(name)}
              onClick={(e) => {
                e.stopPropagation();
                onOpen(row.original);
              }}
              className="min-h-11 rounded-sm text-left font-medium hover:underline focus-visible:shadow-focus md:min-h-8"
            >
              {name}
            </button>
          );
        },
      }),
      helper.accessor('stage', {
        id: 'stage',
        header: copy.candidates.columns.stage,
        cell: (ctx) => (
          <span className="flex flex-col items-start gap-1">
            <StageBadge stage={ctx.getValue()} />
            <ReviewClock candidate={ctx.row.original} />
          </span>
        ),
      }),
      helper.accessor('totalScore', {
        id: 'total',
        header: copy.candidates.columns.total,
        cell: (ctx) => {
          const v = ctx.getValue();
          return v === null ? <span className="text-muted">{copy.candidates.noScore}</span> : <span className="tabular-nums">{formatScore(v)}</span>;
        },
      }),
      helper.accessor('flags', {
        id: 'flags',
        header: copy.candidates.columns.flags,
        cell: (ctx) => {
          const flags = ctx.getValue();
          return flags.length === 0 ? (
            <span className="text-muted">{copy.candidates.noFlags}</span>
          ) : (
            <span className="flex flex-wrap gap-1">
              {flags.map((f) => (
                <FlagBadge key={f} flag={f} />
              ))}
            </span>
          );
        },
      }),
      helper.accessor('fileName', {
        id: 'file',
        header: copy.candidates.columns.file,
        cell: (ctx) => <span className="block max-w-48 truncate font-mono text-xs text-muted">{ctx.getValue()}</span>,
      }),
    ],
    [nameOf, onOpen],
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (c) => c.id,
    manualSorting: true,
    manualPagination: true,
    enableRowSelection: true,
    state: { rowSelection: selection },
    onRowSelectionChange: onSelectionChange,
  });

  const rows = table.getRowModel().rows;
  const virtualize = rows.length > VIRTUALIZE_ABOVE;
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT[density],
    overscan: OVERSCAN_ROWS,
    enabled: virtualize,
  });

  const virtualItems = virtualize ? virtualizer.getVirtualItems() : [];
  const visibleRows = virtualize ? virtualItems.flatMap((v) => (rows[v.index] ? [rows[v.index]] : [])) : rows;
  const padTop = virtualize && virtualItems.length > 0 ? (virtualItems[0]?.start ?? 0) : 0;
  const padBottom =
    virtualize && virtualItems.length > 0 ? virtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end ?? 0) : 0;
  const colCount = columns.length;

  return (
    <div ref={scrollRef} className={cn('overflow-x-auto rounded-lg border border-border bg-surface-1', virtualize && 'max-h-[70vh] overflow-y-auto')}>
      <table aria-label={copy.candidates.tableLabel} className="w-full min-w-max border-collapse text-left text-base">
        <thead className="sticky top-0 z-10 bg-surface-2 text-sm text-muted">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => {
                const key = SORTABLE[h.column.id];
                const active = key !== undefined && key === activeKey;
                const ariaSort = active ? (desc ? 'descending' : 'ascending') : key !== undefined ? 'none' : undefined;
                const label = typeof h.column.columnDef.header === 'string' ? h.column.columnDef.header : '';
                return (
                  <th key={h.id} scope="col" aria-sort={ariaSort} className="px-3 py-2 font-medium">
                    {key !== undefined ? (
                      <button
                        type="button"
                        aria-label={`${copy.candidates.sortBy(label)}${active ? `, ${desc ? copy.candidates.sortedDesc : copy.candidates.sortedAsc}` : ''}`}
                        onClick={() => onSortChange(key)}
                        className="inline-flex min-h-11 items-center gap-1 rounded-sm hover:text-text focus-visible:shadow-focus md:min-h-8"
                      >
                        {label}
                        <SortIcon active={active} desc={desc} />
                      </button>
                    ) : (
                      flexRender(h.column.columnDef.header, h.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {padTop > 0 ? (
            <tr aria-hidden="true">
              <td colSpan={colCount} style={{ height: padTop }} />
            </tr>
          ) : null}
          {visibleRows.map((row) => (
            <tr
              key={row.id}
              data-selected={row.getIsSelected() || undefined}
              onClick={() => onOpen(row.original)}
              className={cn(
                'cursor-pointer border-t border-border transition-colors duration-fast ease-standard hover:bg-surface-2 data-[selected]:bg-surface-2',
                virtualize && (density === 'compact' ? 'h-10' : 'h-14'),
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className={cn('px-3 align-middle', cellPad)}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {padBottom > 0 ? (
            <tr aria-hidden="true">
              <td colSpan={colCount} style={{ height: padBottom }} />
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
