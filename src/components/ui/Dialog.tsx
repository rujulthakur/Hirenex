import { useId } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { copy } from '@/lib/copy';
import { Button } from './Button';
import { Overlay } from './Overlay';

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' } as const;

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof sizes;
}

/** Usage: <Dialog open={o} onClose={close} title="Title" footer={<Button>OK</Button>}>body</Dialog>. Traps focus, ESC closes, returns focus. */
export function Dialog({ open, onClose, title, description, children, footer, size = 'md' }: DialogProps) {
  const uid = useId();
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;
  return (
    <Overlay
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={description ? descId : undefined}
      placement="center"
      panelClassName={cn(
        'flex max-h-[85vh] w-full flex-col rounded-lg border border-border bg-surface-1 shadow-lg',
        sizes[size],
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="flex flex-col gap-1">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          {description ? (
            <p id={descId} className="text-base text-muted">
              {description}
            </p>
          ) : null}
        </div>
        <Button variant="icon" aria-label={copy.overlays.close} onClick={onClose}>
          <X aria-hidden="true" strokeWidth={1.5} className="h-5 w-5" />
        </Button>
      </header>
      {children ? <div className="overflow-y-auto p-4">{children}</div> : null}
      {footer ? <footer className="flex flex-wrap justify-end gap-2 border-t border-border p-4">{footer}</footer> : null}
    </Overlay>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  loading?: boolean;
}

/** Usage: <ConfirmDialog open onClose onConfirm title description tone="danger" confirmLabel="Delete" /> */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = copy.overlays.confirm,
  cancelLabel = copy.overlays.cancel,
  tone = 'default',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
