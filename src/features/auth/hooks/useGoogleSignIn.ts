import { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID } from '@/lib/config';

interface GoogleCredentialResponse {
  credential: string;
}
interface GoogleIdApi {
  initialize: (config: { client_id: string; callback: (r: GoogleCredentialResponse) => void }) => void;
  renderButton: (
    parent: HTMLElement,
    options: { theme: 'outline' | 'filled_black'; size: 'large'; text: 'signin_with'; shape: 'rectangular'; width?: number },
  ) => void;
}
interface GoogleWindow extends Window {
  google?: { accounts: { id: GoogleIdApi } };
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      if ((window as GoogleWindow).google) resolve();
      else {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('gsi')), { once: true });
      }
      return;
    }
    const el = document.createElement('script');
    el.src = SCRIPT_SRC;
    el.async = true;
    el.defer = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error('gsi'));
    document.head.appendChild(el);
  });
}

export type GoogleStatus = 'disabled' | 'loading' | 'ready' | 'unavailable';

/**
 * Loads Google Identity Services and renders Google's own button into `containerRef`.
 * When VITE_GOOGLE_CLIENT_ID is missing the status is 'disabled' and the UI hides the button.
 * `onCredential` receives the ID token that is then sent to POST /auth/google.
 */
export function useGoogleSignIn(onCredential: (idToken: string) => void) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;
  const [status, setStatus] = useState<GoogleStatus>(GOOGLE_CLIENT_ID ? 'loading' : 'disabled');

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled) return;
        const clientId = GOOGLE_CLIENT_ID;
        if (!clientId) {
          setStatus('disabled');
          return;
        }
        const gsi = (window as GoogleWindow).google?.accounts.id;
        if (!gsi) {
          setStatus('unavailable');
          return;
        }
        gsi.initialize({ client_id: clientId, callback: (r) => callbackRef.current(r.credential) });
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== 'ready' || !containerRef.current) return;
    const gsi = (window as GoogleWindow).google?.accounts.id;
    gsi?.renderButton(containerRef.current, {
      theme: 'filled_black',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      width: 320,
    });
  }, [status]);

  return { containerRef, status };
}
