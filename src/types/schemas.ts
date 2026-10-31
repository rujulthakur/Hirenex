import { z } from 'zod';
import {
  Authority, CandidateStage, EmailStatus, FlagKind, InviteResponse, JobStatus,
  MeetingFormat, Role, RunState, SlotStatus,
} from './enums';

const Id = z.string();
const Iso = z.string();

export const UserSchema = z.object({
  id: Id, email: z.string(), name: z.string(), role: Role,
});
export type User = z.infer<typeof UserSchema>;

export const CriterionSchema = z.object({
  id: Id, name: z.string(), weight: z.number(), description: z.string().optional(),
});
export type Criterion = z.infer<typeof CriterionSchema>;

export const AvailabilityWindowSchema = z.object({ from: Iso, to: Iso });
export type AvailabilityWindow = z.infer<typeof AvailabilityWindowSchema>;

export const InterviewerSchema = z.object({
  id: Id, name: z.string(), email: z.string(), timeZone: z.string(),
  availability: z.array(AvailabilityWindowSchema),
});
export type Interviewer = z.infer<typeof InterviewerSchema>;

export const ConstraintsSchema = z.object({
  startDate: z.string(), endDate: z.string(),
  dailyStart: z.string(), dailyEnd: z.string(),
  breaks: z.array(z.object({ from: z.string(), to: z.string() })),
  timeZone: z.string(),
  format: MeetingFormat,
  meetingLink: z.string().optional(),
  location: z.string().optional(),
});
export type Constraints = z.infer<typeof ConstraintsSchema>;

export const JobSchema = z.object({
  id: Id, title: z.string(), description: z.string(), status: JobStatus,
  requiredSkills: z.array(z.string()), preferredSkills: z.array(z.string()),
  criteria: z.array(CriterionSchema),
  capacity: z.number(), waitlistSize: z.number(), durationMinutes: z.number(),
  constraints: ConstraintsSchema,
  interviewers: z.array(InterviewerSchema).optional(),
  candidateCount: z.number().optional(),
  createdAt: Iso, updatedAt: Iso,
});
export type Job = z.infer<typeof JobSchema>;

export const JobInputSchema = JobSchema.pick({
  title: true, description: true, requiredSkills: true, preferredSkills: true, criteria: true,
  capacity: true, waitlistSize: true, durationMinutes: true, constraints: true,
}).extend({ criteria: z.array(CriterionSchema.omit({ id: true }).extend({ id: Id.optional() })) });
export type JobInput = z.infer<typeof JobInputSchema>;

export const CriterionScoreSchema = z.object({
  criterionId: Id, criterionName: z.string().optional(),
  score: z.number(), quote: z.string().nullable(),
  location: z.object({ start: z.number(), end: z.number() }).nullable(),
  verified: z.boolean(), confidence: z.number(), missing: z.boolean(),
  authority: Authority, overrideReason: z.string().optional(),
});
export type CriterionScore = z.infer<typeof CriterionScoreSchema>;

export const HiddenFindingSchema = z.object({
  start: z.number(), end: z.number(), text: z.string(), kind: z.enum(['hidden_text', 'injection_phrase']),
});
export type HiddenFinding = z.infer<typeof HiddenFindingSchema>;

export const ProjectSchema = z.object({ name: z.string(), summary: z.string() });

export const CandidateProfileSchema = z.object({
  name: z.string(), email: z.string(), phone: z.string(), location: z.string(),
  links: z.array(z.string()), skills: z.array(z.string()), keyPoints: z.array(z.string()),
});
export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;

export const CandidateSchema = z.object({
  id: Id, jobId: Id, displayName: z.string(), blindLabel: z.string(),
  stage: CandidateStage, rank: z.number().nullable(), totalScore: z.number().nullable(),
  flags: z.array(FlagKind), uploadOrder: z.number(), fileName: z.string(),
  syntheticGroup: z.string().optional(),
  yearsExperience: z.number().nullable().optional(),
  /** Review timeline: when the auto-reject clock started, when a hold ends, and why a candidate was rejected. */
  reviewClockStart: Iso.optional(),
  holdUntil: Iso.nullable().optional(),
  rejectionReason: z.enum(['hr_rejected', 'no_response', 'hold_expired']).nullable().optional(),
  skills: z.array(z.string()).optional(),
  profile: CandidateProfileSchema.optional(),
  projects: z.array(ProjectSchema).optional(),
  redactedText: z.string().optional(),
  hiddenFindings: z.array(HiddenFindingSchema).optional(),
  notes: z.string().optional(),
  scores: z.array(CriterionScoreSchema).optional(),
  createdAt: Iso,
});
export type Candidate = z.infer<typeof CandidateSchema>;

export const TieBreakEntrySchema = z.object({
  candidateId: Id, rule: z.enum(['total', 'coverage', 'verified', 'years', 'upload']), note: z.string(),
});
export const ShortlistRowSchema = z.object({
  candidateId: Id, rank: z.number(), totalScore: z.number(), flags: z.array(FlagKind),
  requiredCoverage: z.number(), verifiedCount: z.number(), yearsExperience: z.number().nullable(),
  previousRank: z.number().nullable().optional(),
});
export type ShortlistRow = z.infer<typeof ShortlistRowSchema>;

