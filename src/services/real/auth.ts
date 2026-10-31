import { request, requestVoid } from '../apiClient';
import { UserSchema } from '@/types';
import type { Api } from '../contract';

export const auth: Api['auth'] = {
  sendOtp: (email) => requestVoid('/auth/send-otp', { method: 'POST', body: { email }, skipAuthRedirect: true }),
  verifyOtp: (email, code) => request('/auth/verify-otp', UserSchema, { method: 'POST', body: { email, code }, skipAuthRedirect: true }),
  google: (idToken) => request('/auth/google', UserSchema, { method: 'POST', body: { idToken }, skipAuthRedirect: true }),
  demoLogin: () => request('/auth/demo-login', UserSchema, { method: 'POST', skipAuthRedirect: true }),
  refresh: () => requestVoid('/auth/refresh', { method: 'POST', skipAuthRedirect: true }),
  logout: () => requestVoid('/auth/logout', { method: 'POST', skipAuthRedirect: true }),
  me: () => request('/auth/me', UserSchema, { skipAuthRedirect: true }),
};
