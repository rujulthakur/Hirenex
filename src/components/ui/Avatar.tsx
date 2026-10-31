import { cn } from '@/lib/cn';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'h-6 w-6 text-xs', md: 'h-8 w-8 text-sm', lg: 'h-11 w-11 text-md' } as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

/** Usage: <Avatar name="Asha Rao" />. Initials only (no photos: blind scoring friendly). */
export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 font-medium text-text',
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