export const ShortlistResultSchema = z.object({
  ranked: z.array(ShortlistRowSchema), waitlist: z.array(ShortlistRowSchema),
  capacity: z.number(), approved: z.boolean(),
  tieBreakTrace: z.array(TieBreakEntrySchema),
});
export type ShortlistResult = z.infer<typeof ShortlistResultSchema>;

export const SlotSchema = z.object({
  id: Id, interviewerId: Id, start: Iso, end: Iso, timeZone: z.string(),
  status: SlotStatus, candidateId: Id.nullable(), changed: z.boolean().optional(),
});
export type Slot = z.infer<typeof SlotSchema>;

export const ScheduleViewSchema = z.object({
  interviewers: z.array(z.object({ interviewer: InterviewerSchema, slots: z.array(SlotSchema) })),
  conflicts: z.number(), state: RunState.optional(),
});
export type ScheduleView = z.infer<typeof ScheduleViewSchema>;

export const ShortfallReportSchema = z.object({
  needed: z.number(), available: z.number(), fixes: z.array(z.string()),
});
export type ShortfallReport = z.infer<typeof ShortfallReportSchema>;

const PlacementSchema = z.object({ candidateId: Id, slotId: Id.nullable(), interviewerId: Id.nullable(), start: Iso.nullable() });
export const RepairDiffSchema = z.object({
  id: Id, reason: z.string(), createdAt: Iso,
  before: z.array(PlacementSchema), after: z.array(PlacementSchema),
  moved: z.array(Id), unplaced: z.array(Id), promoted: Id.nullable().optional(),
});
export type RepairDiff = z.infer<typeof RepairDiffSchema>;

export const InviteSchema = z.object({
  id: Id, candidateId: Id, subject: z.string(), body: z.string(),
  emailStatus: EmailStatus, response: InviteResponse,
  previewUrl: z.string().nullable(), slotId: Id.nullable(), sentAt: Iso.nullable(),
});
export type Invite = z.infer<typeof InviteSchema>;

export const PortalViewSchema = z.object({
  candidateLabel: z.string(), jobTitle: z.string(), start: Iso, end: Iso, timeZone: z.string(),
  format: MeetingFormat, meetingLink: z.string().nullable(), location: z.string().nullable(),
  preparationNotes: z.string(), response: InviteResponse,
});
export type PortalView = z.infer<typeof PortalViewSchema>;

export const PortalStatusSchema = z.object({
  matchedSkills: z.array(z.string()), missingSkills: z.array(z.string()),
  humanReviewed: z.boolean(), stage: CandidateStage, nextSteps: z.string(),
});
export type PortalStatus = z.infer<typeof PortalStatusSchema>;

export const AuditEntrySchema = z.object({
  seq: z.number(), actor: z.string(), action: z.string(),
  oldValue: z.unknown().nullable(), newValue: z.unknown().nullable(),
  prevHash: z.string(), hash: z.string(), createdAt: Iso, jobId: Id.optional(),
});
export type AuditEntry = z.infer<typeof AuditEntrySchema>;

export const ChainVerifySchema = z.object({ valid: z.boolean(), brokenAtSeq: z.number().optional() });
export type ChainVerify = z.infer<typeof ChainVerifySchema>;

export const TraceEntrySchema = z.object({
  id: Id, tool: z.enum(['parse_resume', 'scan_hidden_text', 'score', 'verify_quotes', 'rank', 'schedule']),
  inputSummary: z.string(), durationMs: z.number(), status: z.enum(['running', 'ok', 'error']),
  outputSummary: z.string(), at: Iso,
});
export type TraceEntry = z.infer<typeof TraceEntrySchema>;

export const BiasGroupSchema = z.object({ group: z.string(), total: z.number(), selected: z.number(), rate: z.number(), ratio: z.number() });
export const AnalyticsViewSchema = z.object({
  funnel: z.array(z.object({ stage: CandidateStage, count: z.number() })),
  timeInStage: z.array(z.object({ stage: CandidateStage, hours: z.number() })),
  utilization: z.array(z.object({ interviewerId: Id, name: z.string(), cells: z.array(z.object({ label: z.string(), value: z.number() })) })),
  trustMeter: z.object({ verifiedQuotePercent: z.number(), openFlags: z.number(), injectionsCaught: z.number() }),
  biasPanel: z.object({ groups: z.array(BiasGroupSchema), threshold: z.number(), source: z.string() }),
});
export type AnalyticsView = z.infer<typeof AnalyticsViewSchema>;

