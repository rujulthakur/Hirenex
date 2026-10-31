import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { AppToaster } from '@/components/ui';
import { queryClient } from '@/services/queryClient';
import { useUiStore, usePrefs } from '@/stores';

interface AppProvidersProps {
  children: ReactNode;
}

/** Root providers: TanStack Query, Framer Motion (honours prefers-reduced-motion), toaster and theme attribute. */
export function AppProviders({ children }: AppProvidersProps) {
  const theme = useUiStore((s) => s.theme);
  const reduceMotion = usePrefs((s) => s.reduceMotion);
  useEffect(() => {
    document.documentElement.classList.toggle('no-motion', reduceMotion);
  }, [reduceMotion]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        {children}
        <AppToaster />
      </MotionConfig>
    </QueryClientProvider>
  );
}
