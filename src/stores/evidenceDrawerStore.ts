import { create } from 'zustand';

interface EvidenceDrawerState {
  /** Candidate whose evidence is open, or null when the drawer is closed. */
  candidateId: string | null;
  /** Job the candidate belongs to (needed for links and cache keys). */
  jobId: string | null;
  /** Ordered ids of the list the drawer was opened from, so j and k can step to the previous or next candidate. */
  siblingIds: string[];
  open: (candidateId: string, jobId: string, siblingIds?: string[]) => void;
  close: () => void;
  /** Moves to the previous (-1) or next (1) candidate in siblingIds. Does nothing at either end. */
  step: (direction: -1 | 1) => void;
}

/**
 * Opens the evidence drawer from any page: useEvidenceDrawerStore.getState().open(id, jobId, ids).
 * Only UI state lives here; the candidate itself comes from TanStack Query.
 */
export const useEvidenceDrawerStore = create<EvidenceDrawerState>((set, get) => ({
  candidateId: null,
  jobId: null,
  siblingIds: [],
  open: (candidateId, jobId, siblingIds = []) => set({ candidateId, jobId, siblingIds }),
  close: () => set({ candidateId: null, siblingIds: [] }),
  step: (direction) => {
    const { candidateId, siblingIds } = get();
    if (candidateId === null) return;
    const at = siblingIds.indexOf(candidateId);
    const next = siblingIds[at + direction];
    if (at !== -1 && next !== undefined) set({ candidateId: next });
  },
}));
