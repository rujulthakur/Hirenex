import { useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toastError, toastSuccess } from '@/components/ui';
import { api } from '@/services';
import { qk } from '@/services/queryKeys';
import { useAuthStore, usePrefs, useProfileStore, useUiStore } from '@/stores';
import type { Preferences, ProfilePatch } from '@/types';
import { resizeToDataUrl } from './photo';

const SAVE_DELAY_MS = 800;

type PrefsValues = ReturnType<typeof usePrefs.getState>;
type UiValues = ReturnType<typeof useUiStore.getState>;

/** Everything personal that follows the HR user to any device. */
function toSnapshot(p: PrefsValues, ui: UiValues): Preferences {
  return {
    emailAlerts: p.emailAlerts, scoringDone: p.scoringDone, weeklyDigest: p.weeklyDigest, autoOpenResults: p.autoOpenResults,
    reduceMotion: p.reduceMotion, language: p.language, timeZone: p.timeZone,
    theme: ui.theme, density: ui.density, sidebarCollapsed: ui.sidebarCollapsed, blindMode: ui.blindMode,
  };
}

function usePreferenceSnapshot(): Preferences {
  const p = usePrefs();
  const ui = useUiStore();
  return toSnapshot(p, ui);
}

/**
 * Mount once in the app shell. Loads the saved profile from the server (photo, name, settings), applies it, and saves
 * any later change automatically. Nothing lives only in the browser, so clearing the cache or changing computer loses nothing.
 */
export function useProfileSync(): void {
  const query = useQuery({ queryKey: qk.profile.get, queryFn: () => api.profile.get(), staleTime: Infinity, retry: 1 });
  const snapshot = usePreferenceSnapshot();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setPhoto = useProfileStore((s) => s.setPhoto);
  const hydrated = useRef(false);
  const lastSaved = useRef('');
  const key = JSON.stringify(snapshot);

  useEffect(() => {
    const d = query.data;
    if (!d || hydrated.current) return;
    hydrated.current = true;
    setPhoto(d.avatar);
    if (user && d.name && d.name !== user.name) setUser({ ...user, name: d.name });
    const pr = d.preferences;
    const prefs = usePrefs.getState();
    const ui = useUiStore.getState();
    for (const k of ['emailAlerts', 'scoringDone', 'weeklyDigest', 'autoOpenResults', 'reduceMotion', 'language', 'timeZone'] as const) {
      const v = pr[k];
      if (v !== undefined) prefs.set(k, v as never);
    }
    if (pr.theme) ui.setTheme(pr.theme);
    if (pr.density) ui.setDensity(pr.density);
    if (pr.sidebarCollapsed !== undefined) ui.setSidebarCollapsed(pr.sidebarCollapsed);
    if (pr.blindMode !== undefined && pr.blindMode !== ui.blindMode) ui.toggleBlindMode();
    // First time on this account (nothing saved yet): leave it empty so this browser's settings get saved. Otherwise
    // remember what we just applied so it is not sent straight back.
    lastSaved.current = Object.keys(pr).length === 0 ? '' : JSON.stringify(toSnapshot(usePrefs.getState(), useUiStore.getState()));
  }, [query.data, user, setUser, setPhoto]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (key === lastSaved.current) return;
    const t = window.setTimeout(() => {
      api.profile.save({ preferences: JSON.parse(key) as Preferences }).then(() => { lastSaved.current = key; }).catch(() => undefined);
    }, SAVE_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [key, query.data]);
}

/** Photo and name actions shared by Settings and the profile menu. Every change is saved on the account. */
export function useProfileActions() {
  const setPhoto = useProfileStore((s) => s.setPhoto);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const save = useMutation({ mutationFn: (patch: ProfilePatch) => api.profile.save(patch) });

  const uploadPhoto = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    try {
      const url = await resizeToDataUrl(file);
      await save.mutateAsync({ avatar: url });
      setPhoto(url);
      toastSuccess('Profile photo saved');
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Could not save the photo');
    }
  };
  const removePhoto = async (): Promise<void> => {
    try {
      await save.mutateAsync({ avatar: null });
      setPhoto(null);
      toastSuccess('Profile photo removed');
    } catch {
      toastError('Could not remove the photo');
    }
  };
  const saveName = async (name: string): Promise<void> => {
    try {
      const p = await save.mutateAsync({ name });
      if (user) setUser({ ...user, name: p.name });
      toastSuccess('Name saved');
    } catch {
      toastError('Could not save the name');
    }
  };
  return { uploadPhoto, removePhoto, saveName, saving: save.isPending };
}
