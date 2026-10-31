import { cn } from '@/lib/cn';

type VariantMap = Record<string, Record<string, string>>;
type VariantProps<V extends VariantMap> = { [K in keyof V]?: keyof V[K] & string };

interface CvaConfig<V extends VariantMap> {
  variants: V;
  defaultVariants?: VariantProps<V>;
}

/**
 * Tiny class-variance helper (no library).
 * Usage: const button = cva('base', { variants: { size: { sm: '...', md: '...' } }, defaultVariants: { size: 'md' } });
 *        button({ size: 'sm' }) -> 'base ...'
 */
export function cva<V extends VariantMap>(base: string, config: CvaConfig<V>) {
  return (props: VariantProps<V> = {}, extra?: string): string => {
    const parts: string[] = [base];
    (Object.keys(config.variants) as Array<keyof V & string>).forEach((key) => {
      const chosen = props[key] ?? config.defaultVariants?.[key];
      if (chosen !== undefined) {
        parts.push(config.variants[key][chosen] ?? '');
      }
    });
    return cn(...parts, extra);
  };
}

export type { VariantProps };
