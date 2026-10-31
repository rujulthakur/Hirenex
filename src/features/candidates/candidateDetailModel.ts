import { CandidateStage } from '@/types';
import type { Candidate, CriterionScore } from '@/types';
import { copy } from '@/lib/copy';

export const DETAIL_TABS = ['evidence', 'resume', 'probe', 'timeline', 'notes'] as const;
export type DetailTab = (typeof DETAIL_TABS)[number];

export function parseTab(value: string | null): DetailTab {
  return DETAIL_TABS.find((t) => t === value) ?? 'evidence';
}

/** Below this score a verified criterion still gets a follow-up question. */
const LOW_SCORE = 40;

/** Builds probe questions in code (not AI) from gaps in the evidence. */
export function buildProbeQuestions(scores: CriterionScore[]): string[] {
  const out: string[] = [];
  for (const s of scores) {
    const name = s.criterionName ?? s.criterionId;
    if (s.missing) out.push(copy.candidates.detail.probeMissing(name));
    else if (!s.verified) out.push(copy.candidates.detail.probeUnverified(name));
    else if (s.score < LOW_SCORE) out.push(copy.candidates.detail.probeLow(name));
  }
  return out;
}

export interface TimelineStep {
  stage: CandidateStage;
  state: 'reached' | 'current' | 'upcoming';
}

/** Stages in pipeline order with the candidate's current position. Declined ends the path early. */
export function buildTimeline(c: Pick<Candidate, 'stage'>): TimelineStep[] {
  const order = CandidateStage.options;
  const at = order.indexOf(c.stage);
  return order.map((stage, i) => ({ stage, state: i < at ? 'reached' : i === at ? 'current' : 'upcoming' }));
}
