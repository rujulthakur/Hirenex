import { cloneElement } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { fadeUp, useReducedMotionSafe } from '@/lib/motion';

/** Animates route changes with the fadeUp token. Respects prefers-reduced-motion. */
export function PageTransition() {
  const { pathname } = useLocation();
  const outlet = useOutlet();
  const variants = useReducedMotionSafe(fadeUp);
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={pathname} variants={variants} initial="hidden" animate="visible" exit="exit">
        {outlet ? cloneElement(outlet) : null}
      </motion.div>
    </AnimatePresence>
  );
}
