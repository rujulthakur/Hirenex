import type { Api } from '../contract';
import type { HiringSettings } from '@/types';
import { clone, lat } from './util';

export let hiringSettings: HiringSettings = { autoRejectEnabled: true, autoRejectDays: 3, holdDays: 7, emailCandidates: true };

export const hiringApi: Api['hiring'] = {
  async settings() { await lat(); return clone(hiringSettings); },
  async save(patch) { await lat(); hiringSettings = { ...hiringSettings, ...patch }; return clone(hiringSettings); },
};
