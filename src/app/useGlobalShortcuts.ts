import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommandPaletteHotkey } from '@/components/ui';
import { useAuthStore, useUiStore } from '@/stores';
import { isPathAllowed } from './guards';

const SEQUENCE_TIMEOUT_MS = 1200;

/** Second key after "G" mapped to a destination builder. Job-scoped entries need an active job. */
const GO_MAP: Record<string, { global?: string; job?: (jobId: string) => string }> = {
  d: { global: '/app' },
  j: { global: '/app/jobs' },
  a: { global: '/app/analytics' },
  n: { global: '/app/notifications' },
  o: { global: '/app/settings' },
  h: { global: '/app/help' },
  u: { job: (j) => `/app/jobs/${j}/upload` },
  c: { job: (j) => `/app/jobs/${j}/candidates` },
  s: { job: (j) => `/app/jobs/${j}/shortlist` },
  e: { job: (j) => `/app/jobs/${j}/schedule` },
  i: { job: (j) => `/app/jobs/${j}/invites` },
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

/**
 * The only place global keyboard shortcuts are registered. The visible list lives in copy.shortcuts.
 * Shortcuts are ignored while typing, with modifier keys held (except Ctrl/Cmd+K) or while a dialog is open.
 */
export function useGlobalShortcuts(activeJobId: string | null): void {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role ?? null);
  const pendingG = useRef<number | null>(null);

  useCommandPaletteHotkey(() => {
    const ui = useUiStore.getState();
    ui.setPaletteOpen(!ui.paletteOpen);
  });

  useEffect(() => {
    const clearPending = (): void => {
      if (pendingG.current !== null) {
        window.clearTimeout(pendingG.current);
        pendingG.current = null;
      }
    };

    const go = (path: string): void => {
      if (role && !isPathAllowed(role, path)) return;
      navigate(path);
    };

    const onKey = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;

      const key = e.key;
      if (pendingG.current !== null) {
        clearPending();
        const target = GO_MAP[key.toLowerCase()];
        if (target) {
          e.preventDefault();
          if (target.global) go(target.global);
          else if (target.job && activeJobId) go(target.job(activeJobId));
        }
        return;
      }
      if (key === '?') {
        e.preventDefault();
        useUiStore.getState().setShortcutsOpen(true);
      } else if (key === '[') {
        e.preventDefault();
        useUiStore.getState().toggleSidebar();
      } else if (key.toLowerCase() === 'g') {
        pendingG.current = window.setTimeout(() => {
          pendingG.current = null;
        }, SEQUENCE_TIMEOUT_MS);
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      clearPending();
    };
  }, [navigate, role, activeJobId]);
}
