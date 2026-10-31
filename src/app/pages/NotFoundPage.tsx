import { Link } from 'react-router-dom';
import { copy } from '@/lib/copy';

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="font-mono text-4xl text-muted" aria-hidden="true">404</p>
      <h1 className="text-2xl font-semibold">{copy.errors.notFoundTitle}</h1>
      <p className="text-muted">{copy.errors.notFoundBody}</p>
      <p className="text-sm text-muted">{copy.errors.notFoundHint}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/app" className="rounded-md bg-primary min-h-11 px-4 py-2 font-medium text-primary-fg focus-visible:shadow-focus">{copy.common.goHome}</Link>
        <Link to="/" className="rounded-md border border-border min-h-11 px-4 py-2 focus-visible:shadow-focus">{copy.auth.backToHome}</Link>
      </div>
    </main>
  );
}
