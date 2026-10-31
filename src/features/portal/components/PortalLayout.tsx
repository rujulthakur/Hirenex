import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { APP_NAME } from '@/lib/config';
import { copy } from '@/lib/copy';

interface Props {
  /** Document title for the page. */
  title: string;
  children: ReactNode;
}

/** Mobile-first public shell for candidate pages: header, main landmark, footer. No sidebar, no login. */
export function PortalLayout({ title, children }: Props) {
  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`;
  }, [title]);
  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-surface-2 focus:p-2">
        {copy.common.skipToContent}
      </a>
      <header className="border-b border-border bg-surface-1">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2 px-4 py-3">
          <p className="text-md font-semibold">{copy.app.name}</p>
          <div className="flex flex-wrap justify-end gap-2">
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} aria-label={copy.portal.mainLabel} className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6 outline-none">
        {children}
      </main>
      <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted">{copy.portal.footerNote}</footer>
    </div>
  );
}
