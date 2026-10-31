import { z } from 'zod';
import { requestMapped, requestVoid } from '../apiClient';
import { MeetingCapacitySchema, MeetingSchema, MeetingSettingsSchema, SendMeetingsResultSchema } from '@/types';
import type { Api } from '../contract';

const same = (r: unknown): unknown => r;

export const meetings: Api['meetings'] = {
  settings: () => requestMapped('/settings/meetings', MeetingSettingsSchema, same),
  saveSettings: (patch) => requestMapped('/settings/meetings', MeetingSettingsSchema, same, { method: 'PUT', body: patch }),
  capacity: () => requestMapped('/meetings/capacity', MeetingCapacitySchema, same),
  list: (jobId) => requestMapped(`/jobs/${jobId}/meetings`, z.array(MeetingSchema), same),
  send: (jobId, candidateIds) => requestMapped(`/jobs/${jobId}/meetings`, SendMeetingsResultSchema, same, { method: 'POST', body: { candidateIds } }),
  cancel: (id) => requestVoid(`/meetings/${id}`, { method: 'DELETE' }),
};
