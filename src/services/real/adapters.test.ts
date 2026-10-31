import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  AnalyticsViewSchema, AuditEntrySchema, CandidateSchema, CriterionScoreSchema, InterviewerSchema, InviteSchema, JobSchema,
  NotificationSchema, PortalStatusSchema, PortalViewSchema, RepairDiffSchema, ScheduleViewSchema, ShortfallReportSchema,
  ShortlistResultSchema, SwapTestSchema, TraceEntrySchema, UploadResultSchema, ScoreStatusSchema,
} from '@/types';
import * as a from './adapters';

// Payloads below are shaped exactly like the backend DTO interfaces (job.service, candidate.service, ranking.service, ...).
const backendJob = {
  id: 'j1', title: 'Frontend Engineer', description: 'Build things for hiring.', status: 'open',
  requiredSkills: ['react'], preferredSkills: [], capacity: 6, waitlistSize: 3, interviewMinutes: 45,
  criteria: [{ id: 'c1', name: 'React', weight: 40, description: '' }, { id: 'c2', name: 'TS', weight: 30, description: 'x' }, { id: 'c3', name: 'UX', weight: 30, description: '' }],
  constraints: { dates: ['2026-11-02', '2026-11-03'], dailyStart: '10:00', dailyEnd: '14:30', breaks: [{ start: '12:15', end: '13:00' }], timeZone: 'Asia/Kolkata', format: 'virtual', meetingLink: 'https://meet.example.test/x' },
  createdAt: '2026-10-31T00:00:00.000Z', updatedAt: '2026-10-31T00:00:00.000Z',
};

