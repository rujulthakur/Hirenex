import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Prefs {
  emailAlerts: boolean;
  scoringDone: boolean;
  weeklyDigest: boolean;
  autoOpenResults: boolean;
  reduceMotion: boolean;
  language: string;
  timeZone: string;
}

interface PrefsState extends Prefs {
  set: <K extends keyof Prefs>(k: K, v: Prefs[K]) => void;
  reset: () => void;
}

const defaults: Prefs = {
  emailAlerts: true,
  scoringDone: true,
  weeklyDigest: false,
  autoOpenResults: true,
  reduceMotion: false,
  language: 'en',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
};

/** Harmless personal preferences, kept in this browser only. */
export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({ ...defaults, set: (k, v) => set({ [k]: v } as Partial<Prefs>), reset: () => set(defaults) }),
    { name: 'trusthire-prefs' },
  ),
);
