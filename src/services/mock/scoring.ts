import type { Api } from '../contract';
import { addTrace, db, recomputeRanks } from './db';
import { makeCandidate } from './seed';
import { actor, appendAudit } from './db';
import { fail, lat, uid } from './util';

const DURATION = 10_000;

function advance(): void {
  const run = db.run;
  if (!run || run.finished) return;
  const frac = Math.min(1, (Date.now() - run.startedAt) / run.durationMs);
  const target = Math.floor(frac * run.total);
  while (run.done < target) {
    const id = run.targetIds[run.done];
    run.done += 1;
    const c = db.candidates.find((x) => x.id === id);
    if (!c) continue;
    const idx = Number(c.uploadOrder) % 20;
    const full = makeCandidate(idx, c.uploadOrder, 'scored', true);
    c.scores = full.scores;
    c.redactedText = c.redactedText ?? full.redactedText;
    c.stage = 'scored';
    addTrace('score', c.blindLabel, 'scores proposed', 350);
    addTrace('verify_quotes', c.blindLabel, `${(c.scores ?? []).filter((s) => s.verified).length} quotes verified`, 40);
  }
  if (run.done >= run.total) {
    run.finished = true;
    recomputeRanks();
    addTrace('rank', `${run.total} candidates`, 'ranking complete', 25);
    const job = db.jobs[0];
    if (job && job.status === 'open') job.status = 'scored';
  }
}

export const scoring: Api['scoring'] = {
  async start(jobId) {
    await lat();
    if (!db.jobs.some((j) => j.id === jobId)) fail('NOT_FOUND', 'Job not found.', 404);
    const pending = db.candidates.filter((c) => c.stage === 'applied');
    const targets = pending.length > 0 ? pending : db.candidates;
    db.run = { runId: uid('run_'), startedAt: Date.now(), total: targets.length, done: 0, targetIds: targets.map((c) => c.id), finished: false, durationMs: DURATION };
    await appendAudit(actor(), 'scoring.start', null, { total: targets.length });
    return { runId: db.run.runId };
  },
  async status() {
    await lat();
    if (!db.run) fail('NOT_FOUND', 'No scoring run yet.', 404);
    advance();
    const r = db.run;
    return { runId: r.runId, state: r.finished ? 'done' : 'running', done: r.done, total: r.total, failures: 0 };
  },
};
