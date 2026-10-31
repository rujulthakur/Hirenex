import type { Api } from '../contract';
import { actor, appendAudit, db, resetDb, seedDb } from './db';
import { tokenFor } from './portal';
import { lat } from './util';

export const demo: Api['demo'] = {
  async seed() {
    await lat();
    seedDb();
    await appendAudit(actor(), 'demo.seed', null, { resumes: 20, interviewers: 3 });
  },
  async reset() {
    await lat();
    resetDb();
    await appendAudit(actor(), 'demo.reset', null, null);
  },
  async qr() {
    await lat();
    const pending = db.invites.find((i) => i.response === 'pending') ?? db.invites[0];
    const url = `${window.location.origin}/c/${tokenFor(pending?.candidateId ?? 'cand_01')}`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#fff"/><text x="100" y="105" text-anchor="middle" font-size="14" font-family="monospace">QR placeholder</text></svg>`;
    return { url, qrDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` };
  },
};
export const health: Api['health'] = {
  async get() {
    await lat();
    return { status: 'ok', db: 'mock', redis: 'mock', llm: 'mock', demoMode: true };
  },
};
