import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Bell, Camera, Download, Eye, Hourglass, Palette, Trash2, User as UserIcon } from 'lucide-react';
import { Select } from '@/components/ui';
import { useHiringSettings, useSaveHiringSettings } from '@/features/hiring/hooks/useHiring';
import { cn } from '@/lib/cn';
import { useAuthStore, usePrefs, useProfileStore, useUiStore } from '@/stores';
import { useProfileActions } from '../useProfile';
import type { Prefs } from '@/stores/prefsStore';

function Section({ icon, title, hint, children }: { icon: ReactNode; title: string; hint: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface-1 p-5 shadow-sm">
      <header className="mb-4 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-primary">{icon}</span>
        <div>
          <h2 className="text-md font-semibold">{title}</h2>
          <p className="text-sm text-muted">{hint}</p>
        </div>
      </header>
      <div className="flex flex-col divide-y divide-border">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-base font-medium">{label}</p>
        {hint ? <p className="text-sm text-muted">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn('relative h-7 w-12 shrink-0 rounded-full border transition-colors focus-visible:shadow-focus', on ? 'border-transparent bg-primary' : 'border-border bg-surface-2')}
    >
      <span className={cn('absolute left-0 top-[3px] h-5 w-5 rounded-full bg-white shadow transition-transform', on ? 'translate-x-[22px]' : 'translate-x-[2px]')} />
    </button>
  );
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-border bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
          className={cn('min-h-9 rounded-md px-3 text-sm font-medium transition-colors focus-visible:shadow-focus', value === o.v ? 'bg-primary text-primary-fg' : 'text-muted hover:text-text')}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

const DAY_OPTIONS = [1, 2, 3, 5, 7, 14, 30].map((d) => ({ value: String(d), label: `${d} day${d === 1 ? '' : 's'}` }));

/** Review timeline: how long a resume can sit untouched, and how long the waiting list keeps a candidate. */
function ReviewTimelineSection() {
  const s = useHiringSettings();
  const save = useSaveHiringSettings();
  return (
    <Section icon={<Hourglass size={18} />} title="Review timeline" hint="Stop resumes from waiting for weeks with no reply.">
      <Row label="Auto-reject unreviewed resumes" hint="If you don't schedule, hold or reject in time, the candidate is rejected and emailed.">
        <Toggle label="Auto-reject unreviewed resumes" on={s.autoRejectEnabled} onChange={(v) => save.mutate({ autoRejectEnabled: v })} />
      </Row>
      <Row label="Review within">
        <div className="w-full sm:w-40"><Select aria-label="Review within" options={DAY_OPTIONS} value={String(s.autoRejectDays)} disabled={!s.autoRejectEnabled} onChange={(e) => save.mutate({ autoRejectDays: Number(e.target.value) })} /></div>
      </Row>
      <Row label="Keep on the waiting list for" hint="After this, a held candidate with no meeting is rejected.">
        <div className="w-full sm:w-40"><Select aria-label="Keep on the waiting list for" options={DAY_OPTIONS} value={String(s.holdDays)} disabled={!s.autoRejectEnabled} onChange={(e) => save.mutate({ holdDays: Number(e.target.value) })} /></div>
      </Row>
      <Row label="Email candidates" hint="Waiting-list and rejection emails are sent for you.">
        <Toggle label="Email candidates" on={s.emailCandidates} onChange={(v) => save.mutate({ emailCandidates: v })} />
      </Row>
    </Section>
  );
}

const inputCls = 'min-h-10 rounded-md border border-border bg-bg px-3 text-base focus:border-primary focus:outline-none focus-visible:shadow-focus';

/** /app/settings: profile, appearance, privacy, notifications and data. Everything saves to your account. */
export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const ui = useUiStore();
  const prefs = usePrefs();
  const photo = useProfileStore((s) => s.photo);
  const { uploadPhoto, removePhoto, saveName, saving } = useProfileActions();
  const [name, setName] = useState(user?.name ?? '');
  const fileRef = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const { set: _s, reset: _r, ...p } = prefs;
    const blob = new Blob([JSON.stringify({ user, preferences: p, appearance: { theme: ui.theme, density: ui.density } }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'hirenex-settings.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const resetAll = () => {
    if (!window.confirm('Reset your preferences and remove your photo? You will stay signed in.')) return;
    prefs.reset();
    ui.setTheme('dark');
    ui.setDensity('comfortable');
    void removePhoto();
  };

  const bind = <K extends keyof Prefs>(k: K) => (v: Prefs[K]) => { prefs.set(k, v); };

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-5 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-base text-muted">Changes save automatically to your account, so they follow you to any device.</p>
      </header>

      <Section icon={<UserIcon size={18} />} title="Profile" hint="How you appear across Hirenex.">
        <Row label="Profile photo" hint="Saved to your account. Shown in the top bar.">
          <div className="flex items-center gap-3">
            {photo ? <img src={photo} alt="Your profile photo" className="h-12 w-12 rounded-full object-cover" /> : null}
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-surface-2 px-3 text-sm font-medium hover:border-primary focus-visible:shadow-focus"><Camera size={16} />{photo ? 'Change' : 'Upload'}</button>
            <button type="button" onClick={() => void removePhoto()} disabled={!photo || saving} className="min-h-10 rounded-md px-3 text-sm text-muted hover:text-text focus-visible:shadow-focus">Remove</button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { void uploadPhoto(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
        </Row>
        <Row label="Display name">
          <div className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void saveName(name.trim())} aria-label="Display name" className={inputCls} />
            <button type="button" onClick={() => void saveName(name.trim())} disabled={saving || name.trim().length < 2 || name.trim() === user?.name} className="min-h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-fg disabled:opacity-50 focus-visible:shadow-focus">Save</button>
          </div>
        </Row>
        <Row label="Email" hint="Managed by your sign-in."><span className="text-base text-muted">{user?.email}</span></Row>
        <Row label="Time zone" hint="Used for interview scheduling.">
          <input value={prefs.timeZone} onChange={(e) => prefs.set('timeZone', e.target.value)} aria-label="Time zone" className={inputCls} />
        </Row>
      </Section>

      <Section icon={<Palette size={18} />} title="Appearance" hint="Make the workspace feel right.">
        <Row label="Theme">
          <Segmented label="Theme" value={ui.theme} onChange={ui.setTheme} options={[{ v: 'dark', l: 'Dark' }, { v: 'light', l: 'Light' }]} />
        </Row>
        <Row label="Density" hint="Compact fits more on screen.">
          <Segmented label="Density" value={ui.density} onChange={ui.setDensity} options={[{ v: 'comfortable', l: 'Comfortable' }, { v: 'compact', l: 'Compact' }]} />
        </Row>
        <Row label="Collapse sidebar by default"><Toggle label="Collapse sidebar" on={ui.sidebarCollapsed} onChange={ui.setSidebarCollapsed} /></Row>
        <Row label="Reduce 3D motion" hint="Turns off tilting and floating animations.">
          <Toggle label="Reduce motion" on={prefs.reduceMotion} onChange={(v) => { prefs.set('reduceMotion', v); document.documentElement.classList.toggle('no-motion', v); }} />
        </Row>
      </Section>

      <Section icon={<Eye size={18} />} title="Fair screening" hint="Reduce bias while you review.">
        <Row label="Blind mode" hint="Hides candidate names and shows Candidate ## instead.">
          <Toggle label="Blind mode" on={ui.blindMode} onChange={() => ui.toggleBlindMode()} />
        </Row>
        <Row label="Open results when scoring finishes" hint="Jump straight to the ranked list.">
          <Toggle label="Auto open results" on={prefs.autoOpenResults} onChange={bind('autoOpenResults')} />
        </Row>
      </Section>

      <ReviewTimelineSection />

      <Section icon={<Bell size={18} />} title="Notifications" hint="Choose what reaches you.">
        <Row label="Email alerts"><Toggle label="Email alerts" on={prefs.emailAlerts} onChange={bind('emailAlerts')} /></Row>
        <Row label="Scoring complete"><Toggle label="Scoring complete" on={prefs.scoringDone} onChange={bind('scoringDone')} /></Row>
        <Row label="Weekly hiring digest"><Toggle label="Weekly digest" on={prefs.weeklyDigest} onChange={bind('weeklyDigest')} /></Row>
      </Section>

      <Section icon={<Download size={18} />} title="Your data" hint="Kept safely on your account.">
        <Row label="Export settings" hint="Download your profile and preferences as JSON.">
          <button type="button" onClick={exportData} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-surface-2 px-3 text-sm font-medium hover:border-primary focus-visible:shadow-focus"><Download size={16} />Export</button>
        </Row>
        <Row label="Reset preferences" hint="Restores defaults and removes your photo.">
          <button type="button" onClick={resetAll} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-danger px-3 text-sm font-medium text-danger hover:bg-surface-2 focus-visible:shadow-focus"><Trash2 size={16} />Reset</button>
        </Row>
      </Section>
    </section>
  );
}
