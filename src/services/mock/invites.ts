import type { Api } from '../contract';
import type { Invite } from '@/types';
import { nowIso } from '@/lib/time';
import { actor, appendAudit, db, notify } from './db';
import { clone, fail, lat } from './util';

function ensure(): Invite[] {
  if (!db.approved) fail('APPROVAL_REQUIRED', 'Invitations are locked until you approve the shortlist.', 403);
  const ids = db.approved.shortlistIds;
  for (const id of ids) {
    if (db.invites.some((i) => i.candidateId === id)) continue;
    const slot = db.slots.find((s) => s.candidateId === id) ?? null;
    const c = db.candidates.find((x) => x.id === id);
    db.invites.push({
      id: `inv_${id}`, candidateId: id, slotId: slot?.id ?? null, emailStatus: 'queued', response: 'pending', previewUrl: null, sentAt: null,
      subject: `Interview invitation: ${db.jobs[0]?.title ?? 'role'}`,
      body: `Hello ${c?.displayName ?? 'candidate'},\n\nYou are invited to interview${slot ? ` on ${slot.start} (${slot.timeZone})` : ''}.\nUse your private link to accept, decline or request another time.\n\nThis is a synthetic demo message.`,
    });
  }
  return db.invites;
}

export const invites: Api['invites'] = {
  async preview() {
    await lat();
    return clone(ensure());
  },
  async update(id, patch) {
    await lat();
    const inv = db.invites.find((i) => i.id === id) ?? fail('NOT_FOUND', 'Invite not found.', 404);
    if (inv.emailStatus !== 'queued' && inv.emailStatus !== 'failed') fail('CONFLICT', 'This invite was already sent.', 409);
    Object.assign(inv, patch);
    await appendAudit(actor(), 'invite.edit', null, { id });
    return clone(inv);
  },
  async send() {
    await lat();
    const list = ensure();
    for (const inv of list) {
      if (inv.slotId && db.slots.find((s) => s.id === inv.slotId)?.candidateId !== inv.candidateId) fail('SLOT_TAKEN', 'A slot changed. Re-run the scheduler.', 409);
    }
    for (const inv of list) {
      if (inv.emailStatus === 'sent' || inv.emailStatus === 'viewed') continue;
      inv.emailStatus = 'sent';
      inv.sentAt = nowIso();
      inv.previewUrl = `https://ethereal.email/message/${inv.id}`;
      const c = db.candidates.find((x) => x.id === inv.candidateId);
      if (c) c.stage = 'invited';
    }
    const job = db.jobs[0];
    if (job) job.status = 'invited';
    await appendAudit(actor(), 'invites.send', null, { count: list.length, inbox: 'test' });
    notify('Invitations sent', `${list.length} emails delivered to the test inbox.`);
  },
  async list() {
    await lat();
    return clone(ensure());
  },
};
