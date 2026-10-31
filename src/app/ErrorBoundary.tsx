import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { copy } from '@/lib/copy';

interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}

/** Catches render errors and offers recovery actions. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <main role="alert" className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold">{copy.errors.serverTitle}</h1>
        <p className="text-muted">{copy.errors.serverBody}</p>
        <p className="text-sm text-muted">{copy.errors.serverHint}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 font-medium text-primary-fg"
            onClick={() => this.setState({ hasError: false })}
          >
            {copy.common.retry}
          </button>
          <button type="button" className="rounded-md border border-border px-4 py-2" onClick={() => window.location.reload()}>
            {copy.errors.reload}
          </button>
          <a href="/app" className="rounded-md border border-border px-4 py-2">
            {copy.common.goHome}
          </a>
        </div>
      </main>
    );
  }
}
