import { Drawer } from '@/components/ui';
import { copy } from '@/lib/copy';
import { useUiStore } from '@/stores';
import { SidebarContent } from './Sidebar';
import type { ActiveJob } from './useActiveJob';

/** Phone navigation: the same nav list inside a drawer opened from the top bar menu button. */
export function MobileNav({ active }: { active: ActiveJob }) {
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);
  return (
    <Drawer open={open} onClose={() => setOpen(false)} title={copy.shell.mobileNavTitle} initialWidth={300}>
      <SidebarContent active={active} collapsed={false} onNavigate={() => setOpen(false)} />
    </Drawer>
  );
}
