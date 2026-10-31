import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

/** Usage: <EmptyState title="No jobs yet" description="..." action={<Button>New job</Button>} /> */
export function EmptyState({ title, description, icon: Icon = Inbox, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
      <Icon aria-hidden="true" strokeWidth={1.5} className="h-8 w-8 text-muted" />
      <h3 className="text-md font-medium">{title}</h3>
      {description ? <p className="max-w-sm text-base text-muted">{description}</p> : null}
      {action}
    </div>
  );
}
