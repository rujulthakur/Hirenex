import { z } from 'zod';
import { copy } from '@/lib/copy';
import { dayjs, localZone } from '@/lib/time';
import type { Interviewer, Job, JobInput } from '@/types';

const e = copy.jobs.errors;

/* ---------- Form value types (the wizard's single source of truth) ---------- */

export interface WizardSkill { name: string; required: boolean }
export interface WizardCriterion { id: string; name: string; weight: number; locked?: boolean }
export interface WizardBreak { from: string; to: string }
export interface WizardWindow { id: string; date: string; from: string; to: string }
export interface WizardInterviewer { id: string; name: string; email: string; timeZone: string; windows: WizardWindow[] }

export interface WizardConstraints {
  startDate: string;
  endDate: string;
  dailyStart: string;
  dailyEnd: string;
  breaks: WizardBreak[];
  timeZone: string;
  format: 'virtual' | 'physical';
  meetingLink: string;
  location: string;
}

export interface WizardValues {
  title: string;
  description: string;
  skills: WizardSkill[];
  criteria: WizardCriterion[];
  capacity: number;
  waitlistSize: number;
  durationMinutes: number;
  constraints: WizardConstraints;
  interviewers: WizardInterviewer[];
}

/** Number of steps that carry form fields (the 7th step is the read-only review). */
export const FIELD_STEPS = 6;
export const TOTAL_STEPS = 7;
export const REVIEW_STEP = 6;

/** Flat map of "path.to.field" -> first error message. */
export type ErrorMap = Record<string, string>;

/* ---------- Helpers ---------- */

const LOCAL_PREFIX = 'local_';
export function newLocalId(kind: string): string {
  return `${LOCAL_PREFIX}${kind}_${Math.random().toString(36).slice(2, 8)}`;
}
export function isLocalId(id: string): boolean {
  return id.startsWith(LOCAL_PREFIX);
}

function isValidZone(zone: string): boolean {
  if (zone.trim() === '') return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

const timeField = z.string().regex(HHMM, e.timeRequired);
const zoneField = z.string().refine(isValidZone, e.zoneInvalid);

/* ---------- Per-step Zod schemas ---------- */

const basicsSchema = z.object({
  title: z.string().trim().min(3, e.titleShort).max(120, e.titleLong),
  description: z.string().trim().min(20, e.descriptionShort),
});

const skillsSchema = z.object({
  skills: z
    .array(z.object({ name: z.string().trim().min(1), required: z.boolean() }))
    .refine((list) => list.some((s) => s.required), e.skillsRequired),
});

const criteriaSchema = z.object({
  criteria: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().trim().min(1, e.criterionNameRequired),
        weight: z.number({ invalid_type_error: e.weightRange }).int(e.weightRange).min(0, e.weightRange).max(100, e.weightRange),
      }),
    )
    .min(3, e.criteriaMin)
    .superRefine((list, ctx) => {
      const names = list.map((c) => c.name.trim().toLowerCase()).filter((n) => n !== '');
      if (new Set(names).size !== names.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: e.criteriaUnique });
      const sum = list.reduce((a, c) => a + (Number.isFinite(c.weight) ? c.weight : 0), 0);
      if (sum !== 100) ctx.addIssue({ code: z.ZodIssueCode.custom, message: e.criteriaSum(sum) });
    }),
});

const capacitySchema = z.object({
  capacity: z.number({ invalid_type_error: e.capacityRange }).int(e.capacityRange).min(1, e.capacityRange).max(100, e.capacityRange),
  waitlistSize: z.number({ invalid_type_error: e.waitlistRange }).int(e.waitlistRange).min(0, e.waitlistRange).max(100, e.waitlistRange),
  durationMinutes: z
    .number({ invalid_type_error: e.durationRange })
    .int(e.durationRange)
    .min(15, e.durationRange)
    .max(180, e.durationRange),
});

const constraintsSchema = z.object({
  constraints: z
    .object({
      startDate: z.string().min(1, e.dateRequired),
      endDate: z.string().min(1, e.dateRequired),
      dailyStart: timeField,
      dailyEnd: timeField,
      breaks: z.array(z.object({ from: timeField, to: timeField })),
      timeZone: zoneField,
      format: z.enum(['virtual', 'physical']),
      meetingLink: z.string(),
      location: z.string(),
    })
    .superRefine((c, ctx) => {
      if (c.startDate && c.endDate && c.endDate < c.startDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: e.dateOrder });
      }
      const hoursOk = HHMM.test(c.dailyStart) && HHMM.test(c.dailyEnd);
      if (hoursOk && minutes(c.dailyEnd) <= minutes(c.dailyStart)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['dailyEnd'], message: e.timeOrder });
      }
      c.breaks.forEach((b, i) => {
        if (!HHMM.test(b.from) || !HHMM.test(b.to)) return;
        if (minutes(b.to) <= minutes(b.from)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['breaks', i, 'to'], message: e.timeOrder });
        } else if (hoursOk && (minutes(b.from) < minutes(c.dailyStart) || minutes(b.to) > minutes(c.dailyEnd))) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['breaks', i, 'from'], message: e.breakOutside });
        }
      });
      if (c.format === 'virtual' && !/^https:\/\/\S+$/.test(c.meetingLink.trim())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['meetingLink'], message: e.linkInvalid });
      }
      if (c.format === 'physical' && c.location.trim().length < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['location'], message: e.locationShort });
      }
    }),
});

