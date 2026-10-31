import type { Api } from '../contract';
import { analytics } from './analytics';
import { auth } from './auth';
import { candidates } from './candidates';
import { demo, health } from './demo';
import { invites } from './invites';
import { hiring } from './hiring';
import { jobs } from './jobs';
import { meetings } from './meetings';
import { notifications } from './notifications';
import { portal } from './portal';
import { resumes } from './resumes';
import { schedule } from './schedule';
import { scoring } from './scoring';
import { profile } from './profile';
import { shortlist } from './shortlist';

export const realApi: Api = { auth, jobs, resumes, candidates, scoring, shortlist, schedule, invites, portal, analytics, profile, notifications, demo, health, meetings, hiring };
