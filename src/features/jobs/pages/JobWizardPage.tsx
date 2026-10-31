import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button, ConfirmDialog, ErrorState, InlineAlert, Skeleton, toastSuccess } from '@/components/ui';
import { copy } from '@/lib/copy';
import { WizardStepper } from '../components/WizardStepper';
import { BasicsStep } from '../components/steps/BasicsStep';
import { CapacityStep } from '../components/steps/CapacityStep';
import { ConstraintsStep } from '../components/steps/ConstraintsStep';
import { CriteriaStep } from '../components/steps/CriteriaStep';
import { InterviewersStep, blankInterviewer } from '../components/steps/InterviewersStep';
import { ReviewStep } from '../components/steps/ReviewStep';
import { SkillsStep } from '../components/steps/SkillsStep';
import { NEW_JOB_DRAFT_KEY, clearDraft, loadDraft, saveDraft } from '../draft';
import { useJob, useJobInterviewers, useSaveJob } from '../hooks/useJobs';
import { useUnsavedGuard } from '../hooks/useUnsavedGuard';
import { REVIEW_STEP, TOTAL_STEPS, defaultValues, errorCount, jobToValues, validateAll, validateStep } from '../schemas';
import type { WizardValues } from '../schemas';

const AUTOSAVE_DELAY_MS = 400;

interface WizardFormProps {
  jobId: string | undefined;
  /** Values the wizard starts from when there is no draft (blank defaults or the loaded job). */
  base: WizardValues;
}

