import toast, { Toaster } from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { copy } from '@/lib/copy';

const style = {
  background: 'var(--color-surface-2)',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--text-base, 0.875rem)',
} as const;

/** Mount once (AppProviders). Toasts are announced via react-hot-toast's live region. */
export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style,
        success: { iconTheme: { primary: 'var(--color-success)', secondary: 'var(--color-bg)' } },
        error: { iconTheme: { primary: 'var(--color-danger)', secondary: 'var(--color-bg)' } },
      }}
    />
  );
}

export const toastSuccess = (message: string): string => toast.success(message);
export const toastError = (message: string): string => toast.error(message);
export const toastInfo = (message: string): string => toast(message);

/** "Logged as audit #seq" variant for overrides and other audited actions. */
export const toastAudit = (seq: number): string =>
  toast(copy.overlays.auditLogged(seq), {
    icon: <ShieldCheck aria-hidden="true" strokeWidth={1.5} className="h-5 w-5 text-success" />,
  });
