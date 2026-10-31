import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, InlineAlert, OtpInput, toastInfo } from '@/components/ui';
import { USE_MOCKS } from '@/lib/config';
import { copy } from '@/lib/copy';
import { ApiError, api } from '@/services';
import { useAuthStore } from '@/stores';
import { AuthLayout } from '../components/AuthLayout';
import { SignedInState } from '../components/SignedInState';
import { formatMmSs, useCountdown } from '../hooks/useCountdown';
import { readFrom, useSignInSuccess } from '../hooks/useSignInSuccess';
import { clearOtpSession, readOtpSession, recordOtpSend } from '../otpSession';
import type { OtpSession } from '../otpSession';
import {
  OTP_LENGTH,
  OTP_LIFETIME_MS,
  OTP_MAX_ATTEMPTS,
  OTP_MAX_SENDS_PER_HOUR,
  OTP_RESEND_COOLDOWN_MS,
  OTP_SEND_WINDOW_MS,
  otpSchema,
} from '../schemas';

type Phase = 'idle' | 'verifying' | 'wrong' | 'expired' | 'locked' | 'error';

/** /verify: 6-digit code entry with a 5-minute countdown, attempts left, resend limits and every error state. */
export default function VerifyPage() {
  const status = useAuthStore((s) => s.status);
  const navigate = useNavigate();
  const location = useLocation();
  const { done, complete } = useSignInSuccess();
  const [session, setSession] = useState<OtpSession | null>(() => readOtpSession());
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [wrongCount, setWrongCount] = useState(0);
  const [errorSignal, setErrorSignal] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendLimitHit, setResendLimitHit] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const otpWrap = useRef<HTMLDivElement | null>(null);

  const expiresAt = (session?.sentAt ?? 0) + OTP_LIFETIME_MS;
  const cooldownEndsAt = (session?.sentAt ?? 0) + OTP_RESEND_COOLDOWN_MS;
  const secondsLeft = useCountdown(expiresAt);
  const cooldownLeft = useCountdown(cooldownEndsAt);

  const sendsInWindow = session ? session.sends.filter((t) => Date.now() - t < OTP_SEND_WINDOW_MS).length : 0;
  const sendLimitReached = resendLimitHit || sendsInWindow >= OTP_MAX_SENDS_PER_HOUR;
  const attemptsLeft = Math.max(0, OTP_MAX_ATTEMPTS - wrongCount);
  const isExpired = phase === 'expired' || secondsLeft === 0;
  const isLocked = phase === 'locked';
  const inputDisabled = phase === 'verifying' || isExpired || isLocked || done;

  useEffect(() => {
    if (phase === 'wrong' || phase === 'error') otpWrap.current?.querySelector('input')?.focus();
  }, [phase]);

  if (status === 'authenticated' && !done) return <Navigate to={readFrom(location.state)} replace />;
  if (!session) {
    return (
      <AuthLayout title={copy.auth.verifyTitle}>
        <InlineAlert tone="info">{copy.auth.noSession}</InlineAlert>
        <Link
          to="/login"
          className="mt-4 inline-flex h-10 items-center rounded-md border border-border px-4 text-base hover:bg-surface-2 focus-visible:shadow-focus"
        >
          {copy.pages.login}
        </Link>
      </AuthLayout>
    );
  }

  const email = session.email;

  const submit = async (value: string) => {
    if (inputDisabled) return;
    const parsed = otpSchema.safeParse({ code: value });
    if (!parsed.success) {
      setPhase('error');
      setMessage(copy.auth.codeIncomplete);
      return;
    }
    setPhase('verifying');
    setMessage(null);
    try {
      const user = await api.auth.verifyOtp(email, parsed.data.code);
      clearOtpSession();
      complete(user);
    } catch (e) {
      setCode('');
      setErrorSignal((n) => n + 1);
      if (e instanceof ApiError && e.code === 'TOKEN_EXPIRED') {
        setPhase('expired');
      } else if (e instanceof ApiError && e.code === 'RATE_LIMITED') {
        setPhase('locked');
      } else if (e instanceof ApiError && e.code === 'VALIDATION_FAILED') {
        const used = wrongCount + 1;
        setWrongCount(used);
        setPhase(used >= OTP_MAX_ATTEMPTS ? 'locked' : 'wrong');
      } else {
        setPhase('error');
        setMessage(copy.auth.verifyFailed);
      }
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit(code);
  };

  const onResend = async () => {
    if (resending || cooldownLeft > 0 || sendLimitReached) return;
    setResending(true);
    try {
      await api.auth.sendOtp(email);
      setSession(recordOtpSend(email));
      setCode('');
      setWrongCount(0);
      setPhase('idle');
      setMessage(null);
      toastInfo(copy.auth.resendDone);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'RATE_LIMITED') setResendLimitHit(true);
      else {
        setPhase('error');
        setMessage(copy.auth.sendFailed);
      }
    } finally {
      setResending(false);
    }
  };

  const changeEmail = () => {
    clearOtpSession();
    navigate('/login', { state: location.state });
  };

  const statusAlert = (() => {
    if (isExpired) return <InlineAlert tone="warning">{copy.auth.codeExpired}</InlineAlert>;
    if (isLocked) return <InlineAlert tone="danger">{copy.auth.noAttempts}</InlineAlert>;
    if (phase === 'wrong') return <InlineAlert tone="danger">{copy.auth.wrongCode(attemptsLeft)}</InlineAlert>;
    if (phase === 'error' && message) return <InlineAlert tone="danger">{message}</InlineAlert>;
    return null;
  })();

  return (
    <AuthLayout
      title={copy.auth.verifyTitle}
      subtitle={copy.auth.verifySubtitle(email)}
      footer={<p>{copy.auth.testInboxNote}</p>}
    >
      {done ? (
        <SignedInState />
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <div ref={otpWrap} className="flex justify-center">
            <OtpInput
              value={code}
              onChange={setCode}
              onComplete={(v) => void submit(v)}
              length={OTP_LENGTH}
              invalid={phase === 'wrong' || phase === 'error' || isLocked}
              disabled={inputDisabled}
              autoFocus
              errorSignal={errorSignal}
              label={copy.overlays.otpLabel}
            />
          </div>

          <div className="flex items-center justify-between text-sm text-muted">
            <span role="timer" aria-live="off" aria-label={copy.auth.timerLabel} className="tabular-nums">
              {isExpired ? copy.auth.codeExpired : copy.auth.codeExpiresIn(formatMmSs(secondsLeft))}
            </span>
            <span className="tabular-nums">{copy.auth.attemptsLeft(attemptsLeft)}</span>
          </div>

          {statusAlert}

          {USE_MOCKS ? <p className="text-xs text-muted">{copy.auth.mockCodeHint}</p> : null}

          <Button
            type="submit"
            size="lg"
            loading={phase === 'verifying'}
            disabled={code.length !== OTP_LENGTH || inputDisabled}
          >
            {phase === 'verifying' ? copy.auth.verifying : copy.auth.verifyCta}
          </Button>

          <div className="flex flex-col gap-2 text-sm">
            <Button
              variant="outline"
              onClick={() => void onResend()}
              loading={resending}
              disabled={cooldownLeft > 0 || sendLimitReached || resending}
            >
              {cooldownLeft > 0 && !sendLimitReached ? copy.auth.resendIn(cooldownLeft) : copy.auth.resend}
            </Button>
            <p className="text-center text-xs text-muted tabular-nums">
              {copy.auth.resendCount(Math.min(sendsInWindow, OTP_MAX_SENDS_PER_HOUR), OTP_MAX_SENDS_PER_HOUR)}
            </p>
            {sendLimitReached ? <InlineAlert tone="warning">{copy.auth.resendLimit}</InlineAlert> : null}
            <Button variant="ghost" onClick={changeEmail}>
              {copy.auth.changeEmail}
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
