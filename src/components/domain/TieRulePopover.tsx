import { Info } from 'lucide-react';
import { Button, Popover } from '@/components/ui';
import { copy } from '@/lib/copy';

/** Usage: <TieRulePopover />. Shows the fixed five-step tie-break order. */
export function TieRulePopover() {
  return (
    <Popover label={copy.domain.tieTitle} trigger={(p) => (
      <Button {...p} variant="icon" aria-label={copy.domain.tieOpen}><Info className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /></Button>
    )}>
      <div className="flex w-64 flex-col gap-2 text-sm">
        <ol className="list-decimal pl-5">{copy.domain.tieRules.map((r) => (<li key={r}>{r}</li>))}</ol>
        <p className="text-xs text-muted">{copy.domain.tieNote}</p>
      </div>
    </Popover>
  );
}
