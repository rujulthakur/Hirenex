import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Sparkles, Upload, X } from 'lucide-react';
import { Button, FileDropzone, Spinner, Tilt } from '@/components/ui';
import { usePrefs } from '@/stores';
import { useActiveJob } from '@/app/useActiveJob';
import { useScoringRun } from '@/features/upload/hooks/useScoringRun';
import { useUploadQueue } from '@/features/upload/hooks/useUploadQueue';
import { scorableCount } from '@/features/upload/uploadModel';
import { copy } from '@/lib/copy';
import { OpeningSelect } from '@/features/jobs/components/OpeningSelect';

/** /app: the starting page. Paste or drop resumes, press Screen, land on the ranked results. */
export default function StartPage() {
  const navigate = useNavigate();
  const active = useActiveJob();
  const { jobs, isLoading } = active;
  // The opening these resumes are scored for. Defaults to the one last used, but HR can pick any opening.
  const [chosen, setChosen] = useState<string | null>(null);
  const jobId = chosen ?? active.jobId;
  const queue = useUploadQueue(jobId ?? '');
  const run = useScoringRun(jobId ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const total = files.length;
  const started = useRef(false);

  const working = submitted && run.phase !== 'failed';

  // Step 1: after submit, push everything into the upload queue once.
  const submit = () => {
    if (!jobId || total === 0) return;
    queue.addFiles(files);
    setSubmitted(true);
  };

  // Step 2: once uploads settle, run scoring. Step 3: when done, go to results.
  useEffect(() => {
    if (submitted && !started.current && !queue.busy && scorableCount(queue.summary) > 0) {
      started.current = true;
      run.start();
    }
  }, [submitted, queue.busy, queue.summary, run]);

  useEffect(() => {
    if (run.phase === 'done' && jobId && usePrefs.getState().autoOpenResults) navigate(`/app/jobs/${jobId}/candidates`);
  }, [run.phase, jobId, navigate]);

  // Back to a clean upload screen so another batch can be screened without leaving the page.
  const startOver = () => {
    started.current = false;
    queue.clearList();
    setFiles([]);
    setSubmitted(false);
  };

  const stuck = submitted && !queue.busy && scorableCount(queue.summary) === 0 && queue.rows.length > 0;

  if (isLoading) return <div className="grid min-h-[60vh] place-items-center"><Spinner /></div>;

  if (!jobId) {
    return (
      <section className="mx-auto flex max-w-xl flex-col items-center gap-4 p-10 text-center">
        <h1 className="text-2xl font-semibold">Create a role first</h1>
        <p className="text-muted">Tell us what you are hiring for so resumes can be scored against it. You can upload the job description document and the opening is filled in for you.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link to="/app/jobs" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 font-medium text-primary-fg">Upload job document</Link>
          <Link to="/app/jobs/new" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 font-medium"><Plus size={16} />New job</Link>
        </div>
      </section>
    );
  }

  if (working) {
    const done = run.status?.done ?? 0;
    const all = run.status?.total ?? total;
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-5 p-6 text-center" aria-live="polite">
        <div className="scene3d grid h-20 place-items-center" aria-hidden="true"><div className="cube"><i /><i /><i /><i /><i /><i /></div></div>
        <h1 className="text-2xl font-semibold">{run.phase === 'done' ? 'Results are ready' : queue.busy ? 'Reading resumes…' : 'Scoring candidates…'}</h1>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-primary transition-all duration-base" style={{ width: `${all ? Math.max(6, (done / all) * 100) : 6}%` }} />
        </div>
        <p className="text-sm text-muted">{queue.busy ? `${queue.rows.length} of ${total} uploaded` : `${done} of ${all} scored`}</p>
        {run.phase === 'done' ? (
          <div className="flex flex-wrap justify-center gap-2">
            <Link to={`/app/jobs/${jobId}/candidates`} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 font-medium text-primary-fg">View results <ArrowRight size={16} /></Link>
            <Button variant="secondary" onClick={startOver}>Upload more resumes</Button>
          </div>
        ) : null}
        {stuck ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-danger">No resume could be added. Here is why:</p>
            <ul className="flex w-full flex-col gap-1 text-left text-sm text-muted">
              {queue.rows.slice(0, 8).map((r) => (
                <li key={r.id} className="break-words">
                  <span className="font-medium text-text">{r.name}</span>:{' '}
                  {r.reason ? copy.upload.reason[r.reason] : r.note ?? (r.state === 'failed' ? copy.upload.networkFailed + ' Check that the backend is running and try again.' : 'Could not be read.')}
                </li>
              ))}
            </ul>
            <Button variant="secondary" onClick={startOver}>Try again</Button>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <div className="relative overflow-hidden">
    <div aria-hidden="true" className="scene3d pointer-events-none absolute inset-0 hidden md:block">
      <span className="float-card" style={{ left: '3%', top: '12%', ['--fz' as string]: '-14deg' }} />
      <span className="float-card" style={{ right: '4%', top: '8%', ['--fz' as string]: '16deg', animationDelay: '-2s' }} />
      <span className="float-card" style={{ left: '8%', bottom: '6%', ['--fz' as string]: '10deg', animationDelay: '-4s', width: 130, height: 170 }} />
      <span className="float-card" style={{ right: '9%', bottom: '10%', ['--fz' as string]: '-8deg', animationDelay: '-1s', width: 140, height: 180 }} />
    </div>
    <section className="relative mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 md:py-14">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-1 px-3 py-1 text-xs font-medium text-muted">
          <Sparkles size={14} aria-hidden="true" /> Resume screening for your hiring team
        </span>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Add the resumes you received. Get a ranked shortlist.</h1>
        <p className="max-w-xl text-base text-muted">Upload the candidates' resumes (PDF or Word). Every score shows the evidence behind it.</p>
      </header>

      <Tilt max={2.5} className="rise3d">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-1 p-4 shadow-lg md:p-5">
        <div className="flex flex-col gap-1">
          <label htmlFor="start-opening" className="text-sm font-medium">Score these resumes for</label>
          <OpeningSelect id="start-opening" value={jobId} onChange={setChosen} disabled={submitted} />
          <p className="text-xs text-muted">Each opening has its own skills and criteria, so the same resume can score differently for each one. <Link to="/app/jobs" className="underline">Add an opening</Link></p>
        </div>
        <FileDropzone files={[]} onFilesAdded={(f) => setFiles((p) => [...p, ...f])} onRejected={() => undefined} maxSizeMb={10} maxFiles={50} />
        {files.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 py-1 pl-3 pr-1 text-sm">
                <Upload size={12} aria-hidden="true" />{f.name}
                <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="rounded-full p-1 hover:bg-surface-1"><X size={12} /></button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">{total === 0 ? 'No resumes added yet' : `${total} resume${total === 1 ? '' : 's'} ready`}</p>
          <Button variant="primary" disabled={total === 0} onClick={submit}>
            Screen {total > 0 ? total : ''} resume{total === 1 ? '' : 's'} <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
      </Tilt>
    </section>
    </div>
  );
}
