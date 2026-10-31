import type {
  AuditEntry, Candidate, Constraints, Interviewer, Invite, Job, Notification, RepairDiff, Slot, TraceEntry, User,
} from '@/types';
import { dayjs, nowIso } from '@/lib/time';
import { JOB_ID, SEED_COUNT, makeCandidate, makeInterviewers, makeJob } from './seed';
import { uid } from './util';

export interface ScoringRun { runId: string; startedAt: number; total: number; done: number; targetIds: string[]; finished: boolean; durationMs: number }

export interface MockDb {
  user: User | null;
  otpSends: Record<string, number[]>;
  otpAttempts: Record<string, number>;
  jobs: Job[];
  interviewers: Interviewer[];
  candidates: Candidate[];
  slots: Slot[];
  invites: Invite[];
  repairs: RepairDiff[];
  audit: AuditEntry[];
  trace: TraceEntry[];
  notifications: Notification[];
  run: ScoringRun | null;
  approved: { shortlistIds: string[]; waitlistIds: string[] } | null;
  scheduleRan: boolean;
  weightsOverride: Record<string, number> | null;
}

const SESSION_KEY = 'th_mock_user';

function fresh(): MockDb {
  return {
    user: null, otpSends: {}, otpAttempts: {}, jobs: [], interviewers: [], candidates: [], slots: [], invites: [], repairs: [],
    audit: [], trace: [], notifications: [], run: null, approved: null, scheduleRan: false, weightsOverride: null,
  };
}

export const db: MockDb = fresh();

export function loadSession(): User | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}
export function saveSession(u: User | null): void {
  db.user = u;
  try {
    if (u) sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable: session lasts for this page load */
  }
}
db.user = loadSession();

export function resetDb(): void {
  const keep = db.user;
  Object.assign(db, fresh());
  db.user = keep;
}

export function getJob(id: string): Job {
  const j = db.jobs.find((x) => x.id === id);
  if (!j) throw Object.assign(new Error('Job not found'), { notFound: true });
  return j;
}

/** Hash chain: SHA-256 over seq|actor|action|old|new|prevHash using SubtleCrypto. */
export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
export function entryPayload(e: Pick<AuditEntry, 'seq' | 'actor' | 'action' | 'oldValue' | 'newValue' | 'prevHash'>): string {
  return `${e.seq}|${e.actor}|${e.action}|${JSON.stringify(e.oldValue)}|${JSON.stringify(e.newValue)}|${e.prevHash}`;
}
const GENESIS = '0'.repeat(64);

export async function appendAudit(actor: string, action: string, oldValue: unknown = null, newValue: unknown = null): Promise<AuditEntry> {
  const prev = db.audit[db.audit.length - 1];
  const base = { seq: (prev?.seq ?? 0) + 1, actor, action, oldValue, newValue, prevHash: prev?.hash ?? GENESIS };
  const hash = await sha256(entryPayload(base));
  const entry: AuditEntry = { ...base, hash, createdAt: nowIso(), jobId: JOB_ID };
  db.audit.push(entry);
  return entry;
}

export async function verifyChain(): Promise<{ valid: boolean; brokenAtSeq?: number }> {
  let prevHash = GENESIS;
  for (const e of db.audit) {
    if (e.prevHash !== prevHash) return { valid: false, brokenAtSeq: e.seq };
    const h = await sha256(entryPayload(e));
    if (h !== e.hash) return { valid: false, brokenAtSeq: e.seq };
    prevHash = e.hash;
  }
  return { valid: true };
}

/** Dev/demo helper: corrupts one entry so the "broken at seq N" state can be shown. */
export function tamperAudit(seq: number): void {
  const e = db.audit.find((x) => x.seq === seq);
  if (e) e.newValue = { tampered: true };
}

export function addTrace(tool: TraceEntry['tool'], inputSummary: string, outputSummary: string, durationMs: number, status: TraceEntry['status'] = 'ok'): void {
  db.trace.push({ id: uid('tr_'), tool, inputSummary, outputSummary, durationMs, status, at: nowIso() });
}

export function notify(title: string, body: string, href?: string): void {
  db.notifications.unshift({ id: uid('n_'), title, body, read: false, createdAt: nowIso(), href });
}

export function actor(): string {
  return db.user ? `${db.user.role}:${db.user.email}` : 'system';
}

export function genSlots(job: Job, interviewers: Interviewer[]): Slot[] {
  const out: Slot[] = [];
  const days = [job.constraints.startDate, job.constraints.endDate];
  const times = ['10:00', '10:45', '11:30', '13:00', '13:45'];
  for (const iv of interviewers) {
    for (const d of days) {
      for (const t of times) {
        const start = dayjs.tz(`${d} ${t}`, iv.timeZone).utc();
        out.push({
          id: `slot_${iv.id}_${d}_${t.replace(':', '')}`, interviewerId: iv.id, start: start.toISOString(),
          end: start.add(job.durationMinutes, 'minute').toISOString(), timeZone: iv.timeZone, status: 'open', candidateId: null,
        });
      }
    }
  }
  return out;
}

export function seedDb(): void {
  const user = db.user;
  Object.assign(db, fresh());
  db.user = user;
  const job = makeJob();
  db.jobs = [job];
  db.interviewers = makeInterviewers();
  db.candidates = Array.from({ length: SEED_COUNT }, (_, i) => makeCandidate(i, i + 1, 'scored', true));
  db.slots = genSlots(job, db.interviewers);
  job.status = 'scored';
  job.candidateCount = db.candidates.length;
  job.interviewers = db.interviewers;
  recomputeRanks();
  notify('Demo data loaded', '20 synthetic resumes and 3 interviewers are ready.', `/app/jobs/${JOB_ID}/candidates`);
}

export function constraintsOf(job: Job): Constraints {
  return job.constraints;
}

export function totalFor(c: Candidate, weights?: Record<string, number> | null): number | null {
  if (!c.scores) return null;
  const job = db.jobs[0];
  const w = weights ?? Object.fromEntries((job?.criteria ?? []).map((x) => [x.id, x.weight]));
  const sum = Object.values(w).reduce((a, b) => a + b, 0) || 100;
  const t = c.scores.reduce((acc, s) => acc + (s.score * (w[s.criterionId] ?? 0)) / sum, 0);
  return Math.round(t * 10) / 10;
}

function coverage(c: Candidate, job: Job): number {
  const have = new Set(c.skills ?? []);
  return job.requiredSkills.filter((s) => have.has(s)).length / Math.max(1, job.requiredSkills.length);
}
export function verifiedCount(c: Candidate): number {
  return (c.scores ?? []).filter((s) => s.verified && !s.missing).length;
}
export function compareCandidates(a: Candidate, b: Candidate, job: Job, weights?: Record<string, number> | null): number {
  return (
    (totalFor(b, weights) ?? -1) - (totalFor(a, weights) ?? -1) ||
    coverage(b, job) - coverage(a, job) ||
    verifiedCount(b) - verifiedCount(a) ||
    (b.yearsExperience ?? 0) - (a.yearsExperience ?? 0) ||
    a.uploadOrder - b.uploadOrder
  );
}
export function coverageOf(c: Candidate, job: Job): number {
  return coverage(c, job);
}

export function recomputeRanks(): void {
  const job = db.jobs[0];
  if (!job) return;
  const scored = db.candidates.filter((c) => c.scores).sort((a, b) => compareCandidates(a, b, job));
  scored.forEach((c, idx) => {
    c.rank = idx + 1;
    c.totalScore = totalFor(c);
  });
}