// ---------- HR analytics summary ----------
export const SummaryRangeSchema = z.enum(['7d', '30d', '90d', '180d', '365d', 'all']);
export type SummaryRange = z.infer<typeof SummaryRangeSchema>;
export const HrSummarySchema = z.object({
  range: SummaryRangeSchema, from: z.string().nullable(), passMark: z.number(),
  applied: z.number(), interviewed: z.number(), passed: z.number(), failed: z.number(), notScored: z.number(),
  rows: z.array(z.object({
    name: z.string(), email: z.string(), phone: z.string(), job: z.string(), score: z.number().nullable(),
    result: z.enum(['passed', 'failed', 'not_scored']), invited: z.boolean(), uploadedAt: z.string(),
  })),
});
export type HrSummary = z.infer<typeof HrSummarySchema>;

// ---------- Profile (photo + personal settings, saved on the account) ----------
export const PreferencesSchema = z.object({
  emailAlerts: z.boolean(), scoringDone: z.boolean(), weeklyDigest: z.boolean(), autoOpenResults: z.boolean(), reduceMotion: z.boolean(),
  language: z.string(), timeZone: z.string(),
  theme: z.enum(['dark', 'light']), density: z.enum(['comfortable', 'compact']), sidebarCollapsed: z.boolean(), blindMode: z.boolean(),
}).partial();
export type Preferences = z.infer<typeof PreferencesSchema>;
export const ProfileSchema = z.object({ name: z.string(), avatar: z.string().nullable(), preferences: PreferencesSchema });
export type Profile = z.infer<typeof ProfileSchema>;
export interface ProfilePatch { name?: string; avatar?: string | null; preferences?: Preferences }

export const NotificationSchema = z.object({
  id: Id, title: z.string(), body: z.string(), read: z.boolean(), createdAt: Iso, href: z.string().optional(),
});
export type Notification = z.infer<typeof NotificationSchema>;

export const UploadResultSchema = z.object({
  fileName: z.string(),
  status: z.enum(['accepted', 'flagged', 'rejected']),
  flags: z.array(FlagKind),
  reason: z.enum(['wrong_type', 'too_large', 'unreadable_scan', 'duplicate']).optional(),
  candidateId: Id.optional(),
});
export type UploadResult = z.infer<typeof UploadResultSchema>;

export const RunRefSchema = z.object({ runId: Id });
export const ScoreStatusSchema = z.object({
  runId: Id, state: RunState, done: z.number(), total: z.number(), failures: z.number(),
  /** Plain reason of the first resume that could not be scored, when the server gave one. */
  firstFailure: z.string().optional(),
});
export type ScoreStatus = z.infer<typeof ScoreStatusSchema>;

export const SwapTestSchema = z.object({
  original: z.number(), swapped: z.number(), delta: z.number(), limitNote: z.string(),
});
export type SwapTest = z.infer<typeof SwapTestSchema>;

export const HealthSchema = z.object({
  status: z.string(), db: z.string().optional(), redis: z.string().optional(), llm: z.string().optional(),
  demoMode: z.boolean().optional(),
});
export type Health = z.infer<typeof HealthSchema>;

export const QrSchema = z.object({ url: z.string(), qrDataUrl: z.string() });
export type Qr = z.infer<typeof QrSchema>;

export const ScoreOverrideInputSchema = z.object({ score: z.number().min(0).max(100), reason: z.string().min(10) });
export type ScoreOverrideInput = z.infer<typeof ScoreOverrideInputSchema>;

export const OverrideResultSchema = z.object({ score: CriterionScoreSchema, totalScore: z.number(), auditSeq: z.number() });
export type OverrideResult = z.infer<typeof OverrideResultSchema>;

// ---------- HR interview meetings ----------
export const MeetingSettingsSchema = z.object({
  windowStart: z.string(), windowEnd: z.string(), slotMinutes: z.number(),
  meetLink: z.string(), timeZone: z.string(), companyName: z.string(),
});
export type MeetingSettings = z.infer<typeof MeetingSettingsSchema>;

export const MeetingSchema = z.object({
  id: z.string(), jobId: z.string(), candidateId: z.string(), candidateName: z.string(), candidateEmail: z.string(),
  start: z.string(), end: z.string(), meetLink: z.string(), status: z.enum(['scheduled', 'cancelled']),
  emailStatus: z.string(), previewUrl: z.string().optional(),
});
export type Meeting = z.infer<typeof MeetingSchema>;

export const MeetingCapacitySchema = z.object({ date: z.string(), total: z.number(), free: z.number(), settings: MeetingSettingsSchema });
export type MeetingCapacity = z.infer<typeof MeetingCapacitySchema>;

export const SendMeetingsResultSchema = z.object({
  date: z.string(),
  scheduled: z.array(MeetingSchema),
  skipped: z.array(z.object({ candidateId: z.string(), name: z.string(), reason: z.enum(['day_full', 'no_email', 'already_invited']) })),
  emailChannel: z.enum(['live', 'test']),
});
export type SendMeetingsResult = z.infer<typeof SendMeetingsResultSchema>;

export const HiringSettingsSchema = z.object({
  autoRejectEnabled: z.boolean(), autoRejectDays: z.number(), holdDays: z.number(), emailCandidates: z.boolean(),
});
export type HiringSettings = z.infer<typeof HiringSettingsSchema>;
