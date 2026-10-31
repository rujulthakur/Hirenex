import type { Api } from '../contract';
import type { Candidate, ShortlistResult, ShortlistRow } from '@/types';
import { actor, appendAudit, compareCandidates, coverageOf, db, notify, totalFor, verifiedCount } from './db';
import { fail, lat } from './util';

function build(weights: Record<string, number> | null): ShortlistResult {
  const job = db.jobs[0] ?? fail('NOT_FOUND', 'Job not found.', 404);
  const sorted = db.candidates.filter((c) => c.scores).sort((a, b) => compareCandidates(a, b, job, weights));
  const row = (c: Candidate, i: number): ShortlistRow => ({
    candidateId: c.id, rank: i + 1, totalScore: totalFor(c, weights) ?? 0, flags: c.flags,
    requiredCoverage: coverageOf(c, job), verifiedCount: verifiedCount(c), yearsExperience: c.yearsExperience ?? null,
    previousRank: weights ? c.rank : null,
  });
  const rows = sorted.map(row);
  const cut = job.capacity;
  const tieBreakTrace: ShortlistResult['tieBreakTrace'] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const a = sorted[i - 1] as Candidate, b = sorted[i] as Candidate;
    if (totalFor(a, weights) === totalFor(b, weights)) {
      tieBreakTrace.push({ candidateId: b.id, rule: 'coverage', note: 'Equal total score; ordered by required-skill coverage, then verified evidence, years, upload order.' });
    }
  }
  return { ranked: rows.slice(0, cut), waitlist: rows.slice(cut, cut + job.waitlistSize), capacity: cut, approved: db.approved !== null, tieBreakTrace };
}

export const shortlist: Api['shortlist'] = {
  async get() {
    await lat();
    return build(null);
  },
  async rerank(_jobId, weights) {
    await lat();
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    if (sum !== 100) fail('VALIDATION_FAILED', 'Weights must sum to 100.');
    return build(weights);
  },
  async approve(jobId, shortlistIds, waitlistIds) {
    await lat();
    const job = db.jobs.find((j) => j.id === jobId) ?? fail('NOT_FOUND', 'Job not found.', 404);
    if (db.approved) fail('CONFLICT', 'This shortlist is already approved. Reopen it to change it.', 409);
    db.approved = { shortlistIds, waitlistIds };
    for (const c of db.candidates) {
      if (shortlistIds.includes(c.id)) c.stage = 'shortlisted';
      else if (waitlistIds.includes(c.id)) c.stage = 'waitlisted';
    }
    job.status = 'approved';
    await appendAudit(actor(), 'shortlist.approve', null, { shortlist: shortlistIds.length, waitlist: waitlistIds.length });
    notify('Shortlist approved', 'Invitations are now unlocked.', `/app/jobs/${jobId}/invites`);
  },
};
