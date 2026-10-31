import type { Api } from '../contract';
import type { CandidateStage } from '@/types';
import { db } from './db';
import { lat } from './util';

const STAGES: CandidateStage[] = ['applied', 'scored', 'shortlisted', 'waitlisted', 'invited', 'confirmed', 'declined'];

const RANGE_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '180d': 180, '365d': 365 };

export const analytics: Api['analytics'] = {
  async summary(range, passMark) {
    await lat();
    const days = RANGE_DAYS[range];
    const from = days ? new Date(Date.now() - days * 86_400_000) : null;
    const cands = db.candidates.filter((c) => !from || new Date(c.createdAt) >= from);
    const rows = cands.map((c) => {
      const score = c.totalScore === null ? null : Math.round(c.totalScore <= 1 ? c.totalScore * 100 : c.totalScore);
      const result: 'passed' | 'failed' | 'not_scored' = score === null ? 'not_scored' : score >= passMark ? 'passed' : 'failed';
      return { name: c.profile?.name ?? c.displayName, email: c.profile?.email ?? '', phone: c.profile?.phone ?? '', job: '', score, result, invited: c.stage === 'invited' || c.stage === 'confirmed', uploadedAt: c.createdAt };
    });
    return {
      range, from: from ? from.toISOString() : null, passMark, applied: rows.length,
      interviewed: rows.filter((r) => r.invited).length, passed: rows.filter((r) => r.result === 'passed').length,
      failed: rows.filter((r) => r.result === 'failed').length, notScored: rows.filter((r) => r.result === 'not_scored').length, rows,
    };
  },
  async get() {
    await lat();
    const all = db.candidates;
    const reached = (i: number): number => all.filter((c) => STAGES.indexOf(c.stage) >= i || (c.stage === 'declined' && i <= 4)).length;
    const funnel = STAGES.map((stage, i) => ({ stage, count: stage === 'waitlisted' || stage === 'declined' ? all.filter((c) => c.stage === stage).length : reached(i) }));
    const scores = all.flatMap((c) => c.scores ?? []).filter((s) => !s.missing);
    const verified = scores.filter((s) => s.verified).length;
    const groups = ['Group A', 'Group B', 'Group C'].map((g) => {
      const m = all.filter((c) => c.syntheticGroup === g);
      const sel = m.filter((c) => c.stage === 'shortlisted' || c.stage === 'invited' || c.stage === 'confirmed').length;
      return { group: g, total: m.length, selected: sel, rate: m.length ? sel / m.length : 0, ratio: 0 };
    });
    const top = Math.max(...groups.map((g) => g.rate), 0.0001);
    for (const g of groups) g.ratio = Math.round((g.rate / top) * 100) / 100;
    return {
      funnel,
      timeInStage: STAGES.map((stage, i) => ({ stage, hours: 2 + i * 3 })),
      utilization: db.interviewers.map((iv) => ({
        interviewerId: iv.id, name: iv.name,
        cells: ['Day 1', 'Day 2'].map((label, d) => {
          const mine = db.slots.filter((s) => s.interviewerId === iv.id).filter((_, i) => (d === 0 ? i < 5 : i >= 5));
          return { label, value: Math.round((mine.filter((s) => s.status === 'booked').length / Math.max(1, mine.length)) * 100) };
        }),
      })),
      trustMeter: {
        verifiedQuotePercent: scores.length ? Math.round((verified / scores.length) * 100) : 0,
        openFlags: all.filter((c) => c.flags.includes('flagged')).length,
        injectionsCaught: all.filter((c) => c.flags.includes('injection_phrase_found') || c.flags.includes('hidden_text_found')).length,
      },
      biasPanel: { groups, threshold: 0.8, source: 'according to synthetic demo groups (audit only, not used in scoring)' },
    };
  },
};
