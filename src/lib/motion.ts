import { useReducedMotion } from 'framer-motion';
import type { Transition, Variants } from 'framer-motion';

/** Duration tokens in seconds (Framer Motion units). */
export const duration = {
  instant: 0.08,
  fast: 0.14,
  base: 0.22,
  slow: 0.36,
} as const;

/** Easing tokens. */
export const easing = {
  standard: [0.2, 0, 0, 1],
  emphasized: [0.3, 0, 0, 1],
} as const;

/** Spring tokens. */
export const spring = {
  soft: { type: 'spring', stiffness: 260, damping: 28 },
  snappy: { type: 'spring', stiffness: 420, damping: 32 },
} as const satisfies Record<string, Transition>;

/** Stagger limits: never animate more than this many list items. */
export const STAGGER_MAX_ITEMS = 12;
export const STAGGER_STEP = 0.03;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.base, ease: easing.standard } },
  exit: { opacity: 0, y: 4, transition: { duration: duration.fast, ease: easing.standard } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: duration.base, ease: easing.standard } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: duration.fast, ease: easing.standard } },
};

export const drawerSlide: Variants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { duration: duration.slow, ease: easing.emphasized } },
  exit: { x: '100%', transition: { duration: duration.base, ease: easing.standard } },
};

export const listStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER_STEP } },
};

/** Variants that collapse to instant opacity changes when reduced motion is on. */
export const reducedVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

/** Returns the given variants, or instant ones when the user prefers reduced motion. */
export function useReducedMotionSafe(variants: Variants): Variants {
  const reduce = useReducedMotion();
  return reduce ? reducedVariants : variants;
}

/** Horizontal shake keyframes for error feedback (skipped under reduced motion). */
export const shakeX: number[] = [0, -6, 6, -4, 4, 0];
