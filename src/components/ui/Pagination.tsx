import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { copy } from '@/lib/copy';
import { Button } from './Button';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function pageList(page: number, total: number): Array<number | 'gap-start' | 'gap-end'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: Array<number | 'gap-start' | 'gap-end'> = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(total - 1, page + 1);
  if (from > 2) out.push('gap-start');
  for (let p = from; p <= to; p += 1) out.push(p);
  if (to < total - 1) out.push('gap-end');
  out.push(total);
  return out;
}

/** Usage: <Pagination page={1} totalPages={8} onPageChange={setPage} />. 1-based pages. */
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={copy.overlays.pageNav} className="flex items-center gap-1">
      <Button variant="icon" aria-label={copy.overlays.pagePrev} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
      </Button>
      {pageList(page, totalPages).map((p) =>
        typeof p === 'number' ? (
          <button
            key={p}
            type="button"
            aria-current={p === page ? 'page' : undefined}
            aria-label={copy.overlays.pageOf(p, totalPages)}
            onClick={() => onPageChange(p)}
            className={cn(
              'h-11 min-w-11 rounded-md px-2 text-base tabular-nums transition-colors duration-fast focus-visible:shadow-focus focus-visible:outline-none',
              p === page ? 'border border-primary text-primary' : 'text-muted hover:bg-surface-2 hover:text-text',
            )}
          >
            {p}
          </button>
        ) : (
          <span key={p} aria-hidden="true" className="px-1 text-muted">
            …
          </span>
        ),
      )}
      <Button variant="icon" aria-label={copy.overlays.pageNext} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        <ChevronRight aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
      </Button>
    </nav>
  );
}
