import { useEffect, useState } from 'react';
import { Button, Input, Select } from '@/components/ui';
import type { MeetingSettings } from '@/types';
import { useMeetingSettings, useSaveMeetingSettings } from '../hooks/useMeetings';

const DURATIONS = [15, 20, 30, 45, 60].map((m) => ({ value: String(m), label: `${m} minutes` }));

/** HR interview settings: the daily window, how long each interview is, and the one reusable Google Meet link. */
export function MeetingSettingsForm({ onSaved, compact = false }: { onSaved?: (s: MeetingSettings) => void; compact?: boolean }) {
  const q = useMeetingSettings();
  const save = useSaveMeetingSettings();
  const [form, setForm] = useState<MeetingSettings | null>(null);

  useEffect(() => {
    if (q.data && form === null) setForm(q.data);
  }, [q.data, form]);

  if (!form) return <p className="text-sm text-muted">Loading…</p>;
  const set = <K extends keyof MeetingSettings>(k: K, v: MeetingSettings[K]) => setForm({ ...form, [k]: v });
  const badWindow = form.windowEnd <= form.windowStart;
  const badLink = form.meetLink !== '' && !/^https:\/\/.+/i.test(form.meetLink);
  const per = form.slotMinutes > 0 && !badWindow ? Math.floor(((Number(form.windowEnd.slice(0, 2)) * 60 + Number(form.windowEnd.slice(3))) - (Number(form.windowStart.slice(0, 2)) * 60 + Number(form.windowStart.slice(3)))) / form.slotMinutes) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className={compact ? 'grid gap-3 sm:grid-cols-2' : 'grid gap-4 sm:grid-cols-3'}>
        <label className="flex flex-col gap-1 text-sm font-medium">Interviews start
          <Input type="time" value={form.windowStart} onChange={(e) => set('windowStart', e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">Interviews end
          <Input type="time" value={form.windowEnd} onChange={(e) => set('windowEnd', e.target.value)} invalid={badWindow} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">Length of each interview
          <Select options={DURATIONS} value={String(form.slotMinutes)} onChange={(e) => set('slotMinutes', Number(e.target.value))} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium">Google Meet link
        <Input type="url" placeholder="https://meet.google.com/abc-defg-hij" value={form.meetLink} onChange={(e) => set('meetLink', e.target.value.trim())} invalid={badLink} />
        <span className="text-xs font-normal text-muted">Saved once and used in every invite until you change it.</span>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">Company name (shown in the email)
        <Input value={form.companyName} maxLength={120} onChange={(e) => set('companyName', e.target.value)} />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{badWindow ? 'The end time must be after the start time.' : `Fits up to ${per} interview${per === 1 ? '' : 's'} a day.`}</p>
        <Button disabled={badWindow || badLink || save.isPending} onClick={() => save.mutate(form, { onSuccess: (s) => onSaved?.(s) })}>
          {save.isPending ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </div>
  );
}
