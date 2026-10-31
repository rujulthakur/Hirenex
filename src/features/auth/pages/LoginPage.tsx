import { useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, InlineAlert, Input } from '@/components/ui';
import { USE_MOCKS } from '@/lib/config';
import { copy } from '@/lib/copy';
import { ApiError, api } from '@/services';
import { useAuthStore } from '@/stores';
import { AuthLayout } from '../components/AuthLayout';
import { SignedInState } from '../components/SignedInState';
import { useDemoMode } from '../hooks/useDemoMode';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';
import { readFrom, useSignInSuccess } from '../hooks/useSignInSuccess';
import { recordOtpSend } from '../otpSession';
import { loginSchema } from '../schemas';
import type { LoginForm } from '../schemas';

type Banner = { tone: 'warning' | 'info'; text: string } | null;

function bannerFor(reason: string | null): Banner {
  if (reason === 'expired') return { tone: 'warning', text: copy.auth.expiredBanner };
  if (reason === 'signed-out') return { tone: 'info', text: copy.auth.signedOutBanner };
  return null;
}

/** /login: email OTP, Google sign-in and the sandbox Judge demo login. There is no password field. */
export default function LoginPage() {
  const status = useAuthStore((s) => s.status);
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const demoMode = useDemoMode();
  const { done, complete } = useSignInSuccess();
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'otp' | 'google' | 'demo' | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '' }, mode: 'onTouched' });

  const google = useGoogleSignIn((idToken) => {
    setFormError(null);
    setBusy('google');
    api.auth
      .google(idToken)
      .then(complete)
      .catch(() => setFormError(copy.auth.googleFailed))
      .finally(() => setBusy(null));
  });

  if (status === 'authenticated' && !done) return <Navigate to={readFrom(location.state)} replace />;

  const onSend = handleSubmit(async ({ email }) => {
    setFormError(null);
    setBusy('otp');
    try {
      await api.auth.sendOtp(email);
      recordOtpSend(email);
      navigate('/verify', { state: location.state });
    } catch (e) {
      if (e instanceof ApiError && e.code === 'RATE_LIMITED') setFormError(copy.auth.rateLimited);
      else setFormError(copy.auth.sendFailed);
    } finally {
      setBusy(null);
    }
  });

  const onDemo = async () => {
    setFormError(null);
    setBusy('demo');
    try {
      complete(await api.auth.demoLogin());
    } catch {
      setFormError(copy.auth.demoFailed);
    } finally {
      setBusy(null);
    }
  };

  const banner = bannerFor(params.get('reason'));

  return (
    <AuthLayout
      title={copy.auth.loginTitle}
      subtitle={copy.auth.loginSubtitle}
      banner={banner ? <InlineAlert tone={banner.tone}>{banner.text}</InlineAlert> : undefined}
      footer={<p>{copy.auth.testInboxNote}</p>}
    >
      {done ? (
        <SignedInState />
      ) : (
        <div className="flex flex-col gap-4">
          <form onSubmit={onSend} noValidate className="flex flex-col gap-4">
            <Field id="email" label={copy.auth.emailLabel} error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoFocus
                placeholder={copy.auth.emailPlaceholder}
                invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
            </Field>
            <Button type="submit" size="lg" loading={busy === 'otp'} disabled={busy !== null}>
              {busy === 'otp' ? copy.auth.sendingCode : copy.auth.sendCode}
            </Button>
          </form>

          {USE_MOCKS ? <p className="text-xs text-muted">{copy.auth.mockCodeHint}</p> : null}

          {formError ? <InlineAlert tone="danger">{formError}</InlineAlert> : null}

          {google.status !== 'disabled' && google.status !== 'unavailable' ? (
            <>
              <div className="flex items-center gap-3 text-xs text-muted" aria-hidden="true">
                <span className="h-px flex-1 bg-border" />
                {copy.auth.or}
                <span className="h-px flex-1 bg-border" />
              </div>
              <div
                ref={google.containerRef}
                aria-label={copy.auth.googleHint}
                className="flex min-h-11 justify-center"
              />
              {busy === 'google' ? <p role="status" className="text-center text-sm text-muted">{copy.auth.googleLoading}</p> : null}
            </>
          ) : null}

          {demoMode ? (
            <>
              <div className="flex items-center gap-3 text-xs text-muted" aria-hidden="true">
                <span className="h-px flex-1 bg-border" />
                {copy.auth.or}
                <span className="h-px flex-1 bg-border" />
              </div>
              <Button variant="outline" size="lg" onClick={onDemo} loading={busy === 'demo'} disabled={busy !== null}>
                {copy.auth.demoLogin}
              </Button>
              <p className="-mt-2 text-center text-xs text-muted">{copy.auth.demoHint}</p>
            </>
          ) : null}
        </div>
      )}
    </AuthLayout>
  );
}
