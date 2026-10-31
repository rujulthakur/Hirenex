import { z } from 'zod';

export const CandidateStage = z.enum(['applied', 'scored', 'shortlisted', 'waitlisted', 'on_hold', 'invited', 'confirmed', 'declined', 'rejected']);
export type CandidateStage = z.infer<typeof CandidateStage>;

export const JobStatus = z.enum(['draft', 'open', 'scored', 'approved', 'scheduled', 'invited']);
export type JobStatus = z.infer<typeof JobStatus>;

export const SlotStatus = z.enum(['open', 'booked', 'blocked']);
export type SlotStatus = z.infer<typeof SlotStatus>;

export const EmailStatus = z.enum(['queued', 'sent', 'viewed', 'failed']);
export type EmailStatus = z.infer<typeof EmailStatus>;

export const InviteResponse = z.enum(['pending', 'accepted', 'declined', 'reschedule_requested']);
export type InviteResponse = z.infer<typeof InviteResponse>;

export const Role = z.enum(['hr_admin', 'interviewer', 'demo_hr']);
export type Role = z.infer<typeof Role>;

export const Authority = z.enum(['ai', 'code', 'human']);
export type Authority = z.infer<typeof Authority>;

export const MeetingFormat = z.enum(['virtual', 'physical']);
export type MeetingFormat = z.infer<typeof MeetingFormat>;

export const FlagKind = z.enum(['flagged', 'unverified_evidence', 'incomplete', 'hidden_text_found', 'injection_phrase_found']);
export type FlagKind = z.infer<typeof FlagKind>;

export const ErrorCode = z.enum([
  'VALIDATION_FAILED', 'UNAUTHENTICATED', 'FORBIDDEN', 'NOT_FOUND', 'CONFLICT', 'APPROVAL_REQUIRED',
  'RATE_LIMITED', 'UPLOAD_REJECTED', 'AI_UNAVAILABLE', 'SLOT_TAKEN', 'TOKEN_EXPIRED', 'INTERNAL',
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

export const RunState = z.enum(['queued', 'running', 'done', 'failed']);
export type RunState = z.infer<typeof RunState>;
