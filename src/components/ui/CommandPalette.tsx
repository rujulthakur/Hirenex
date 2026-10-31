import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Command } from 'cmdk';
import { copy } from '@/lib/copy';
import { Kbd } from './Kbd';

export interface PaletteCommand {
  id: string;
  label: string;
  group: string;
  icon?: ReactNode;
  shortcut?: string[];
  keywords?: string[];
  disabled?: boolean;
  /** Shown under a disabled command to explain why it is unavailable. */
  disabledReason?: string;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: PaletteCommand[];
}

const RECENT_KEY = 'trusthire-recent-commands';
const RECENT_MAX = 5;

function readRecent(): string[] {
  try {
    const raw = sessionStorage.getItem(RECENT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeRecent(ids: string[]): void {
  try {
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable: recents are optional */
  }
}

/** Registers Cmd/Ctrl+K and calls onToggle. Use once near the app root. */
export function useCommandPaletteHotkey(onToggle: () => void): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onToggle();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onToggle]);
}

const itemClass =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 text-base text-text data-[selected=true]:bg-surface-2 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60';
const groupClass =
  'px-1 py-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-muted';

/** Usage: <CommandPalette open onOpenChange commands={[...]} />. Glass/blur is allowed here only. */
export function CommandPalette({ open, onOpenChange, commands }: CommandPaletteProps) {
  const [recent, setRecent] = useState<string[]>(readRecent);
  const byId = new Map(commands.map((c) => [c.id, c]));
  const recentCmds = recent
    .map((id) => byId.get(id))
    .filter((c): c is PaletteCommand => c !== undefined && !c.disabled);
  const groups = Array.from(new Set(commands.map((c) => c.group)));

  const run = (c: PaletteCommand) => {
    if (c.disabled) return;
    const next = [c.id, ...recent.filter((x) => x !== c.id)].slice(0, RECENT_MAX);
    setRecent(next);
    writeRecent(next);
    onOpenChange(false);
    c.onSelect();
  };

  const renderItem = (c: PaletteCommand, scope: string) => (
    <Command.Item
      key={`${scope}:${c.id}`}
      value={`${scope}:${c.id}`}
      keywords={[c.label, ...(c.keywords ?? [])]}
      disabled={c.disabled}
      onSelect={() => run(c)}
      className={itemClass}
    >
      {c.icon}
      <span className="flex min-w-0 flex-1 flex-col">
        <span>{c.label}</span>
        {c.disabled && c.disabledReason ? <span className="text-xs text-muted">{c.disabledReason}</span> : null}
      </span>
      {c.shortcut ? (
        <span className="flex items-center gap-1">
          {c.shortcut.map((k) => (
            <Kbd key={k}>{k}</Kbd>
          ))}
        </span>
      ) : null}
    </Command.Item>
  );

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label={copy.overlays.paletteLabel}
      overlayClassName="fixed inset-0 z-50 bg-overlay"
      contentClassName="fixed left-1/2 top-24 z-50 w-[min(40rem,92vw)] -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-glass shadow-lg backdrop-blur-md"
    >
      <Command.Input
        placeholder={copy.overlays.palettePlaceholder}
        className="h-12 w-full border-b border-border bg-transparent px-4 text-md text-text placeholder:text-muted focus-visible:outline-none"
      />
      <Command.List className="max-h-80 overflow-y-auto p-1">
        <Command.Empty className="px-4 py-6 text-center text-base text-muted">{copy.overlays.paletteEmpty}</Command.Empty>
        {recentCmds.length > 0 ? (
          <Command.Group heading={copy.overlays.paletteRecent} className={groupClass}>
            {recentCmds.map((c) => renderItem(c, 'recent'))}
          </Command.Group>
        ) : null}
        {groups.map((g) => (
          <Command.Group key={g} heading={g} className={groupClass}>
            {commands.filter((c) => c.group === g).map((c) => renderItem(c, 'all'))}
          </Command.Group>
        ))}
      </Command.List>
    </Command.Dialog>
  );
}
