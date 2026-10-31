import { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/cn';
import { copy } from '@/lib/copy';
import type { HiddenFinding } from '@/types';

export interface TextRange { id: string; start: number; end: number }

interface Props {
  text: string;
  ranges?: TextRange[];
  activeId?: string | null;
  hiddenFindings?: HiddenFinding[];
  showHidden?: boolean;
}

interface Segment { text: string; kind: 'plain' | 'quote' | 'hidden' | 'injection'; id?: string }

function buildSegments(text: string, ranges: TextRange[], hidden: HiddenFinding[]): Segment[] {
  const marks = [
    ...ranges.map((r) => ({ start: r.start, end: r.end, kind: 'quote' as const, id: r.id })),
    ...hidden.map((h) => ({ start: h.start, end: h.end, kind: h.kind === 'hidden_text' ? ('hidden' as const) : ('injection' as const), id: undefined })),
  ].sort((a, b) => a.start - b.start);
  const out: Segment[] = [];
  let cursor = 0;
  for (const m of marks) {
    const start = Math.max(m.start, cursor);
    const end = Math.min(m.end, text.length);
    if (end <= start) continue;
    if (start > cursor) out.push({ text: text.slice(cursor, start), kind: 'plain' });
    out.push({ text: text.slice(start, end), kind: m.kind, id: m.id });
    cursor = end;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), kind: 'plain' });
  return out;
}

const kindClass = {
  plain: '',
  quote: 'bg-surface-2 border-b-2 border-success',
  hidden: 'bg-surface-2 border border-dashed border-danger text-danger',
  injection: 'bg-surface-2 border border-dashed border-warning text-warning',
} as const;

/** Usage: <HighlightedText text={t} ranges={r} activeId={id} hiddenFindings={h} showHidden />. Active range scrolls into view. */
export function HighlightedText({ text, ranges = [], activeId = null, hiddenFindings = [], showHidden = false }: Props) {
  const activeRef = useRef<HTMLElement | null>(null);
  const segments = useMemo(
    () => buildSegments(text, ranges, showHidden ? hiddenFindings : []),
    [text, ranges, hiddenFindings, showHidden],
  );
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [activeId]);
  return (
    <p className="whitespace-pre-wrap text-base leading-relaxed">
      {segments.map((s, i) => {
        if (s.kind === 'plain') return <span key={i}>{s.text}</span>;
        const isActive = s.kind === 'quote' && s.id === activeId;
        const label = s.kind === 'hidden' ? copy.domain.hiddenLabel : s.kind === 'injection' ? copy.domain.injectionLabel : undefined;
        return (
          <mark
            key={i}
            ref={isActive ? (el) => { activeRef.current = el; } : undefined}
            title={label}
            className={cn('rounded-sm px-0.5 text-text', kindClass[s.kind], isActive && 'shadow-focus')}
          >
            {s.text}
          </mark>
        );
      })}
    </p>
  );
}
