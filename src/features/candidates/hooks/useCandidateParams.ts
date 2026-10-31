import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseParams, toSearchParams } from '../candidatesModel';
import type { CandidateParams } from '../candidatesModel';

export interface UpdateOptions {
  /** Replace the history entry instead of adding one (used while typing in search). */
  replace?: boolean;
}

export interface CandidateParamsApi {
  params: CandidateParams;
  /** Merges a patch into the URL state. Changing anything except the page resets the page to 1. */
  update: (patch: Partial<CandidateParams>, options?: UpdateOptions) => void;
  clearFilters: () => void;
}

/**
 * The candidates page keeps view, search, stage, flag, sort and page in the URL so any state is shareable.
 * Usage: const { params, update } = useCandidateParams(); update({ stage: 'scored' }).
 */
export function useCandidateParams(): CandidateParamsApi {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseParams(searchParams), [searchParams]);

  const update = useCallback(
    (patch: Partial<CandidateParams>, options?: UpdateOptions): void => {
      setSearchParams(
        (prev) => {
          const next: CandidateParams = { ...parseParams(prev), ...patch };
          if (!('page' in patch)) next.page = 1;
          return toSearchParams(next);
        },
        { replace: options?.replace ?? false },
      );
    },
    [setSearchParams],
  );

  const clearFilters = useCallback((): void => {
    update({ q: '', stage: undefined, flag: undefined });
  }, [update]);

  return { params, update, clearFilters };
}
