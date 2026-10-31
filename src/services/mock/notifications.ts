import type { Api } from '../contract';
import { db } from './db';
import { clone, lat } from './util';

export const notifications: Api['notifications'] = {
  async list() {
    await lat();
    return clone(db.notifications);
  },
  async markRead(ids) {
    await lat();
    for (const n of db.notifications) if (!ids || ids.includes(n.id)) n.read = true;
  },
};
