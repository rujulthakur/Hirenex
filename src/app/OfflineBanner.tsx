import { useEffect, useState } from 'react';
import { Banner } from '@/components/ui';
import { copy } from '@/lib/copy';

/** Shows a warning banner while navigator.onLine is false. Announced politely to screen readers. */
export function OfflineBanner() {
  const [online, setOnline] = useState<boolean>(() => typeof navigator === 'undefined' || navigator.onLine);
  useEffect(() => {
    const on = (): void => setOnline(true);
    const off = (): void => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return (
    <div role="status" aria-live="polite">
      {online ? null : <Banner tone="offline">{copy.shell.offline}</Banner>}
    </div>
  );
}