describe('backend -> UI adapters satisfy the UI schemas', () => {
  it('job (the original failing case)', () => {
    const job = JobSchema.parse(a.toJob(backendJob));
    expect(job.durationMinutes).toBe(45);
    expect(job.constraints.startDate).toBe('2026-11-02');
    expect(job.constraints.endDate).toBe('2026-11-03');
    expect(job.constraints.breaks[0]).toEqual({ from: '12:15', to: '13:00' });
  });

  it('job input -> backend create body', () => {
    const body = a.fromJobInput({
      title: 't', description: 'd', requiredSkills: ['a'], preferredSkills: [], capacity: 3, waitlistSize: 1, durationMinutes: 30,
      criteria: [{ name: 'A', weight: 50 }, { name: 'B', weight: 50 }],
      constraints: { startDate: '2026-11-02', endDate: '2026-11-04', dailyStart: '09:00', dailyEnd: '17:00', breaks: [{ from: '12:00', to: '13:00' }], timeZone: 'Asia/Kolkata', format: 'physical', location: 'HQ', meetingLink: '' },
    });
    expect(body.interviewMinutes).toBe(30);
    expect(body.constraints.dates).toEqual(['2026-11-02', '2026-11-03', '2026-11-04']);
    expect(body.constraints.breaks).toEqual([{ start: '12:00', end: '13:00' }]);
    expect(body.constraints.meetingLink).toBeUndefined();
    expect(body.criteria[0].id).toBe('crit_1');
    expect(body.durationMinutes).toBeUndefined();
  });

  it('interviewers round-trip', () => {
    const iv = { id: 'i1', name: 'Priya', timeZone: 'Asia/Kolkata', availability: [{ date: '2026-11-02', start: '10:00', end: '14:00' }] };
    const ui = InterviewerSchema.parse(a.toInterviewer(iv));
    expect(a.fromInterviewer(ui).availability).toEqual(iv.availability);
  });

  it('upload results', () => {
    const rows = [
      { fileName: 'a.pdf', status: 'accepted', candidateId: 'c1', flags: [] },
      { fileName: 'b.pdf', status: 'accepted', candidateId: 'c2', flags: ['hidden_text_found', 'near_duplicate'] },
      { fileName: 'c.pdf', status: 'unreadable', candidateId: 'c3', flags: ['unreadable_scan'], reason: 'x' },
      { fileName: 'd.pdf', status: 'duplicate', candidateId: 'c1', flags: [], reason: 'dup' },
      { fileName: 'e.txt', status: 'rejected', flags: [], reason: 'Unsupported file type' },
    ];
    const out = z.array(UploadResultSchema).parse(rows.map(a.toUploadResult));
    expect(out.map((r) => r.status)).toEqual(['accepted', 'flagged', 'rejected', 'rejected', 'rejected']);
  });

  it('candidates (row + detail) including backend-only flags and missing rank', () => {
    const row = { id: 'c1', jobId: 'j1', fileName: 'asha_rao.pdf', fileType: 'pdf', stage: 'applied', flags: ['rank_unstable', 'needs_review'], uploadOrder: 3 };
    const c = CandidateSchema.parse(a.toCandidate(row));
    expect(c.rank).toBeNull();
    expect(c.flags).toEqual(['flagged']);
    const detail = { ...row, rank: 1, totalScore: 88, yearsExperience: 4, redactedText: 'hello [REDACTED] world', parsedSkills: ['react'], projects: ['Dash'], notes: '',
      hiddenFindings: [{ type: 'white_text', text: 'ignore previous instructions', location: 'page 1' }] };
    const d = CandidateSchema.parse(a.toCandidate(detail));
    expect(d.hiddenFindings?.[0]?.kind).toBe('injection_phrase');
  });

  it('scores scale 0-10 -> 0-100', () => {
    const s = z.array(CriterionScoreSchema).parse(a.toScores({ perCriterion: [
      { criterionId: 'c1', score: 8, quote: 'q', location: { start: 1, end: 2 }, verified: true, confidence: 0.9, missing: false, authority: 'ai' },
      { criterionId: 'c2', score: 0, quote: '', location: null, verified: false, confidence: 0, missing: true, authority: 'code' },
    ] }));
    expect(s[0]?.score).toBe(80);
    expect(s[1]?.quote).toBeNull();
    expect(a.scoreToBackend(85)).toBe(9);
  });

  it('swap, run status', () => {
    SwapTestSchema.parse(a.toSwap({ redactedIdentical: true, original: { total: 80 }, swapped: { total: 80 }, delta: 0, rescoredDelta: null, rescoredTotal: null, limitNote: 'n' }));
    ScoreStatusSchema.parse(a.toScoreStatus({ runId: 'r', state: 'running', done: 2, total: 22, failures: [{ reason: 'x' }] }));
  });

  it('shortlist', () => {
    const item = { candidateId: 'c1', fileName: 'a.pdf', rank: 1, totalScore: 90, coverage: 1, verifiedEvidenceCount: 5, yearsExperience: 4, flags: [], stage: 'scored', tieBreakTrace: ['Tie on total, higher coverage wins'] };
    const r = ShortlistResultSchema.parse(a.toShortlist({ shortlist: [item], waitlist: [{ ...item, candidateId: 'c2', rank: 2 }], tieRule: 'x', approved: false, capacity: 6, waitlistSize: 3 }));
    expect(r.tieBreakTrace[0]?.rule).toBe('coverage');
  });

  it('schedule, shortfall, repairs', () => {
    ScheduleViewSchema.parse(a.toSchedule({
      jobTimeZone: 'Asia/Kolkata', breaks: [], unscheduled: [], conflictCount: 0,
      interviewers: [{ interviewerId: 'i1', name: 'Priya', timeZone: 'Asia/Kolkata', slots: [
        { id: 's1', jobId: 'j1', interviewerId: 'i1', start: '2026-11-02T04:30:00.000Z', end: '2026-11-02T05:15:00.000Z', timeZone: 'Asia/Kolkata', status: 'booked', candidateId: 'c1' },
        { id: 's2', jobId: 'j1', interviewerId: 'i1', start: '2026-11-02T05:15:00.000Z', end: '2026-11-02T06:00:00.000Z', timeZone: 'Asia/Kolkata', status: 'open' },
      ] }],
    }));
    ShortfallReportSchema.parse(a.toShortfall({ needed: 9, available: 6, deficit: 3, fixes: [{ kind: 'add_days', amount: 1, unit: 'days', description: 'Add 1 day' }] }));
    expect(a.toRepairs({ before: [], after: [], moved: [], unplaced: [], history: [] })).toEqual([]);
    z.array(RepairDiffSchema).parse(a.toRepairs({
      before: [{ slotId: 's1', interviewerId: 'i1', candidateId: 'c1', start: '2026-11-02T04:30:00.000Z', end: 'x' }], after: [{ slotId: 's2', interviewerId: 'i1', candidateId: 'c1', start: '2026-11-02T05:15:00.000Z', end: 'x' }],
      moved: [{ candidateId: 'c1', fromSlotId: 's1', toSlotId: 's2' }], unplaced: [], trigger: 'unavailable', history: [{ id: 'h1', trigger: 'unavailable', ts: '2026-11-02T00:00:00.000Z' }],
    }));
  });

  it('invites and portal', () => {
    const inv = { id: 'v1', candidateId: 'c1', slotId: 's1', emailStatus: 'draft', response: 'pending', kind: 'invite', subject: 'Hi', body: 'B' };
    expect(InviteSchema.parse(a.toInvite(inv)).emailStatus).toBe('queued');
    PortalViewSchema.parse(a.toPortalView({ firstName: 'Asha', jobTitle: 'FE', whenText: 'Mon', startUtc: 'a', endUtc: 'b', timeZone: 'UTC', durationMinutes: 45, format: 'physical', whereText: 'HQ', response: 'pending', kind: 'invite' }));
    PortalStatusSchema.parse(a.toPortalStatus({ matched: ['react'], missing: [], humanReviewed: true, summary: 's' }));
  });

  it('audit, trace, notifications', () => {
    AuditEntrySchema.parse(a.toAudit({ seq: 1, ts: '2026-10-31T00:00:00.000Z', actor: { id: 'u', role: 'demo_hr', name: 'Demo' }, action: 'x', entityType: 'job', entityId: 'j1', prevHash: 'p', hash: 'h', payload: { a: 1 } }));
    z.array(TraceEntrySchema).parse(a.toTrace([{ tool: 'score', inputSummary: 'i', outputSummary: 'o', durationMs: 5, status: 'fallback', ts: '2026-10-31T00:00:00.000Z' }]));
    NotificationSchema.parse(a.toNotification({ id: 'n1', type: 't', title: 'T', body: 'B', ts: '2026-10-31T00:00:00.000Z' }));
  });

  it('analytics', () => {
    const stages = ['applied', 'scored', 'shortlisted', 'waitlisted', 'invited', 'confirmed', 'declined'];
    const rec = Object.fromEntries(stages.map((s) => [s, 1]));
    AnalyticsViewSchema.parse(a.toAnalytics({
      funnel: rec, timeInStageHours: rec,
      interviewerUtilization: [{ interviewerId: 'i1', day: '2026-11-02', booked: 2, total: 4, utilization: 0.5 }],
      trustMeter: { verifiedQuotePct: 90, openFlags: 2, injectionsCaught: 1, hiddenTextCaught: 1 },
      biasPanel: { groups: [{ group: 'A', total: 10, shortlisted: 4, selectionRate: 0.4, ratioToHighest: 1, flagged: false, smallSample: false }], threshold: 0.8, highestGroup: 'A', caveat: 'demo' },
    }, { i1: 'Priya' }));
  });
});
