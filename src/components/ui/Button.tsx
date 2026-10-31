import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cva } from './cva';
import type { VariantProps } from './cva';
import { Spinner } from './Spinner';

const buttonStyles = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-fast ease-standard disabled:cursor-not-allowed disabled:opacity-50 focus-visible:shadow-focus',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-fg hover:brightness-110',
        secondary: 'bg-surface-2 text-text border border-border hover:bg-surface-1',
        ghost: 'bg-transparent text-text hover:bg-surface-2',
        outline: 'bg-transparent text-text border border-border hover:bg-surface-2',
        danger: 'bg-danger text-primary-fg hover:brightness-110',
        icon: 'bg-transparent text-muted hover:bg-surface-2 hover:text-text',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-11 px-6 text-md',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

type StyleProps = VariantProps<{
  variant: { primary: string; secondary: string; ghost: string; outline: string; danger: string; icon: string };
  size: { sm: string; md: string; lg: string };
}>;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, StyleProps {
  loading?: boolean;
}

/**
 * Usage: <Button variant="primary" loading={pending}>Save</Button>
 * Icon buttons must pass aria-label. Icon variant is a 44px touch target.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, loading = false, disabled, className, children, type = 'button', ...rest },
  ref,
) {
  const iconSize = variant === 'icon' ? 'h-11 w-11 p-0' : '';
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size }, `${iconSize} ${className ?? ''}`.trim())}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : null}
      {children}
    </button>
  );
});
