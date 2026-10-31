import { Dialog, Kbd } from '@/components/ui';
import { copy } from '@/lib/copy';
import { useUiStore } from '@/stores';

interface Row {
  keys: readonly string[];
  label: string;
}

function Group({ title, rows }: { title: string; rows: readonly Row[] }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium text-muted">{title}</h3>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-3 text-base">
            <span>{r.label}</span>
            <span className="flex items-center gap-1">
              {r.keys.map((k, i) => (
                <span key={`${k}-${i}`} className="flex items-center gap-1">
                  {i > 0 && r.keys[0] === 'G' ? <span className="text-xs text-muted">{copy.shell.shortcuts.then}</span> : null}
                  <Kbd>{k}</Kbd>
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Opened with "?" via useGlobalShortcuts. The list is read from copy.shortcuts only. */
export function ShortcutsDialog() {
  const open = useUiStore((s) => s.shortcutsOpen);
  const setOpen = useUiStore((s) => s.setShortcutsOpen);
  return (
    <Dialog open={open} onClose={() => setOpen(false)} title={copy.shell.shortcuts.title} description={copy.shell.shortcuts.description} size="lg">
      <div className="space-y-4 p-4">
        <Group title={copy.shell.shortcuts.groupGeneral} rows={copy.shortcuts.general} />
        <Group title={copy.shell.shortcuts.groupGo} rows={copy.shortcuts.go} />
        <Group title={copy.shell.shortcuts.groupJob} rows={copy.shortcuts.job} />
      </div>
    </Dialog>
  );
}
