/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Translators between the backend's JSON and the shapes the UI was built against.
 * Backend -> UI: to*()    UI -> backend: from*()
 * Keep every field-name difference in this one file.
 */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

type Raw = any;
const KNOWN_FLAGS = ['flagged', 'unverified_evidence', 'incomplete', 'hidden_text_found', 'injection_phrase_found'] as const;
const STAGES = ['applied', 'scored', 'shortlisted', 'waitlisted', 'on_hold', 'invited', 'confirmed', 'declined', 'rejected'] as const;
const TOOLS = ['parse_resume', 'scan_hidden_text', 'score', 'verify_quotes', 'rank', 'schedule'] as const;

/** Backend keeps 0-10 per criterion, the UI shows 0-100. */
const up = (n: number): number => Math.round(n * 10);
export const scoreToBackend = (n: number): number => Math.max(0, Math.min(10, Math.round(n / 10)));

export function toFlags(flags: Raw): string[] {
  const out = new Set<string>();
  for (const f of (flags ?? []) as string[]) {
    if ((KNOWN_FLAGS as readonly string[]).includes(f)) out.add(f);
    else if (f === 'unreadable_scan') out.add('incomplete');
    else if (f === 'needs_review' || f === 'near_duplicate') out.add('flagged');
    // rank_unstable has no UI badge; dropped.
  }
  return [...out];
}

