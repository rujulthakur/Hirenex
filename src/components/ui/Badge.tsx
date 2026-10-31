import type { HTMLAttributes } from 'react';
import { cva } from './cva';
import type { VariantProps } from './cva';

const badgeStyles = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-surface-2 text-muted',
        primary: 'border-primary text-primary',
        success: 'border-success text-success',
        warning: 'border-warning text-warning',
        danger: 'border-danger text-danger',
        info: 'border-info text-info',
      },
      outline: {
        solid: 'bg-surface-2',
        dashed: 'border-dashed bg-transparent',
      },
    },
    defaultVariants: { tone: 'neutral', outline: 'solid' },
  },
);

type StyleProps = VariantProps<{
  tone: { neutral: string; primary: string; success: string; warning: string; danger: string; info: string };
  outline: { solid: string; dashed: string };
}>;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, StyleProps {}

/** Usage: <Badge tone="success">Verified</Badge>. outline="dashed" = AI-proposed look. Never colour-only: keep text. */
export function Badge({ tone, outline, className, ...rest }: BadgeProps) {
  return <span className={badgeStyles({ tone, outline }, className)} {...rest} />;
}
