import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light';
export type Density = 'comfortable' | 'compact';

interface UiState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  paletteOpen: boolean;
  shortcutsOpen: boolean;
  theme: Theme;
  density: Density;
  /** Blind mode swaps candidate names for "Candidate ##" everywhere. */
  blindMode: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setMobileNavOpen: (v: boolean) => void;
  setPaletteOpen: (v: boolean) => void;
  setShortcutsOpen: (v: boolean) => void;
  setTheme: (t: Theme) => void;
  setDensity: (d: Density) => void;
  toggleBlindMode: () => void;
}

/** Only harmless UI preferences are persisted (never tokens or personal data). */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      paletteOpen: false,
      shortcutsOpen: false,
      theme: 'dark',
      density: 'comfortable',
      blindMode: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setMobileNavOpen: (v) => set({ mobileNavOpen: v }),
      setPaletteOpen: (v) => set({ paletteOpen: v }),
      setShortcutsOpen: (v) => set({ shortcutsOpen: v }),
      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density }),
      toggleBlindMode: () => set((s) => ({ blindMode: !s.blindMode })),
    }),
    {
      name: 'trusthire-ui',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, theme: s.theme, density: s.density }),
    },
  ),
);