const prettyName = (fileName: string): string =>
  fileName.replace(/\.(pdf|docx)$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || fileName;

// ---------- jobs ----------
export function expandDates(startDate: string, endDate: string): string[] {
  const out: string[] = [];
  let d = dayjs.utc(startDate);
  const end = dayjs.utc(endDate);
  while (!d.isAfter(end, 'day') && out.length < 31) {
    out.push(d.format('YYYY-MM-DD'));
    d = d.add(1, 'day');
  }
  return out.length > 0 ? out : [startDate];
}

export function toJob(j: Raw): Raw {
  const c = j.constraints ?? {};
  const dates: string[] = c.dates ?? [];
  return {
    id: j.id, title: j.title, description: j.description, status: j.status,
    requiredSkills: j.requiredSkills ?? [], preferredSkills: j.preferredSkills ?? [],
    criteria: (j.criteria ?? []).map((k: Raw) => ({ id: k.id, name: k.name, weight: k.weight, description: k.description || undefined })),
    capacity: j.capacity, waitlistSize: j.waitlistSize ?? 0, durationMinutes: j.interviewMinutes,
    constraints: {
      startDate: dates[0] ?? '', endDate: dates[dates.length - 1] ?? dates[0] ?? '',
      dailyStart: c.dailyStart, dailyEnd: c.dailyEnd,
      breaks: (c.breaks ?? []).map((b: Raw) => ({ from: b.start, to: b.end })),
      timeZone: c.timeZone, format: c.format,
      meetingLink: c.meetingLink || undefined, location: c.location || undefined,
    },
    candidateCount: j.candidateCount, createdAt: j.createdAt, updatedAt: j.updatedAt,
  };
}

function fromConstraints(c: Raw): Raw {
  return {
    dates: expandDates(c.startDate, c.endDate),
    dailyStart: c.dailyStart, dailyEnd: c.dailyEnd,
    breaks: (c.breaks ?? []).map((b: Raw) => ({ start: b.from, end: b.to })),
    timeZone: c.timeZone, format: c.format,
    ...(c.meetingLink ? { meetingLink: c.meetingLink } : {}),
    ...(c.location ? { location: c.location } : {}),
  };
}

export function fromJobInput(i: Raw): Raw {
  const out: Raw = { ...i };
  if (i.durationMinutes !== undefined) { out.interviewMinutes = i.durationMinutes; delete out.durationMinutes; }
  if (i.constraints) out.constraints = fromConstraints(i.constraints);
  if (i.criteria) {
    out.criteria = i.criteria.map((k: Raw, idx: number) => ({
      id: k.id ?? `crit_${idx + 1}`, name: k.name, weight: k.weight, description: k.description ?? '',
    }));
  }
  delete out.interviewers; delete out.candidateCount;
  return out;
}

// ---------- interviewers ----------
export function toInterviewer(i: Raw): Raw {
  const tz = i.timeZone;
  return {
    id: i.id, name: i.name, email: i.email ?? '', timeZone: tz,
    availability: (i.availability ?? []).map((a: Raw) => ({
      from: dayjs.tz(`${a.date} ${a.start}`, tz).utc().toISOString(),
      to: dayjs.tz(`${a.date} ${a.end}`, tz).utc().toISOString(),
    })),
  };
}

export function fromInterviewer(i: Raw): Raw {
  return {
    name: i.name, timeZone: i.timeZone,
    availability: (i.availability ?? []).map((w: Raw) => {
      const f = dayjs.utc(w.from).tz(i.timeZone);
      const t = dayjs.utc(w.to).tz(i.timeZone);
      return { date: f.format('YYYY-MM-DD'), start: f.format('HH:mm'), end: t.format('HH:mm') };
    }),
  };
}

// ---------- uploads ----------
export function toUploadResult(r: Raw): Raw {
  const flags = toFlags(r.flags);
  let status: string;
  let reason: string | undefined;
  switch (r.status) {
    case 'accepted': status = flags.some((f: string) => f === 'hidden_text_found' || f === 'injection_phrase_found') ? 'flagged' : 'accepted'; break;
    case 'unreadable': status = 'rejected'; reason = 'unreadable_scan'; break;
    case 'duplicate': status = 'rejected'; reason = 'duplicate'; break;
    default: {
      status = 'rejected';
      reason = /large|size/i.test(r.reason ?? '') ? 'too_large' : 'wrong_type';
    }
  }
  return { fileName: r.fileName, status, flags, reason, candidateId: r.candidateId };
}

// ---------- candidates ----------
export function toCandidate(c: Raw): Raw {
  const label = `Candidate ${String(c.uploadOrder ?? 0).padStart(2, '0')}`;
  const redactedText: string | undefined = c.redactedText;
  return {
    id: c.id, jobId: c.jobId, displayName: c.profile?.name?.trim() || prettyName(c.fileName ?? label), blindLabel: label,
    profile: c.profile ? { name: c.profile.name ?? '', email: c.profile.email ?? '', phone: c.profile.phone ?? '', location: c.profile.location ?? '', links: c.profile.links ?? [], skills: c.profile.skills ?? [], keyPoints: c.profile.keyPoints ?? [] } : undefined,
    stage: (STAGES as readonly string[]).includes(c.stage) ? c.stage : 'applied',
    rank: c.rank ?? null, totalScore: c.totalScore ?? null,
    flags: toFlags(c.flags), uploadOrder: c.uploadOrder ?? 0, fileName: c.fileName ?? '',
    yearsExperience: c.yearsExperience ?? null,
    reviewClockStart: c.reviewClockStart, holdUntil: c.holdUntil ?? null, rejectionReason: c.rejectionReason ?? null,
    skills: c.parsedSkills, projects: c.projects?.map((p: Raw) => (typeof p === 'string' ? { name: p, summary: '' } : p)),
    redactedText,
    hiddenFindings: c.hiddenFindings?.map((h: Raw) => {
      const idx = redactedText ? redactedText.indexOf(h.text) : -1;
      return {
        start: idx >= 0 ? idx : 0, end: idx >= 0 ? idx + h.text.length : 0, text: h.text,
        kind: /ignore|instruction|disregard|score this|rank this|system prompt|hire/i.test(h.text ?? '') ? 'injection_phrase' : 'hidden_text',
      };
    }),
    notes: c.notes,
    createdAt: c.createdAt ?? new Date().toISOString(),
  };
}

export function toScores(s: Raw): Raw[] {
  return (s.perCriterion ?? []).map((p: Raw) => ({
    criterionId: p.criterionId, score: up(p.score), quote: p.quote ? p.quote : null,
    location: p.location ?? null, verified: !!p.verified, confidence: p.confidence ?? 0, missing: !!p.missing,
    authority: p.authority, overrideReason: p.overrideReason,
  }));
}

export function toSwap(s: Raw): Raw {
  return { original: s.original?.total ?? 0, swapped: s.swapped?.total ?? 0, delta: s.delta ?? 0, limitNote: s.limitNote ?? '' };
}

// ---------- scoring / shortlist ----------
function friendlyFailure(reason: unknown): string | undefined {
  if (typeof reason !== 'string' || reason.length === 0) return undefined;
  if (/needs_review/i.test(reason)) return 'The AI answer for a resume could not be read. Run scoring again.';
  if (/unavailable|no llm provider|api key/i.test(reason)) return 'The AI service did not answer. Check the AI key on the server, then run scoring again.';
  return reason.slice(0, 200);
}

export function toScoreStatus(s: Raw): Raw {
  return { runId: s.runId, state: s.state, done: s.done ?? 0, total: s.total ?? 0, failures: Array.isArray(s.failures) ? s.failures.length : (s.failures ?? 0), firstFailure: Array.isArray(s.failures) ? friendlyFailure(s.failures[0]?.reason) : undefined };
}

const ruleOf = (t: string): string => (/coverage/i.test(t) ? 'coverage' : /verified/i.test(t) ? 'verified' : /year/i.test(t) ? 'years' : /upload/i.test(t) ? 'upload' : 'total');

export function toShortlist(v: Raw): Raw {
  const row = (r: Raw) => ({
    candidateId: r.candidateId, rank: r.rank, totalScore: r.totalScore, flags: toFlags(r.flags),
    requiredCoverage: r.coverage ?? 0, verifiedCount: r.verifiedEvidenceCount ?? 0, yearsExperience: r.yearsExperience ?? null,
    previousRank: r.previousRank ?? null,
  });
  const all = [...(v.shortlist ?? []), ...(v.waitlist ?? [])];
  return {
    ranked: (v.shortlist ?? []).map(row), waitlist: (v.waitlist ?? []).map(row),
    capacity: v.capacity ?? 0, approved: !!v.approved,
    tieBreakTrace: all.flatMap((r: Raw) => (r.tieBreakTrace ?? []).map((note: string) => ({ candidateId: r.candidateId, rule: ruleOf(note), note }))),
  };
}

// ---------- schedule ----------
export function toSchedule(v: Raw): Raw {
  return {
    interviewers: (v.interviewers ?? []).map((i: Raw) => ({
      interviewer: { id: i.interviewerId, name: i.name, email: '', timeZone: i.timeZone, availability: [] },
      slots: (i.slots ?? []).map((s: Raw) => ({
        id: s.id, interviewerId: s.interviewerId, start: s.start, end: s.end, timeZone: s.timeZone,
        status: s.status, candidateId: s.candidateId ?? null,
      })),
    })),
    conflicts: v.conflictCount ?? 0,
  };
}

export function toShortfall(r: Raw): Raw {
  return { needed: r.needed, available: r.available, fixes: (r.fixes ?? []).map((f: Raw) => (typeof f === 'string' ? f : f.description)) };
}

export function toRepairs(v: Raw): Raw[] {
  if (!v || ((v.before ?? []).length === 0 && (v.after ?? []).length === 0 && (v.moved ?? []).length === 0 && (v.unplaced ?? []).length === 0)) return [];
  const place = (p: Raw) => ({ candidateId: p.candidateId ?? '', slotId: p.slotId ?? null, interviewerId: p.interviewerId ?? null, start: p.start ?? null });
  const latest = (v.history ?? [])[0];
  return [{
    id: latest?.id ?? 'latest', reason: v.note ?? v.trigger ?? latest?.trigger ?? 'Schedule repaired',
    createdAt: v.ts ?? latest?.ts ?? new Date().toISOString(),
    before: (v.before ?? []).map(place), after: (v.after ?? []).map(place),
    moved: (v.moved ?? []).map((m: Raw) => m.candidateId), unplaced: v.unplaced ?? [], promoted: null,
  }];
}

// ---------- invites / portal ----------
export function toInvite(i: Raw): Raw {
  return {
    id: i.id, candidateId: i.candidateId, subject: i.subject ?? '', body: i.body ?? '',
    emailStatus: i.emailStatus === 'draft' ? 'queued' : i.emailStatus, response: i.response,
    previewUrl: i.previewUrl ?? null, slotId: i.slotId ?? null, sentAt: i.sentAt ?? null,
  };
}

export function toPortalView(p: Raw): Raw {
  const virtual = p.format === 'virtual';
  return {
    candidateLabel: p.firstName ?? 'Candidate', jobTitle: p.jobTitle, start: p.startUtc, end: p.endUtc,
    timeZone: p.timeZone, format: p.format, meetingLink: virtual ? (p.whereText ?? null) : null,
    location: virtual ? null : (p.whereText ?? null), preparationNotes: p.whenText ? `Your interview: ${p.whenText}` : '',
    response: p.response,
  };
}

export function toPortalStatus(s: Raw): Raw {
  return { matchedSkills: s.matched ?? [], missingSkills: s.missing ?? [], humanReviewed: !!s.humanReviewed, stage: 'invited', nextSteps: s.summary ?? '' };
}

// ---------- audit / trace / notifications ----------
export function toAudit(a: Raw): Raw {
  return {
    seq: a.seq, actor: a.actor?.name || a.actor?.id || 'system', action: a.action,
    oldValue: a.oldValue ?? null, newValue: a.newValue ?? a.payload ?? null,
    prevHash: a.prevHash, hash: a.hash, createdAt: a.ts, jobId: a.jobId,
  };
}

export function toTrace(rows: Raw[]): Raw[] {
  return rows.map((r, i) => ({
    id: `${r.ts}-${i}`, tool: (TOOLS as readonly string[]).includes(r.tool) ? r.tool : 'score',
    inputSummary: r.inputSummary ?? '', durationMs: r.durationMs ?? 0,
    status: r.status === 'running' || r.status === 'error' ? r.status : 'ok',
    outputSummary: r.outputSummary ?? r.error ?? '', at: r.ts,
  }));
}

export function toNotification(n: Raw): Raw {
  return { id: n.id, title: n.title, body: n.body, read: !!n.readAt, createdAt: n.ts, ...(n.href ? { href: n.href } : {}) };
}

// ---------- analytics ----------
export function toAnalytics(a: Raw, names: Record<string, string>): Raw {
  const byInterviewer = new Map<string, Array<{ label: string; value: number }>>();
  for (const r of a.interviewerUtilization ?? []) {
    const list = byInterviewer.get(r.interviewerId) ?? [];
    list.push({ label: r.day, value: r.utilization ?? 0 });
    byInterviewer.set(r.interviewerId, list);
  }
  const bp = a.biasPanel ?? {};
  return {
    funnel: STAGES.map((s) => ({ stage: s, count: a.funnel?.[s] ?? 0 })),
    timeInStage: STAGES.map((s) => ({ stage: s, hours: a.timeInStageHours?.[s] ?? 0 })),
    utilization: [...byInterviewer.entries()].map(([id, cells]) => ({ interviewerId: id, name: names[id] ?? id, cells })),
    trustMeter: {
      verifiedQuotePercent: a.trustMeter?.verifiedQuotePct ?? 0,
      openFlags: a.trustMeter?.openFlags ?? 0, injectionsCaught: a.trustMeter?.injectionsCaught ?? 0,
    },
    biasPanel: {
      groups: (bp.groups ?? []).map((g: Raw) => ({ group: g.group, total: g.total, selected: g.shortlisted ?? 0, rate: g.selectionRate ?? 0, ratio: g.ratioToHighest ?? 1 })),
      threshold: bp.threshold ?? 0.8, source: bp.caveat ?? 'Synthetic labels, demo only',
    },
  };
}