const interviewersSchema = z.object({
  interviewers: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().trim().min(1, e.nameRequired),
        email: z.string().trim().email(e.emailInvalid),
        timeZone: zoneField,
        windows: z
          .array(
            z
              .object({ id: z.string(), date: z.string().min(1, e.dateRequired), from: timeField, to: timeField })
              .superRefine((w, ctx) => {
                if (HHMM.test(w.from) && HHMM.test(w.to) && minutes(w.to) <= minutes(w.from)) {
                  ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['to'], message: e.timeOrder });
                }
              }),
          )
          .min(1, e.windowsMin),
      }),
    )
    .min(3, e.interviewersMin),
});

const stepSchemas: ReadonlyArray<z.ZodType<unknown>> = [
  basicsSchema,
  skillsSchema,
  criteriaSchema,
  capacitySchema,
  constraintsSchema,
  interviewersSchema,
];

/** Validates one step (0 to 5) against the current values. Review step (6) returns no errors of its own. */
export function validateStep(step: number, values: WizardValues): ErrorMap {
  const schema = stepSchemas[step];
  if (!schema) return {};
  const result = schema.safeParse(values);
  if (result.success) return {};
  const map: ErrorMap = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.');
    if (!(key in map)) map[key] = issue.message;
  }
  return map;
}

/** Errors for every field step, index = step number. */
export function validateAll(values: WizardValues): ErrorMap[] {
  return Array.from({ length: FIELD_STEPS }, (_, i) => validateStep(i, values));
}

export function errorCount(map: ErrorMap): number {
  return Object.keys(map).length;
}

/* ---------- Defaults and conversions ---------- */

export function defaultValues(): WizardValues {
  return {
    title: '',
    description: '',
    skills: [],
    criteria: [
      { id: newLocalId('crit'), name: 'Skills match', weight: 40 },
      { id: newLocalId('crit'), name: 'Relevant experience', weight: 35 },
      { id: newLocalId('crit'), name: 'Project evidence', weight: 25 },
    ],
    capacity: 5,
    waitlistSize: 3,
    durationMinutes: 45,
    constraints: {
      startDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().add(5, 'day').format('YYYY-MM-DD'),
      dailyStart: '09:00',
      dailyEnd: '17:00',
      breaks: [{ from: '12:30', to: '13:30' }],
      timeZone: localZone(),
      format: 'virtual',
      meetingLink: '',
      location: '',
    },
    interviewers: [],
  };
}

export function jobToValues(job: Job, interviewers: Interviewer[]): WizardValues {
  return {
    title: job.title,
    description: job.description,
    skills: [
      ...job.requiredSkills.map((name) => ({ name, required: true })),
      ...job.preferredSkills.map((name) => ({ name, required: false })),
    ],
    criteria: job.criteria.map((c) => ({ id: c.id, name: c.name, weight: c.weight })),
    capacity: job.capacity,
    waitlistSize: job.waitlistSize,
    durationMinutes: job.durationMinutes,
    constraints: {
      startDate: job.constraints.startDate,
      endDate: job.constraints.endDate,
      dailyStart: job.constraints.dailyStart,
      dailyEnd: job.constraints.dailyEnd,
      breaks: job.constraints.breaks.map((b) => ({ from: b.from, to: b.to })),
      timeZone: job.constraints.timeZone,
      format: job.constraints.format,
      meetingLink: job.constraints.meetingLink ?? '',
      location: job.constraints.location ?? '',
    },
    interviewers: interviewers.map((iv) => ({
      id: iv.id,
      name: iv.name,
      email: iv.email,
      timeZone: iv.timeZone,
      windows: iv.availability.map((w) => {
        const from = dayjs.utc(w.from).tz(iv.timeZone);
        const to = dayjs.utc(w.to).tz(iv.timeZone);
        return { id: newLocalId('win'), date: from.format('YYYY-MM-DD'), from: from.format('HH:mm'), to: to.format('HH:mm') };
      }),
    })),
  };
}

export function valuesToJobInput(v: WizardValues): JobInput {
  const c = v.constraints;
  return {
    title: v.title.trim(),
    description: v.description.trim(),
    requiredSkills: v.skills.filter((s) => s.required).map((s) => s.name),
    preferredSkills: v.skills.filter((s) => !s.required).map((s) => s.name),
    criteria: v.criteria.map((cr) => ({ id: isLocalId(cr.id) ? undefined : cr.id, name: cr.name.trim(), weight: cr.weight })),
    capacity: v.capacity,
    waitlistSize: v.waitlistSize,
    durationMinutes: v.durationMinutes,
    constraints: {
      startDate: c.startDate,
      endDate: c.endDate,
      dailyStart: c.dailyStart,
      dailyEnd: c.dailyEnd,
      breaks: c.breaks,
      timeZone: c.timeZone,
      format: c.format,
      meetingLink: c.format === 'virtual' ? c.meetingLink.trim() : undefined,
      location: c.format === 'physical' ? c.location.trim() : undefined,
    },
  };
}

export function valuesToInterviewers(v: WizardValues): Interviewer[] {
  return v.interviewers.map((iv) => ({
    id: iv.id,
    name: iv.name.trim(),
    email: iv.email.trim(),
    timeZone: iv.timeZone,
    availability: iv.windows.map((w) => ({
      from: dayjs.tz(`${w.date} ${w.from}`, iv.timeZone).utc().toISOString(),
      to: dayjs.tz(`${w.date} ${w.to}`, iv.timeZone).utc().toISOString(),
    })),
  }));
}
