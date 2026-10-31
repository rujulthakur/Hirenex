import { useCallback } from 'react';
import { useUiStore } from '@/stores';
import type { Candidate } from '@/types';
import { displayNameFor } from '../candidatesModel';

/**
 * Returns a function that gives the name to show for a candidate. With blind mode on (uiStore) it returns
 * "Candidate ##" instead of the real name, so every screen that uses it hides names at once.
 * Usage: const nameOf = useCandidateName(); <span>{nameOf(candidate)}</span>.
 */
export function useCandidateName(): (c: Pick<Candidate, 'displayName' | 'blindLabel'>) => string {
  const blind = useUiStore((s) => s.blindMode);
  return useCallback((c) => displayNameFor(c, blind), [blind]);
}
