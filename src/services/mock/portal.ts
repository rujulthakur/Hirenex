import type { Api } from '../contract';
import type { Candidate, Invite } from '@/types';
import { nowIso } from '@/lib/time';
import { appendAudit, db, notify } from './db';
import { placeInOpenSlot, placements } from './schedule';
import { fail, lat, uid } from './util';

export function tokenFor(candidateId: string): string {
  return `tok_${candidateId}`;
}
function resolve(token: string): { c: Candidate; inv: Invite } {
  if (token === 'expired') fail('TOKEN_EXPIRED', 'This link has expired.', 410);
  const id = token.replace(/^tok_/, '');
  const c = db.candidates.find((x) => x.id === id);
  const inv = db.invites.find((i) => i.candidateId === id);
  if (!c || !inv) fail('TOKEN_EXPIRED', 'This link is not valid or has expired.', 410);
  return { c, inv };
}

export const portal: Api['portal'] = {
  async get(token) {
    await lat();
    const { c, inv } = resolve(token);
    const slot = db.slots.find((s) => s.id === inv.slotId) ?? fail('TOKEN_EXPIRED', 'This interview slot is no longer active.', 410);
    const job = db.jobs[0];
    const k = job?.constraints;
    if (inv.emailStatus === 'sent') inv.emailStatus = 'viewed';
    return {
      candidateLabel: c.blindLabel, jobTitle: job?.title ?? '', start: slot.start, end: slot.end, timeZone: slot.timeZone,
      format: k?.format ?? 'virtual', meetingLink: k?.meetingLink ?? null, location: k?.location ?? null,
      preparationNotes: 'Have your portfolio ready. Expect a 45 minute conversation about your projects.', response: inv.response,
    };
  },
  async accept(token) {
    await lat();
    const { c, inv } = resolve(token);
    inv.response = 'accepted';
    c.stage = 'confirmed';
    await appendAudit(`candidate:${c.blindLabel}`, 'invite.accept', null, { id: inv.id });
  },
  async decline(token, reason) {
    await lat();
    const { c, inv } = resolve(token);
    const before = placements();
    const slot = db.slots.find((s) => s.id === inv.slotId);
    inv.response = 'declined';
    c.stage = 'declined';
    let promoted: string | null = null;
    if (slot) {
      slot.candidateId = null; slot.status = 'open'; slot.changed = true;
      const nextId = db.approved?.waitlistIds.find((id) => db.candidates.find((x) => x.id === id)?.stage === 'waitlisted') ?? null;
      if (nextId) {
        slot.status = 'booked'; slot.candidateId = nextId;
        const w = db.candidates.find((x) => x.id === nextId);
        if (w) w.stage = 'invited';
        promoted = nextId;
        db.invites.push({ id: `inv_${nextId}`, candidateId: nextId, slotId: slot.id, emailStatus: 'sent', response: 'pending', subject: 'Interview invitation', body: 'You were promoted from the waitlist.', previewUrl: `https://ethereal.email/message/inv_${nextId}`, sentAt: nowIso() });
      } else placeInOpenSlot('');
    }
    db.repairs.unshift({ id: uid('rep_'), reason: 'Candidate declined', createdAt: nowIso(), before, after: placements(), moved: promoted ? [promoted] : [], unplaced: [], promoted });
    await appendAudit(`candidate:${c.blindLabel}`, 'invite.decline', null, { id: inv.id, reason: reason ?? null, promoted });
    notify('Candidate declined', promoted ? 'Top waitlist candidate promoted into the freed slot.' : 'Slot freed.');
  },
  async reschedule(token, note) {
    await lat();
    const { c, inv } = resolve(token);
    inv.response = 'reschedule_requested';
    await appendAudit(`candidate:${c.blindLabel}`, 'invite.reschedule_request', null, { note });
    notify('Reschedule requested', `${c.blindLabel} asked for another time.`);
  },
  async status(token) {
    await lat();
    const { c } = resolve(token);
    const req = db.jobs[0]?.requiredSkills ?? [];
    const have = new Set(c.skills ?? []);
    return {
      matchedSkills: req.filter((s) => have.has(s)), missingSkills: req.filter((s) => !have.has(s)),
      humanReviewed: db.approved !== null, stage: c.stage,
      nextSteps: 'Check your email for interview details. You can ask for a human review at any time.',
    };
  },
};
