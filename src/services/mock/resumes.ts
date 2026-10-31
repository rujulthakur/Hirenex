import type { Api } from '../contract';
import type { UploadResult } from '@/types';
import { db } from './db';
import { actor, appendAudit } from './db';
import { addTrace } from './db';
import { makeCandidate } from './seed';
import { lat } from './util';

const MAX_BYTES = 10 * 1024 * 1024;

/** candidate id -> email of the account that uploaded it (duplicates are per job AND per account). */
const uploaders = new Map<string, string>();

export const resumes: Api['resumes'] = {
  async upload(jobId, files) {
    await lat();
    const results: UploadResult[] = [];
    for (const f of files) {
      const lower = f.name.toLowerCase();
      if (!/\.(pdf|docx)$/.test(lower)) { results.push({ fileName: f.name, status: 'rejected', flags: [], reason: 'wrong_type' }); continue; }
      if (f.size > MAX_BYTES) { results.push({ fileName: f.name, status: 'rejected', flags: [], reason: 'too_large' }); continue; }
      if (lower.includes('scan')) { results.push({ fileName: f.name, status: 'rejected', flags: [], reason: 'unreadable_scan' }); continue; }
      const me = db.user?.email ?? 'anonymous';
      if (db.candidates.some((c) => c.jobId === jobId && c.fileName === f.name && uploaders.get(c.id) === me)) { results.push({ fileName: f.name, status: 'rejected', flags: [], reason: 'duplicate' }); continue; }
      const order = db.candidates.length + 1;
      const evil = lower.includes('evil') || lower.includes('hidden');
      const c = makeCandidate(evil ? 7 : 30 + order, order, 'applied', false);
      c.id = `cand_up${order}${Math.random().toString(16).slice(2, 6)}`;
      c.jobId = jobId;
      c.fileName = f.name;
      c.blindLabel = `Candidate ${String(order).padStart(2, '0')}`;
      if (!evil) c.flags = c.flags.filter((x) => x === 'incomplete');
      uploaders.set(c.id, me);
      db.candidates.push(c);
      addTrace('parse_resume', f.name, 'text extracted', 120);
      if (evil) addTrace('scan_hidden_text', f.name, 'hidden text found', 80);
      results.push({ fileName: f.name, status: evil ? 'flagged' : 'accepted', flags: c.flags, candidateId: c.id });
    }
    await appendAudit(actor(), 'resumes.upload', null, { files: files.length });
    return results;
  },
};
