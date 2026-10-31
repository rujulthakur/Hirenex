import type {
  AnalyticsView, Candidate, CriterionScore, Health, Interviewer, Invite, Job, JobInput,
  HiringSettings, HrSummary, Meeting, MeetingCapacity, MeetingSettings, Notification, OverrideResult, SendMeetingsResult, PortalStatus, PortalView, Qr, RepairDiff, ScheduleView, ScoreOverrideInput,
  ScoreStatus, ShortfallReport, ShortlistResult, SwapTest, UploadResult, User, SummaryRange, Profile, ProfilePatch } from '@/types';
import type { CandidateStage } from '@/types';
import type { Paged } from './apiClient';

export interface CandidateListQuery { stage?: CandidateStage; q?: string; sort?: string; page?: number; limit?: number; flag?: string; history?: string }
export interface AuditQuery { actor?: string; action?: string; page?: number; limit?: number }
export interface Weights { [criterionId: string]: number }

/** Every function exposed by both the real and mock service layers. */
export interface JobImportResult {
  job: Job;
  summary: { requiredSkills: number; preferredSkills: number; criteria: number; openingsFound: boolean };
}

export interface Api {
  auth: {
    sendOtp(email: string): Promise<void>;
    verifyOtp(email: string, code: string): Promise<User>;
    google(idToken: string): Promise<User>;
    demoLogin(): Promise<User>;
    refresh(): Promise<void>;
    logout(): Promise<void>;
    me(): Promise<User>;
  };
  jobs: {
    list(page?: number, limit?: number): Promise<Paged<Job>>;
    create(input: JobInput): Promise<Job>;
    get(id: string): Promise<Job>;
    update(id: string, input: Partial<JobInput>): Promise<Job>;
    getInterviewers(id: string): Promise<Interviewer[]>;
    putInterviewers(id: string, list: Interviewer[]): Promise<Interviewer[]>;
    /** Reads a job description document (PDF/DOCX) and creates the opening from it. */
    importDocument(file: File, timeZone?: string): Promise<JobImportResult>;
  };
  resumes: { upload(jobId: string, files: File[]): Promise<UploadResult[]> };
  candidates: {
    list(jobId: string, q: CandidateListQuery): Promise<Paged<Candidate>>;
    get(id: string): Promise<Candidate>;
    scores(id: string): Promise<CriterionScore[]>;
    overrideScore(id: string, criterionId: string, input: ScoreOverrideInput): Promise<OverrideResult>;
    update(id: string, patch: { notes: string }): Promise<Candidate>;
    remove(id: string): Promise<void>;
    /** HR decision: hold (waiting list), reject, or move back to review. Hold and reject email the candidate. */
    decide(id: string, action: 'hold' | 'reject' | 'reopen'): Promise<Candidate>;
    swapTest(id: string): Promise<SwapTest>;
    /** Reuses resumes already uploaded for another opening so they can be scored for this one. */
    copyToJob(targetJobId: string, fromJobId: string, candidateIds: string[]): Promise<{ added: number; skipped: number }>;
  };
  scoring: {
    start(jobId: string): Promise<{ runId: string }>;
    status(jobId: string): Promise<ScoreStatus>;
  };
  shortlist: {
    get(jobId: string): Promise<ShortlistResult>;
    rerank(jobId: string, weights: Weights): Promise<ShortlistResult>;
    approve(jobId: string, shortlistIds: string[], waitlistIds: string[]): Promise<void>;
  };
  schedule: {
    run(jobId: string): Promise<{ runId: string }>;
    get(jobId: string): Promise<ScheduleView>;
    shortfall(jobId: string): Promise<ShortfallReport>;
    markUnavailable(jobId: string, interviewerId: string, range: { from: string; to: string }): Promise<void>;
    repairs(jobId: string): Promise<RepairDiff[]>;
  };
  invites: {
    preview(jobId: string): Promise<Invite[]>;
    update(id: string, patch: { subject?: string; body?: string }): Promise<Invite>;
    send(jobId: string): Promise<void>;
    list(jobId: string): Promise<Invite[]>;
  };
  portal: {
    get(token: string): Promise<PortalView>;
    accept(token: string): Promise<void>;
    decline(token: string, reason?: string): Promise<void>;
    reschedule(token: string, note: string): Promise<void>;
    status(token: string): Promise<PortalStatus>;
  };
  analytics: { get(jobId: string): Promise<AnalyticsView>; summary(range: SummaryRange, passMark: number): Promise<HrSummary> };
  profile: { get(): Promise<Profile>; save(patch: ProfilePatch): Promise<Profile> };
  notifications: { list(): Promise<Notification[]>; markRead(ids?: string[]): Promise<void> };
  demo: { seed(): Promise<void>; reset(): Promise<void>; qr(): Promise<Qr> };
  health: { get(): Promise<Health> };
  hiring: { settings(): Promise<HiringSettings>; save(patch: Partial<HiringSettings>): Promise<HiringSettings> };
  meetings: {
    settings(): Promise<MeetingSettings>;
    saveSettings(patch: Partial<MeetingSettings>): Promise<MeetingSettings>;
    capacity(): Promise<MeetingCapacity>;
    list(jobId: string): Promise<Meeting[]>;
    send(jobId: string, candidateIds: string[]): Promise<SendMeetingsResult>;
    cancel(id: string): Promise<void>;
  };
}
