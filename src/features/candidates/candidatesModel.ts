import { CandidateStage, FlagKind } from '@/types';
import type { Candidate } from '@/types';

export type CandidateView = 'table' | 'kanban';

export const CANDIDATE_PAGE_SIZE = 20;
export const DEFAULT_SORT = 'rank';
/** The kanban shows one page of every stage at once, so it asks the server for a larger page. */
export const KANBAN_LIMIT = 100;
/** Above this many rows the table renders through TanStack Virtual. */
export const VIRTUALIZE_ABOVE = 50;

export const STAGES: readonly CandidateStage[] = CandidateStage.options;
export const FLAG_KINDS: readonly FlagKind[] = FlagKind.options;

/** Sort keys the mock and the real API understand. A leading "-" means descending. */
export const SORT_KEYS = ['rank', 'totalScore', 'name', 'uploadOrder'] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export interface CandidateParams {
  view: CandidateView;
  q: string;
  stage: CandidateStage | undefined;
  flag: FlagKind | undefined;
  /** Sort value as sent to the API, for example "rank" or "-totalScore". */
  sort: string;
  page: number;
}

export function sortKeyOf(sort: string): SortKey {
  const key = sort.startsWith('-') ? sort.slice(1) : sort;
  const found = SORT_KEYS.find((k) => k === key);
  return found ?? 'rank';
}

export function isDescending(sort: string): boolean {
  return sort.startsWith('-');
}

/** Clicking a header: same column flips direction, a new column starts ascending (score starts high to low). */
export function nextSort(current: string, key: SortKey): string {
  if (sortKeyOf(current) === key) return isDescending(current) ? key : `-${key}`;
  return key === 'totalScore' ? `-${key}` : key;
}

function normalizeSort(raw: string | null): string {
  if (raw === null) return DEFAULT_SORT;
  const key = sortKeyOf(raw);
  return raw.startsWith('-') ? `-${key}` : key;
}

/** Reads the shareable URL state. Unknown or invalid values fall back to defaults. */
export function parseParams(sp: URLSearchParams): CandidateParams {
  const stage = CandidateStage.safeParse(sp.get('stage'));
  const flag = FlagKind.safeParse(sp.get('flag'));
  const pageNum = Number(sp.get('page'));
  return {
    view: sp.get('view') === 'kanban' ? 'kanban' : 'table',
    q: sp.get('q') ?? '',
    stage: stage.success ? stage.data : undefined,
    flag: flag.success ? flag.data : undefined,
    sort: normalizeSort(sp.get('sort')),
    page: Number.isInteger(pageNum) && pageNum >= 1 ? pageNum : 1,
  };
}

/** Writes the URL state. Defaults are omitted so shared links stay short. */
export function toSearchParams(p: CandidateParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (p.view !== 'table') sp.set('view', p.view);
  if (p.q.trim() !== '') sp.set('q', p.q.trim());
  if (p.stage !== undefined) sp.set('stage', p.stage);
  if (p.flag !== undefined) sp.set('flag', p.flag);
  if (p.sort !== DEFAULT_SORT) sp.set('sort', p.sort);
  if (p.page > 1) sp.set('page', String(p.page));
  return sp;
}

export function hasActiveFilters(p: CandidateParams): boolean {
  return p.q.trim() !== '' || p.stage !== undefined || p.flag !== undefined;
}

/** Name shown for a candidate. Blind mode swaps the name for "Candidate ##" everywhere. */
export function displayNameFor(c: Pick<Candidate, 'displayName' | 'blindLabel'>, blind: boolean): string {
  return blind ? c.blindLabel : c.displayName;
}

/**
 * Legal stage moves a user can make by dragging. The shared API has no endpoint that changes a stage directly:
 * stages change through scoring, approval, invitations and the candidate's own response. So the list is empty, and
 * every drop is explained instead of applied.
 */
export const LEGAL_MOVES: ReadonlyArray<readonly [CandidateStage, CandidateStage]> = [];

/** Cards in these stages may be picked up. Approved stages (shortlisted and later) are never draggable. */
export function isCardDraggable(stage: CandidateStage): boolean {
  return stage === 'applied' || stage === 'scored';
}

export interface MoveVerdict {
  allowed: boolean;
  /** Which page can perform the action, so the explanation can link to it. */
  link: 'shortlist' | 'upload' | null;
  /** Key into copy.candidates.kanban.moveBlocked, or "same" when the card was dropped on its own column. */
  reason: CandidateStage | 'same';
}

export function judgeMove(from: CandidateStage, to: CandidateStage): MoveVerdict {
  if (from === to) return { allowed: false, link: null, reason: 'same' };
  if (LEGAL_MOVES.some(([a, b]) => a === from && b === to)) return { allowed: true, link: null, reason: to };
  const link = to === 'shortlisted' || to === 'waitlisted' ? 'shortlist' : to === 'scored' || to === 'applied' ? 'upload' : null;
  return { allowed: false, link, reason: to };
}

export function groupByStage(items: readonly Candidate[]): Record<CandidateStage, Candidate[]> {
  const groups: Record<CandidateStage, Candidate[]> = {
    applied: [], scored: [], shortlisted: [], waitlisted: [], on_hold: [], invited: [], confirmed: [], declined: [], rejected: [],
  };
  for (const c of items) groups[c.stage].push(c);
  return groups;
}
