import type { Api } from '../contract';
import type { RepairDiff, Slot } from '@/types';
import { nowIso } from '@/lib/time';
import { actor, addTrace, appendAudit, db, notify } from './db';
import { fail, lat, uid } from './util';

export function placements(): RepairDiff['before'] {
  return db.candidates.filter((c) => db.slots.some((s) => s.candidateId === c.id)).map((c) => {
    const s = db.slots.find((x) => x.candidateId === c.id) as Slot;
    return { candidateId: c.id, slotId: s.id, interviewerId: s.interviewerId, start: s.start };
  });
}

export function conflicts(): number {
  const seen = new Set<string>();
  let n = 0;
  for (const s of db.slots) {
    if (s.status !== 'booked' || !s.candidateId) continue;
    const k = `${s.candidateId}`;
    if (seen.has(k)) n += 1;
    seen.add(k);
  }
  return n;
}

/** Moves a candidate into the first open slot not owned by `excludeInterviewer`. Returns true if placed. */
export function placeInOpenSlot(candidateId: string, excludeInterviewer?: string): boolean {
  const slot = db.slots.find((s) => s.status === 'open' && s.interviewerId !== excludeInterviewer);
  if (!slot) return false;
  slot.status = 'booked';
  slot.candidateId = candidateId;
  slot.changed = true;
  return true;
}

export const schedule: Api['schedule'] = {
  async run(jobId) {
    await lat();
    const job = db.jobs.find((j) => j.id === jobId) ?? fail('NOT_FOUND', 'Job not found.', 404);
    if (!db.approved) fail('APPROVAL_REQUIRED', 'Approve the shortlist before scheduling.', 403);
    let k = 0;
    for (const id of db.approved.shortlistIds) {
      const open = db.slots.filter((s) => s.status === 'open');
      const pick = open.find((_, i) => i % 3 === k % 3) ?? open[0];
      if (pick) { pick.status = 'booked'; pick.candidateId = id; }
      k += 1;
    }
    db.scheduleRan = true;
    job.status = 'scheduled';
    addTrace('schedule', `${db.approved.shortlistIds.length} candidates`, 'slots booked, 0 conflicts', 90);
    await appendAudit(actor(), 'schedule.run', null, { booked: db.approved.shortlistIds.length });
    return { runId: uid('run_') };
  },
  async get() {
    await lat();
    return {
      interviewers: db.interviewers.map((iv) => ({ interviewer: iv, slots: db.slots.filter((s) => s.interviewerId === iv.id) })),
      conflicts: conflicts(), state: 'done',
    };
  },
  async shortfall(jobId) {
    await lat();
    const job = db.jobs.find((j) => j.id === jobId) ?? fail('NOT_FOUND', 'Job not found.', 404);
    const needed = db.approved?.shortlistIds.length ?? job.capacity;
    const available = db.slots.filter((s) => s.status !== 'blocked' && (s.status === 'open' || s.candidateId !== null)).length;
    return { needed, available, fixes: available >= needed ? [] : ['Add another interviewer', 'Extend the date range', 'Shorten interview duration'] };
  },
  async markUnavailable(_jobId, interviewerId, range) {
    await lat();
    const from = Date.parse(range.from), to = Date.parse(range.to);
    const before = placements();
    const affected: string[] = [];
    for (const s of db.slots) {
      if (s.interviewerId !== interviewerId) continue;
      const t = Date.parse(s.start);
      if (t >= from && t <= to) {
        if (s.candidateId) affected.push(s.candidateId);
        s.status = 'blocked';
        s.candidateId = null;
        s.changed = true;
      }
    }
    const moved: string[] = [], unplaced: string[] = [];
    for (const id of affected) (placeInOpenSlot(id, interviewerId) ? moved : unplaced).push(id);
    const diff: RepairDiff = { id: uid('rep_'), reason: 'Interviewer marked unavailable', createdAt: nowIso(), before, after: placements(), moved, unplaced, promoted: null };
    db.repairs.unshift(diff);
    addTrace('schedule', 'repair', `${moved.length} moved, ${unplaced.length} unplaced`, 60);
    await appendAudit(actor(), 'interviewer.unavailable', { interviewerId }, { from: range.from, to: range.to, moved: moved.length });
    notify('Schedule repaired', `${moved.length} candidates moved.`);
  },
  async repairs() {
    await lat();
    return structuredClone(db.repairs);
  },
};
