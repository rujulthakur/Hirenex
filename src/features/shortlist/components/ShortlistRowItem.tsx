import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Checkbox, Button } from '@/components/ui';
import { FlagBadge, TieRulePopover, TotalScore } from '@/components/domain';
import { copy } from '@/lib/copy';
import { spring } from '@/lib/motion';
import type { ShortlistRow } from '@/types';

interface Props {
  row: ShortlistRow;
  name: string;
  checked: boolean;
  disabled: boolean;
  showMove: boolean;
  onToggle: () => void;
  onOpen: () => void;
}

/** One war-room row. `layout` makes reordering animate (reduced motion is handled by MotionConfig). */
export function ShortlistRowItem({ row, name, checked, disabled, showMove, onToggle, onOpen }: Props) {
  const moved = showMove && row.previousRank !== null && row.previousRank !== undefined ? row.previousRank - row.rank : 0;
  return (
    <motion.li layout transition={spring.soft} className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface-1 p-3">
      <Checkbox label={copy.shortlist.selectRow(name)} checked={checked} disabled={disabled} onChange={onToggle} />
      <span className="w-10 text-lg font-semibold tabular-nums" aria-label={copy.shortlist.rankLabel}>
        #{row.rank}
      </span>
      <Button variant="ghost" onClick={onOpen} aria-label={copy.shortlist.openEvidence(name)} className="min-w-0 flex-1 justify-start truncate">
        {name}
      </Button>
      <TotalScore value={row.totalScore} authority="code" />
      {moved !== 0 ? (
        <span className={moved > 0 ? 'inline-flex items-center gap-1 text-sm text-success' : 'inline-flex items-center gap-1 text-sm text-warning'}>
          {moved > 0 ? <ArrowUp aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" /> : <ArrowDown aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />}
          {copy.shortlist.moved(moved)}
        </span>
      ) : null}
      <span className="flex flex-wrap items-center gap-1">
        {row.flags.map((f) => (
          <FlagBadge key={f} flag={f} />
        ))}
      </span>
      <span className="flex flex-wrap items-center gap-x-3 text-xs text-muted tabular-nums">
        <span>{copy.shortlist.coverage(Math.round(row.requiredCoverage * 100))}</span>
        <span>{copy.shortlist.verified(row.verifiedCount)}</span>
        <span>{copy.shortlist.years(row.yearsExperience)}</span>
      </span>
      <TieRulePopover />
    </motion.li>
  );
}
