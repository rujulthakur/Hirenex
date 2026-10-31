import { Badge } from '@/components/ui';
import { copy } from '@/lib/copy';
import type { CandidateStage, FlagKind } from '@/types';

const stageTone = {
  applied: 'neutral', scored: 'info', shortlisted: 'primary', waitlisted: 'warning',
  on_hold: 'warning', invited: 'info', confirmed: 'success', declined: 'danger', rejected: 'danger',
} as const satisfies Record<CandidateStage, 'neutral' | 'info' | 'primary' | 'warning' | 'success' | 'danger'>;

const flagTone = {
  flagged: 'warning', unverified_evidence: 'danger', incomplete: 'warning',
  hidden_text_found: 'danger', injection_phrase_found: 'danger',
} as const satisfies Record<FlagKind, 'warning' | 'danger'>;

/** Usage: <StageBadge stage="scored" />. Text label always present (never colour-only). */
export function StageBadge({ stage }: { stage: CandidateStage }) {
  return <Badge tone={stageTone[stage]}>{copy.domain.stage[stage]}</Badge>;
}

/** Usage: <FlagBadge flag="hidden_text_found" />. */
export function FlagBadge({ flag }: { flag: FlagKind }) {
  return <Badge tone={flagTone[flag]} outline="dashed">{copy.domain.flag[flag]}</Badge>;
}
