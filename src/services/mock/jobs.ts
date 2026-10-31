import type { Api } from '../contract';
import type { Job } from '@/types';
import { nowIso } from '@/lib/time';
import { actor, appendAudit, db } from './db';
import { clone, fail, lat, paginate, uid } from './util';

function find(id: string): Job {
  return db.jobs.find((j) => j.id === id) ?? fail('NOT_FOUND', 'Job not found.', 404);
}
function checkCriteria(weights: number[]): void {
  if (weights.length < 3) fail('VALIDATION_FAILED', 'At least 3 criteria are required.');
  if (weights.reduce((a, b) => a + b, 0) !== 100) fail('VALIDATION_FAILED', 'Criteria weights must sum to 100.');
}

export const jobs: Api['jobs'] = {
  async list(page = 1, limit = 20) {
    await lat();
    const all = db.jobs.map((j) => ({ ...clone(j), candidateCount: db.candidates.filter((c) => c.jobId === j.id).length }));
    return paginate(all, page, limit);
  },
  async create(input) {
    await lat();
    checkCriteria(input.criteria.map((c) => c.weight));
    const job: Job = {
      ...clone(input), criteria: input.criteria.map((c) => ({ ...c, id: c.id ?? uid('c_') })),
      id: uid('job_'), status: 'open', candidateCount: 0, createdAt: nowIso(), updatedAt: nowIso(),
    };
    db.jobs.push(job);
    await appendAudit(actor(), 'job.create', null, { id: job.id, title: job.title });
    return clone(job);
  },
  async get(id) {
    await lat();
    return clone(find(id));
  },
  async update(id, input) {
    await lat();
    const job = find(id);
    if (input.criteria) checkCriteria(input.criteria.map((c) => c.weight));
    const { criteria, ...rest } = input;
    Object.assign(job, rest, { updatedAt: nowIso() });
    if (criteria) job.criteria = criteria.map((c) => ({ ...c, id: c.id ?? uid('c_') }));
    await appendAudit(actor(), 'job.update', null, { id, fields: Object.keys(input) });
    return clone(job);
  },
  async importDocument(file) {
    await lat();
    const title = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Imported opening';
    const job: Job = {
      id: uid('job_'), title, description: `Opening created from ${file.name}.`, status: 'open',
      requiredSkills: ['Communication'], preferredSkills: [],
      criteria: [
        { id: uid('c_'), name: 'Skills match', weight: 40 }, { id: uid('c_'), name: 'Relevant experience', weight: 35 }, { id: uid('c_'), name: 'Project evidence', weight: 25 },
      ],
      capacity: 5, waitlistSize: 3, durationMinutes: 30,
      constraints: { startDate: '', endDate: '', dailyStart: '10:00', dailyEnd: '13:00', breaks: [], timeZone: 'Asia/Kolkata', format: 'virtual', meetingLink: 'https://meet.google.com/new' },
      candidateCount: 0, createdAt: nowIso(), updatedAt: nowIso(),
    } as Job;
    db.jobs.push(job);
    return { job: clone(job), summary: { requiredSkills: 1, preferredSkills: 0, criteria: 3, openingsFound: false } };
  },
  async getInterviewers(id) {
    await lat();
    find(id);
    return clone(db.interviewers);
  },
  async putInterviewers(id, list) {
    await lat();
    const job = find(id);
    if (list.length < 3) fail('VALIDATION_FAILED', 'At least 3 interviewers are required.');
    db.interviewers = clone(list);
    job.interviewers = db.interviewers;
    await appendAudit(actor(), 'job.interviewers.replace', null, { count: list.length });
    return clone(db.interviewers);
  },
};
