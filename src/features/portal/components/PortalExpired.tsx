import { Clock } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { copy } from '@/lib/copy';

/** Shown for TOKEN_EXPIRED. Never reveals whether a token ever existed. */
export function PortalExpired() {
  return <EmptyState icon={Clock} title={copy.portal.expiredTitle} description={copy.portal.expiredBody} />;
}
