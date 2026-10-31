import type { Api } from '../contract';
import type { Candidate } from '@/types';
import { actor, appendAudit, db, recomputeRanks, totalFor } from './db';
import { hiringSettings } from './hiring';
import { clone, fail, lat, paginate } from './util';

function find(id: string): Candidate {
  return db.candidates.find((c) => c.id === id) ?? fail('NOT_FOUND', 'Candidate not found.', 404);
}
function light(c: Candidate): Candidate {
  const { redactedText: _t, scores: _s, ...rest } = c;
  void _t; void _s;
  return clone(rest);
}

export const candidates: Api['candidates'] = {
  async decide(id, action) {
    await lat();
    const c = find(id);
    const now = new Date();
    if (action === 'hold') { c.stage = 'on_hold'; c.holdUntil = new Date(now.getTime() + hiringSettings.holdDays * 86_400_000).toISOString(); c.rejectionReason = null; }
    else if (action === 'reject') { c.stage = 'rejected'; c.holdUntil = null; c.rejectionReason = 'hr_rejected'; }
    else { c.stage = 'shortlisted'; c.holdUntil = null; c.rejectionReason = null; c.reviewClockStart = now.toISOString(); }
    return light(c);
  },
  async copyToJob(_target, _from, ids) {
    await lat();
    return { added: ids.length, skipped: 0 };
  },
  async list(_jobId, q) {
    await lat();
    let rows = db.candidates.slice();
    if (q.stage) rows = rows.filter((c) => c.stage === q.stage);
    if (q.flag) rows = rows.filter((c) => c.flags.some((f) => f === q.flag));
    if (q.q) { const n = q.q.toLowerCase(); rows = rows.filter((c) => c.displayName.toLowerCase().includes(n) || c.fileName.toLowerCase().includes(n)); }
    const sort = q.sort ?? 'rank';
    const desc = sort.startsWith('-');
    const key = sort.replace('-', '');
    const val = (c: Candidate): number | string => (key === 'totalScore' ? c.totalScore ?? -1 : key === 'name' ? c.displayName : key === 'uploadOrder' ? c.uploadOrder : c.rank ?? 9999);
    rows.sort((a, b) => {
      const x = val(a), y = val(b);
      const r = typeof x === 'string' ? x.localeCompare(String(y)) : x - Number(y);
      return desc ? -r : r;
    });
    const p = paginate(rows, q.page, q.limit);
    return { items: p.items.map(light), meta: p.meta };
  },
  async get(id) {
    await lat();
    return clone(find(id));
  },
  async scores(id) {
    await lat();
    return clone(find(id).scores ?? []);
  },
  async overrideScore(id, criterionId, input) {
    await lat();
    const c = find(id);
    const s = c.scores?.find((x) => x.criterionId === criterionId) ?? fail('NOT_FOUND', 'Criterion not found.', 404);
    const old = { score: s.score, authority: s.authority };
    s.score = input.score;
    s.authority = 'human';
    s.overrideReason = input.reason;
    recomputeRanks();
    const entry = await appendAudit(actor(), 'score.override', { candidateId: id, criterionId, ...old }, { score: input.score, reason: input.reason });
    return { score: clone(s), totalScore: totalFor(c) ?? 0, auditSeq: entry.seq };
  },
  async update(id, patch) {
    await lat();
    const c = find(id);
    c.notes = patch.notes;
    await appendAudit(actor(), 'candidate.notes', null, { candidateId: id });
    return light(c);
  },
  async remove(id) {
    await lat();
    find(id);
    db.candidates = db.candidates.filter((c) => c.id !== id);
    recomputeRanks();
    await appendAudit(actor(), 'candidate.delete', { candidateId: id }, null);
  },
  async swapTest(id) {
    await lat();
    const c = find(id);
    const t = totalFor(c) ?? 0;
    return {
      original: t, swapped: t, delta: 0,
      limitNote: 'This test swaps names and gender words only. It does not detect every possible proxy for protected traits.',
    };
  },
};
