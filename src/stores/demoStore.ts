import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** The 6 live-demo steps in order. */
export const DEMO_STEPS = ['upload', 'evidence', 'override', 'approve', 'invite', 'decline'] as const;
export type DemoStep = (typeof DEMO_STEPS)[number];

interface DemoState {
  /** True when the backend (or env flag) says demo mode is on. */
  demoMode: boolean;
  panelOpen: boolean;
  panelCollapsed: boolean;
  completed: DemoStep[];
  setDemoMode: (v: boolean) => void;
  setPanelOpen: (v: boolean) => void;
  setPanelCollapsed: (v: boolean) => void;
  completeStep: (s: DemoStep) => void;
  resetSteps: () => void;
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      demoMode: false,
      panelOpen: false,
      panelCollapsed: false,
      completed: [],
      setDemoMode: (demoMode) => set({ demoMode }),
      setPanelOpen: (panelOpen) => set({ panelOpen }),
      setPanelCollapsed: (panelCollapsed) => set({ panelCollapsed }),
      completeStep: (s) => set((st) => (st.completed.includes(s) ? st : { completed: [...st.completed, s] })),
      resetSteps: () => set({ completed: [] }),
    }),
    {
      name: 'trusthire-demo',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ panelCollapsed: s.panelCollapsed, completed: s.completed }),
    },
  ),
);
