import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { copy } from '@/lib/copy';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

/** Usage: <ErrorState message={err.message} onRetry={refetch} /> */
export function ErrorState({ title = copy.errors.serverTitle, message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-danger px-6 py-12 text-center"
    >
      <AlertTriangle aria-hidden="true" strokeWidth={1.5} className="h-8 w-8 text-danger" />
      <h3 className="text-md font-medium">{title}</h3>
      <p className="max-w-sm text-base text-muted">{message}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          {copy.common.retry}
        </Button>
      ) : null}
    </div>
  );
}
