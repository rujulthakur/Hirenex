import { Bot, Check, User } from 'lucide-react';
import { cn } from '@/lib/cn';
import { copy } from '@/lib/copy';
import type { Authority } from '@/types';

const icon = { ai: Bot, code: Check, human: User } as const;
const style = {
  ai: 'border-dashed border-primary text-primary bg-transparent',
  code: 'border-solid border-success text-success bg-transparent',
  human: 'border-solid border-primary bg-primary text-primary-fg',
} as const satisfies Record<Authority, string>;

interface Props { authority: Authority; variant?: 'inline' | 'block'; className?: string }

/** Usage: <AuthorityMarker authority="ai" />. AI = dashed, code = solid + check, human = filled. */
export function AuthorityMarker({ authority, variant = 'inline', className }: Props) {
  const Icon = icon[authority];
  const label = copy.domain.authority[authority];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border text-xs font-medium',
        variant === 'inline' ? 'rounded-full px-2 py-0.5' : 'w-full rounded-md px-3 py-2',
        style[authority], className,
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
      {label}
    </span>
  );
}
