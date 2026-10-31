import { Suspense } from 'react';
import { CommandPalette } from '@/components/ui';
import { copy } from '@/lib/copy';
import { useUiStore } from '@/stores';
import { EvidenceDrawer } from '@/features/candidates/components/EvidenceDrawer';
import { MobileNav } from './MobileNav';
import { NotificationPanel, useNotifications } from './NotificationPanel';
import { OfflineBanner } from './OfflineBanner';
import { PageTransition } from './PageTransition';
import { ShortcutsDialog } from './ShortcutsDialog';
import { SkeletonFallback } from './SkeletonFallback';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useActiveJob } from './useActiveJob';
import { useCommands } from './useCommands';
import { useProfileSync } from '@/features/settings/useProfile';
import { useGlobalShortcuts } from './useGlobalShortcuts';

/** Authenticated layout: sidebar, top bar, palette, panels and animated page outlet. */
export function AppShell() {
  const active = useActiveJob();
  const paletteOpen = useUiStore((s) => s.paletteOpen);
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const commands = useCommands(active.jobId);
  useGlobalShortcuts(active.jobId);
  useNotifications();
  useProfileSync();

  return (
    <div className="flex min-h-screen bg-bg text-text">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-surface-2 focus:p-2">
        {copy.common.skipToContent}
      </a>
      <Sidebar active={active} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar jobId={active.jobId} />
        <OfflineBanner />
        <main id="main" tabIndex={-1} aria-label={copy.shell.mainRegion} className="min-w-0 flex-1 outline-none">
          <Suspense fallback={<SkeletonFallback />}>
            <PageTransition />
          </Suspense>
        </main>
      </div>
      <MobileNav active={active} />
      <NotificationPanel />
      <ShortcutsDialog />
      <EvidenceDrawer />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} commands={commands} />
    </div>
  );
}
