import type { WizardValues } from './schemas';

/**
 * Wizard draft autosave. sessionStorage only (never localStorage): a draft lives and dies with the browser tab.
 * Drafts hold job form values, never tokens or credentials.
 */
const PREFIX = 'trusthire.jobDraft.';

export const NEW_JOB_DRAFT_KEY = 'new';

interface StoredDraft {
  step: number;
  values: WizardValues;
}

function isStoredDraft(value: unknown): value is StoredDraft {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.step !== 'number') return false;
  const vals = v.values;
  if (typeof vals !== 'object' || vals === null) return false;
  const r = vals as Record<string, unknown>;
  return (
    typeof r.title === 'string' &&
    typeof r.description === 'string' &&
    Array.isArray(r.skills) &&
    Array.isArray(r.criteria) &&
    Array.isArray(r.interviewers) &&
    typeof r.constraints === 'object' &&
    r.constraints !== null
  );
}

export function loadDraft(key: string): StoredDraft | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDraft(key: string, step: number, values: WizardValues): void {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify({ step, values }));
  } catch {
    /* storage full or unavailable: autosave is a convenience only */
  }
}

export function clearDraft(key: string): void {
  try {
    sessionStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}
