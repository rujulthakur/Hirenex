import type { Api } from '../contract';
import type { Role, User } from '@/types';
import { appendAudit, db, saveSession } from './db';
import { fail, lat } from './util';

const HOUR = 3_600_000;
function userFor(email: string, role: Role = 'hr_admin', name = 'HR Admin'): User {
  return { id: `usr_${email}`, email, name, role };
}

export const auth: Api['auth'] = {
  async sendOtp(email) {
    await lat();
    const now = Date.now();
    const sends = (db.otpSends[email] ?? []).filter((t) => now - t < HOUR);
    if (sends.length >= 5) fail('RATE_LIMITED', 'Too many codes requested. Try again in an hour.', 429);
    sends.push(now);
    db.otpSends[email] = sends;
    db.otpAttempts[email] = 0;
  },
  async verifyOtp(email, code) {
    await lat();
    const used = (db.otpAttempts[email] ?? 0) + 1;
    db.otpAttempts[email] = used;
    if (used > 5) fail('RATE_LIMITED', 'Too many attempts. Request a new code.', 429);
    if (code === '000000') fail('TOKEN_EXPIRED', 'This code has expired. Request a new one.', 410);
    if (code !== '123456') fail('VALIDATION_FAILED', `Incorrect code. ${5 - used} attempts left.`, 400);
    const u = userFor(email);
    saveSession(u);
    await appendAudit(`${u.role}:${email}`, 'auth.login', null, { method: 'otp' });
    return u;
  },
  async google() {
    await lat();
    const u = userFor('google.user@example.test', 'hr_admin', 'Google User');
    saveSession(u);
    await appendAudit(`${u.role}:${u.email}`, 'auth.login', null, { method: 'google' });
    return u;
  },
  async demoLogin() {
    await lat();
    const u = userFor('judge@demo.test', 'demo_hr', 'Judge (demo)');
    saveSession(u);
    await appendAudit(`${u.role}:${u.email}`, 'auth.demo_login', null, { sandbox: true });
    return u;
  },
  async refresh() {
    await lat();
  },
  async logout() {
    await lat();
    saveSession(null);
  },
  async me() {
    await lat();
    if (!db.user) fail('UNAUTHENTICATED', 'Please sign in.', 401);
    return db.user;
  },
};
