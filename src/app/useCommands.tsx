import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Keyboard, LogOut, PanelLeft, Plus, Sun } from 'lucide-react';
import type { PaletteCommand } from '@/components/ui';
import { copy } from '@/lib/copy';
import { useAuthStore, useUiStore } from '@/stores';
import { BOTTOM_ITEMS, JOB_ITEMS, WORKSPACE_ITEMS, visibleFor } from './navItems';

/** Builds the command palette list. Disabled commands carry a reason line. */
export function useCommands(jobId: string | null): PaletteCommand[] {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role ?? null);
  const logout = useAuthStore((s) => s.logout);
  const ui = useUiStore();
  const c = copy.shell.commands;

  return useMemo(() => {
    const nav = visibleFor([...WORKSPACE_ITEMS, ...JOB_ITEMS, ...BOTTOM_ITEMS], role).map<PaletteCommand>((i) => {
      const Icon = i.icon;
      const blocked = i.needsJob === true && !jobId;
      return {
        id: `go-${i.id}`,
        label: i.label,
        group: c.groupNavigate,
        icon: <Icon size={16} strokeWidth={1.5} aria-hidden="true" />,
        disabled: blocked,
        disabledReason: blocked ? c.needsJob : undefined,
        onSelect: () => navigate(i.to(jobId)),
      };
    });
    const list: PaletteCommand[] = [
      ...nav,
      { id: 'new-job', label: copy.shell.newJob, group: c.groupActions, icon: <Plus size={16} aria-hidden="true" />, onSelect: () => navigate('/app/jobs/new') },
      { id: 'blind', label: c.toggleBlind, group: c.groupView, icon: <Eye size={16} aria-hidden="true" />, onSelect: ui.toggleBlindMode },
      { id: 'theme', label: c.toggleTheme, group: c.groupView, icon: <Sun size={16} aria-hidden="true" />, onSelect: () => ui.setTheme(ui.theme === 'dark' ? 'light' : 'dark') },
      { id: 'sidebar', label: c.toggleSidebar, group: c.groupView, icon: <PanelLeft size={16} aria-hidden="true" />, shortcut: ['['], onSelect: ui.toggleSidebar },
      { id: 'shortcuts', label: c.showShortcuts, group: c.groupView, icon: <Keyboard size={16} aria-hidden="true" />, shortcut: ['?'], onSelect: () => ui.setShortcutsOpen(true) },
      { id: 'signout', label: c.signOut, group: c.groupActions, icon: <LogOut size={16} aria-hidden="true" />, onSelect: () => void logout().then(() => navigate('/login')) },
    ];
    return list;
  }, [role, jobId, ui, navigate, logout, c]);
}
