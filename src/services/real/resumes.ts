import { z } from 'zod';
import { requestMapped } from '../apiClient';
import { UploadResultSchema } from '@/types';
import type { Api } from '../contract';
import { toUploadResult } from './adapters';

export const resumes: Api['resumes'] = {
  upload: (jobId, files) => {
    const form = new FormData();
    for (const f of files) form.append('files', f);
    return requestMapped(`/jobs/${jobId}/resumes`, z.array(UploadResultSchema), (r) => (r as unknown[]).map(toUploadResult), { method: 'POST', form });
  },
};
