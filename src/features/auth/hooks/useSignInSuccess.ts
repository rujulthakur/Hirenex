import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { z } from 'zod';
import { useAuthStore } from '@/stores';
import type { User } from '@/types';

const FromStateSchema = z.object({ from: z.string().optional() });

/** Reads the post-login target from router state. Only in-app paths are accepted (no open redirect). */
export function readFrom(state: unknown): string {
  const parsed = FromStateSchema.safeParse(state);
  const from = parsed.success ? parsed.data.from : undefined;
  return from && from.startsWith('/app') ? from : '/app';
}

/**
 * Shared "signed in" step for OTP, Google and demo login: stores the user, shows a short success state,
 * then navigates to the page the visitor originally wanted. Delay is 0 under reduced motion.
 */
export function useSignInSuccess() {
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const location = useLocation();
  const reduce = useReducedMotion();
  const [done, setDone] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const complete = useCallback(
    (user: User) => {
      setUser(user);
      setDone(true);
      const target = readFrom(location.state);
      timer.current = window.setTimeout(() => navigate(target, { replace: true }), reduce ? 0 : 700);
    },
    [setUser, navigate, location.state, reduce],
  );

  return { done, complete };
}
