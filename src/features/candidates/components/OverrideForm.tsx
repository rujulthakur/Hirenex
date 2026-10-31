import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button, Field, Input } from '@/components/ui';
import { copy } from '@/lib/copy';
import { ScoreOverrideInputSchema } from '@/types';
import type { ScoreOverrideInput } from '@/types';

interface OverrideFormProps {
  criterionId: string;
  initialScore: number;
  saving: boolean;
  onSubmit: (input: ScoreOverrideInput) => void;
  onCancel: () => void;
}

/** Score input plus a required reason. Validated with the same Zod schema the API uses. */
export function OverrideForm({ criterionId, initialScore, saving, onSubmit, onCancel }: OverrideFormProps) {
  const [score, setScore] = useState(String(initialScore));
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ score?: string; reason?: string }>({});

  const submit = (e: FormEvent): void => {
    e.preventDefault();
    const parsed = ScoreOverrideInputSchema.safeParse({ score: score.trim() === '' ? Number.NaN : Number(score), reason: reason.trim() });
    if (parsed.success) {
      setErrors({});
      onSubmit(parsed.data);
      return;
    }
    const next: { score?: string; reason?: string } = {};
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === 'score') next.score = copy.evidence.overrideScoreError;
      if (issue.path[0] === 'reason') next.reason = copy.evidence.overrideReasonError;
    }
    setErrors(next);
  };

  return (
    <form onSubmit={submit} noValidate className="mt-2 flex flex-col gap-3 rounded-md border border-border bg-surface-2 p-3">
      <Field id={`ov-score-${criterionId}`} label={copy.evidence.overrideScore} error={errors.score}>
        <Input id={`ov-score-${criterionId}`} type="number" inputMode="numeric" min={0} max={100} value={score} invalid={Boolean(errors.score)} onChange={(e) => setScore(e.target.value)} className="min-h-11" />
      </Field>
      <Field id={`ov-reason-${criterionId}`} label={copy.evidence.overrideReason} error={errors.reason}>
        <Input id={`ov-reason-${criterionId}`} value={reason} invalid={Boolean(errors.reason)} onChange={(e) => setReason(e.target.value)} className="min-h-11" />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" loading={saving}>
          {copy.evidence.overrideSave}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {copy.evidence.overrideCancel}
        </Button>
      </div>
    </form>
  );
}
