import { useEffect, useRef } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { copy } from '@/lib/copy';
import { duration, shakeX } from '@/lib/motion';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Increment to replay the error shake (ignored under reduced motion). */
  errorSignal?: number;
  label?: string;
}

/** Usage: <OtpInput value={code} onChange={setCode} onComplete={submit} invalid={!!err} errorSignal={tries} />. Supports paste. */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  invalid = false,
  disabled = false,
  autoFocus = false,
  errorSignal = 0,
  label = copy.overlays.otpGroup,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const controls = useAnimationControls();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (errorSignal > 0 && !reduce) {
      void controls.start({ x: shakeX, transition: { duration: duration.slow } });
    }
  }, [errorSignal, reduce, controls]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const commit = (next: string, focusIndex: number) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    refs.current[Math.min(focusIndex, length - 1)]?.focus();
    if (clean.length === length) onComplete?.(clean);
  };

  const setAt = (index: number, incoming: string) => {
    const typed = incoming.replace(/\D/g, '');
    if (typed === '') {
      const arr = [...digits];
      arr[index] = '';
      onChange(arr.join('').replace(/\s/g, ''));
      return;
    }
    const arr = [...digits];
    let pos = index;
    for (const ch of typed) {
      if (pos >= length) break;
      arr[pos] = ch;
      pos += 1;
    }
    commit(arr.join(''), pos);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && digits[index] === '' && index > 0) {
      e.preventDefault();
      const arr = [...digits];
      arr[index - 1] = '';
      onChange(arr.join(''));
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    commit(text, text.replace(/\D/g, '').length);
  };

  return (
    <motion.div role="group" aria-label={label} animate={controls} className="flex items-center gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          disabled={disabled}
          aria-label={copy.overlays.otpDigit(i + 1, length)}
          aria-invalid={invalid || undefined}
          onChange={(e) => setAt(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(e, i)}
          onPaste={onPaste}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(
            'h-12 w-11 rounded-md border bg-surface-1 text-center font-mono text-xl tabular-nums text-text transition-colors duration-fast hover:border-muted focus-visible:border-primary focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50',
            invalid ? 'border-danger' : 'border-border',
          )}
        />
      ))}
    </motion.div>
  );
}
