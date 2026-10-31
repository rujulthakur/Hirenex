import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { copy } from '@/lib/copy';
import { fadeUp, useReducedMotionSafe } from '@/lib/motion';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  banner?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/** Centered card layout shared by /login and /verify. Includes the persistent synthetic-data and test-inbox chips. */
export function AuthLayout({ title, subtitle, banner, children, footer }: AuthLayoutProps) {
  const variants = useReducedMotionSafe(fadeUp);
  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <a href="#auth-main" className="sr-only focus:not-sr-only">
        {copy.common.skipToContent}
      </a>
      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <Link to="/login" className="flex items-center gap-2 rounded-md font-semibold focus-visible:shadow-focus">
          <ShieldCheck aria-hidden="true" strokeWidth={1.5} className="h-5 w-5 text-primary" />
          {copy.app.name}
        </Link>
      </header>
      <main id="auth-main" className="flex flex-1 items-center justify-center px-4 pb-16">
        <motion.div
          variants={variants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm rounded-lg border border-border bg-surface-1 p-6"
        >
          {banner ? <div className="mb-4">{banner}</div> : null}
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle ? <p className="mt-1 text-base text-muted">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
          {footer ? <div className="mt-6 border-t border-border pt-4 text-sm text-muted">{footer}</div> : null}
        </motion.div>
      </main>
      <footer className="px-4 pb-6 text-center text-xs text-muted">{copy.auth.brandTagline}</footer>
    </div>
  );
}
