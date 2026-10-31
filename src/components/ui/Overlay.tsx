import { useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { drawerSlide, duration, easing, scaleIn, useReducedMotionSafe } from '@/lib/motion';
import type { Variants } from 'framer-motion';
import { useOverlayBehavior } from './overlayHooks';

const backdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.base, ease: easing.standard } },
  exit: { opacity: 0, transition: { duration: duration.fast, ease: easing.standard } },
};

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  placement: 'center' | 'right';
  panelClassName?: string;
  panelStyle?: CSSProperties;
  children: ReactNode;
}

function OverlayInner({
  onClose,
  labelledBy,
  describedBy,
  placement,
  panelClassName,
  panelStyle,
  children,
}: Omit<OverlayProps, 'open'>) {
  const ref = useRef<HTMLDivElement>(null);
  useOverlayBehavior(ref, onClose);
  const backdropV = useReducedMotionSafe(backdrop);
  const panelV = useReducedMotionSafe(placement === 'right' ? drawerSlide : scaleIn);
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex',
        placement === 'center' ? 'items-center justify-center p-4' : 'justify-end',
      )}
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-overlay"
        variants={backdropV}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
      />
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={cn('relative outline-none', panelClassName)}
        style={panelStyle}
        variants={panelV}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Shared portal + backdrop + animated panel used by Dialog and Drawer. */
export function Overlay({ open, ...rest }: OverlayProps) {
  return createPortal(
    <AnimatePresence>{open ? <OverlayInner key="overlay" {...rest} /> : null}</AnimatePresence>,
    document.body,
  );
}
