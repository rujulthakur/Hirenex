import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Warns before leaving with unsaved changes: in-app navigation is blocked and exposed as `blocked`
 * (render a ConfirmDialog and call `proceed` or `stay`), and a tab close or reload triggers the browser prompt.
 */
export function useUnsavedGuard(when: boolean) {
  const blocker = useBlocker(when);

  useEffect(() => {
    if (!when) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [when]);

  return {
    blocked: blocker.state === 'blocked',
    proceed: () => {
      if (blocker.state === 'blocked') blocker.proceed();
    },
    stay: () => {
      if (blocker.state === 'blocked') blocker.reset();
    },
  };
}
