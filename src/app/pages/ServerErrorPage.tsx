import { Link } from 'react-router-dom';
import { copy } from '@/lib/copy';

export default function ServerErrorPage() {
  return (
    <main role="alert" className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="font-mono text-4xl text-muted" aria-hidden="true">500</p>
      <h1 className="text-2xl font-semibold">{copy.errors.serverTitle}</h1>
      <p className="text-muted">{copy.errors.serverBody}</p>
      <p className="text-sm text-muted">{copy.errors.serverHint}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => window.location.reload()} className="rounded-md bg-primary min-h-11 px-4 py-2 font-medium text-primary-fg focus-visible:shadow-focus">{copy.errors.reload}</button>
        <Link to="/app" className="rounded-md border border-border min-h-11 px-4 py-2 focus-visible:shadow-focus">{copy.common.goHome}</Link>
        <Link to="/login" className="rounded-md border border-border min-h-11 px-4 py-2 focus-visible:shadow-focus">{copy.errors.signIn}</Link>
      </div>
    </main>
  );
}
