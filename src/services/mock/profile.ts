import type { Api } from '../contract';
import type { Profile } from '@/types';
import { clone, lat } from './util';

let stored: Profile = { name: '', avatar: null, preferences: {} };

export const profile: Api['profile'] = {
  async get() { await lat(); return clone(stored); },
  async save(patch) {
    await lat();
    stored = {
      name: patch.name ?? stored.name,
      avatar: patch.avatar === undefined ? stored.avatar : patch.avatar,
      preferences: { ...stored.preferences, ...(patch.preferences ?? {}) },
    };
    return clone(stored);
  },
};
