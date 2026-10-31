import { CheckCircle2 } from 'lucide-react';
import { copy } from '@/lib/copy';

/** Success view shown briefly after any sign-in method completes. */
export function SignedInState() {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-6 text-center">
      <CheckCircle2 aria-hidden="true" strokeWidth={1.5} className="h-10 w-10 text-success" />
      <p className="text-md font-medium">{copy.auth.signedIn}</p>
    </div>
  );
}
