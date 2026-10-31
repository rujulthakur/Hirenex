import type { Api } from '../contract';
import type { Meeting, MeetingSettings, SendMeetingsResult } from '@/types';
import { dayjs } from '@/lib/time';
import { db } from './db';
import { clone, fail, lat, uid } from './util';

let settings: MeetingSettings = { windowStart: '10:00', windowEnd: '13:00', slotMinutes: 30, meetLink: '', timeZone: 'Asia/Kolkata', companyName: '' };
const meetings: Meeting[] = [];

function tomorrow(): string {
  return dayjs.utc().add(1, 'day').format('YYYY-MM-DD');
}
function slotsFor(date: string): Array<{ start: string; end: string }> {
  const out: Array<{ start: string; end: string }> = [];
  let t = dayjs.utc(`${date}T${settings.windowStart}:00Z`);
  const end = dayjs.utc(`${date}T${settings.windowEnd}:00Z`);
  while (!t.add(settings.slotMinutes, 'minute').isAfter(end)) {
    out.push({ start: t.toISOString(), end: t.add(settings.slotMinutes, 'minute').toISOString() });
    t = t.add(settings.slotMinutes, 'minute');
  }
  return out;
}
const freeFor = (date: string) => slotsFor(date).filter((s) => !meetings.some((m) => m.status === 'scheduled' && m.start === s.start));

export const meetingsApi: Api['meetings'] = {
  async settings() { await lat(); return clone(settings); },
  async saveSettings(patch) { await lat(); settings = { ...settings, ...patch }; return clone(settings); },
  async capacity() {
    await lat();
    const date = tomorrow();
    return { date, total: slotsFor(date).length, free: freeFor(date).length, settings: clone(settings) };
  },
  async list(jobId) { await lat(); return clone(meetings.filter((m) => m.jobId === jobId && m.status === 'scheduled')); },
  async send(jobId, candidateIds) {
    await lat();
    if (!settings.meetLink) fail('VALIDATION_FAILED', 'Add your Google Meet link in the interview settings before sending invites.');
    const date = tomorrow();
    const free = freeFor(date);
    const out: SendMeetingsResult = { date, scheduled: [], skipped: [], emailChannel: 'test' };
    const picked = db.candidates.filter((c) => candidateIds.includes(c.id)).sort((a, b) => (b.totalScore ?? -1) - (a.totalScore ?? -1));
    for (const c of picked) {
      const name = c.profile?.name ?? c.displayName;
      if (meetings.some((m) => m.candidateId === c.id && m.status === 'scheduled')) { out.skipped.push({ candidateId: c.id, name, reason: 'already_invited' }); continue; }
      if (!c.profile?.email) { out.skipped.push({ candidateId: c.id, name, reason: 'no_email' }); continue; }
      const slot = free.shift();
      if (!slot) { out.skipped.push({ candidateId: c.id, name, reason: 'day_full' }); continue; }
      const m: Meeting = { id: uid('mtg_'), jobId, candidateId: c.id, candidateName: name, candidateEmail: c.profile.email, start: slot.start, end: slot.end, meetLink: settings.meetLink, status: 'scheduled', emailStatus: 'sent' };
      meetings.push(m);
      c.stage = 'invited';
      out.scheduled.push(clone(m));
    }
    return out;
  },
  async cancel(id) {
    await lat();
    const m = meetings.find((x) => x.id === id) ?? fail('NOT_FOUND', 'Meeting not found.', 404);
    m.status = 'cancelled';
    const c = db.candidates.find((x) => x.id === m.candidateId);
    if (c) c.stage = c.totalScore !== null ? 'scored' : 'applied';
  },
};