function WizardForm({ jobId, base }: WizardFormProps) {
  const draftKey = jobId ?? NEW_JOB_DRAFT_KEY;
  const navigate = useNavigate();
  const save = useSaveJob();

  const [initialDraft] = useState(() => loadDraft(draftKey));
  const [draftActive, setDraftActive] = useState<boolean>(initialDraft !== null);
  const [step, setStep] = useState<number>(initialDraft?.step ?? 0);
  const [visited, setVisited] = useState<boolean[]>(() => Array.from({ length: TOTAL_STEPS }, (_, i) => i === (initialDraft?.step ?? 0)));
  const [attempted, setAttempted] = useState<boolean[]>(() => Array.from({ length: TOTAL_STEPS }, () => false));
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState('');

  const form = useForm<WizardValues>({ defaultValues: initialDraft?.values ?? base });
  const values = form.watch();
  const isDirty = form.formState.isDirty;
  const dirty = (isDirty || draftActive) && !saved;
  const guard = useUnsavedGuard(dirty);

  const stepRef = useRef(step);
  stepRef.current = step;
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  const stepErrors = useMemo(() => validateAll(values), [values]);
  const counts = useMemo(() => [...stepErrors.map(errorCount), 0], [stepErrors]);
  const totalErrors = counts.reduce((a, n) => a + n, 0);

  /* Autosave to sessionStorage (debounced). Never localStorage. */
  useEffect(() => {
    let timer: number | undefined;
    const sub = form.watch(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => saveDraft(draftKey, stepRef.current, form.getValues()), AUTOSAVE_DELAY_MS);
    });
    return () => {
      sub.unsubscribe();
      window.clearTimeout(timer);
    };
  }, [form, draftKey]);

  /* Remember the current step too, and move focus to the step heading for keyboard and screen-reader users. */
  useEffect(() => {
    if (isDirty || draftActive) saveDraft(draftKey, step, form.getValues());
    headingRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to step changes
  }, [step]);

  /* Leave after the save finished and the guard has been released. */
  useEffect(() => {
    if (saved) navigate('/app/jobs');
  }, [saved, navigate]);

  const goTo = (target: number) => {
    if (target === step) return;
    setAttempted((a) => a.map((v, i) => v || i === step));
    setVisited((v) => v.map((x, i) => x || i === target || i === step));
    setLiveMessage('');
    setStep(target);
  };

  const onNext = () => {
    const problems = errorCount(validateStep(step, form.getValues()));
    if (problems > 0) {
      setAttempted((a) => a.map((v, i) => v || i === step));
      setLiveMessage(copy.jobs.wizard.stepHasErrors(problems));
      return;
    }
    goTo(step + 1);
  };

  const onSave = () => {
    if (totalErrors > 0) return;
    setSaveError(null);
    save.mutate(
      { jobId, values: form.getValues() },
      {
        onSuccess: () => {
          clearDraft(draftKey);
          clearDraft(NEW_JOB_DRAFT_KEY);
          toastSuccess(copy.jobs.wizard.saved);
          setDraftActive(false);
          setSaved(true);
        },
        onError: (e) => setSaveError(e.message || copy.jobs.wizard.saveFailed),
      },
    );
  };

  const onDiscardDraft = () => {
    clearDraft(draftKey);
    form.reset(base);
    setDraftActive(false);
    setAttempted(Array.from({ length: TOTAL_STEPS }, () => false));
    setVisited(Array.from({ length: TOTAL_STEPS }, (_, i) => i === 0));
    setStep(0);
  };

  const names = copy.jobs.wizard.stepNames;
  const stepProps = { form, errors: stepErrors[step] ?? {}, showErrors: attempted[step] === true };

  return (
    <section className="flex flex-col gap-6 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold">{jobId ? copy.jobs.wizard.editTitle : copy.jobs.wizard.createTitle}</h1>
      </header>

      {initialDraft && draftActive ? (
        <InlineAlert tone="info">
          <span className="flex flex-wrap items-center gap-3">
            {copy.jobs.wizard.draftRestored}
            <Button variant="outline" size="sm" onClick={onDiscardDraft}>
              {copy.jobs.wizard.discardDraft}
            </Button>
          </span>
        </InlineAlert>
      ) : null}

      <WizardStepper
        current={step}
        errorCounts={counts}
        visited={visited.map((v, i) => v && i !== step)}
        onSelect={goTo}
      />

      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-muted tabular-nums">{copy.jobs.wizard.stepOf(step + 1, TOTAL_STEPS)}</p>
          <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold focus:outline-none">
            {names[step]}
          </h2>
        </div>

        {step === 0 ? <BasicsStep {...stepProps} /> : null}
        {step === 1 ? <SkillsStep {...stepProps} /> : null}
        {step === 2 ? <CriteriaStep {...stepProps} /> : null}
        {step === 3 ? <CapacityStep {...stepProps} /> : null}
        {step === 4 ? <ConstraintsStep {...stepProps} /> : null}
        {step === 5 ? <InterviewersStep {...stepProps} /> : null}
        {step === REVIEW_STEP ? <ReviewStep values={values} stepErrors={stepErrors} onGoToStep={goTo} /> : null}
      </div>

      {saveError ? <InlineAlert tone="danger" title={copy.jobs.wizard.saveFailed}>{saveError}</InlineAlert> : null}

      <p className="sr-only" aria-live="polite">
        {liveMessage}
      </p>

      <footer className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <Button variant="outline" onClick={() => goTo(step - 1)} disabled={step === 0 || save.isPending}>
          {copy.jobs.wizard.back}
        </Button>
        {step < REVIEW_STEP ? (
          <Button onClick={onNext}>{copy.jobs.wizard.next}</Button>
        ) : (
          <Button onClick={onSave} loading={save.isPending} disabled={totalErrors > 0 || save.isPending}>
            {save.isPending ? copy.jobs.wizard.saving : copy.jobs.wizard.save}
          </Button>
        )}
        {liveMessage && step < REVIEW_STEP ? <span className="text-sm text-danger">{liveMessage}</span> : null}
      </footer>

      <ConfirmDialog
        open={guard.blocked}
        onClose={guard.stay}
        onConfirm={guard.proceed}
        title={copy.jobs.wizard.unsavedTitle}
        description={copy.jobs.wizard.unsavedBody}
        confirmLabel={copy.jobs.wizard.leave}
        cancelLabel={copy.jobs.wizard.stay}
      />
    </section>
  );
}

/** /app/jobs/new and /app/jobs/:jobId: the 7-step job wizard. Loads the job first when editing. */
export default function JobWizardPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const job = useJob(jobId);
  const interviewers = useJobInterviewers(jobId);

  const base = useMemo<WizardValues | null>(() => {
    if (!jobId) {
      const blank = defaultValues();
      return { ...blank, interviewers: [0, 1, 2].map(() => blankInterviewer(blank.constraints)) };
    }
    if (job.data && interviewers.data) return jobToValues(job.data, interviewers.data);
    return null;
  }, [jobId, job.data, interviewers.data]);

  if (jobId && (job.isError || interviewers.isError)) {
    return (
      <section className="p-4 md:p-6">
        <ErrorState
          message={(job.error ?? interviewers.error)?.message ?? copy.jobs.wizard.loadFailed}
          onRetry={() => {
            void job.refetch();
            void interviewers.refetch();
          }}
        />
      </section>
    );
  }

  if (!base) {
    return (
      <section aria-busy="true" aria-label={copy.common.loading} className="flex flex-col gap-4 p-4 md:p-6">
        <Skeleton variant="text" lines={2} />
        <Skeleton variant="card" />
      </section>
    );
  }

  return <WizardForm key={jobId ?? NEW_JOB_DRAFT_KEY} jobId={jobId} base={base} />;
}
