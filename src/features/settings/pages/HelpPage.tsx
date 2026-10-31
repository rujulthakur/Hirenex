import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Check, ChevronDown, Clock, Copy, Keyboard, Mail, Phone, Search, Send } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores';
import { CONTACT } from '../contact';

const FAQ = [
  { q: 'How do I screen resumes?', a: 'Go to Screen resumes, paste resumes (separate each with a line of ---) or drop PDF/DOCX files, then press Screen. You land on the ranked results automatically.' },
  { q: 'How do I see why a candidate got a score?', a: 'Open Results and click a candidate. The card expands to show the evidence quote behind every criterion, and whether it was verified.' },
  { q: 'What is blind mode?', a: 'Blind mode replaces candidate names with Candidate ## so you judge on evidence only. Turn it on in Settings → Fair screening.' },
  { q: 'What do the flags on a resume mean?', a: 'Flags mark hidden text or instruction-like phrases found in a resume. Flagged resumes are scored only on the visible text.' },
  { q: 'Where did the other pages go?', a: 'Dashboard, Jobs, Analytics, Shortlist, Schedule and Invitations are inside the More menu in the sidebar.' },
  { q: 'Can I change the criteria I am scoring against?', a: 'Yes. Open More → Jobs, pick the role and edit its skills and criteria. Re-run screening to apply them.' },
  { q: 'Is my data private?', a: 'Preferences and your photo stay in your browser. Resumes are used only for scoring and for contacting candidates you choose to invite.' },
];

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => { void navigator.clipboard?.writeText(text); setDone(true); window.setTimeout(() => setDone(false), 1500); }}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-text focus-visible:shadow-focus"
    >
      {done ? <Check size={16} className="text-success" /> : <Copy size={16} />}
    </button>
  );
}

/** /app/help: contact details, searchable FAQ, a message form that opens the mail app, and shortcuts. */
export default function HelpPage() {
  const setShortcuts = useUiStore((s) => s.setShortcutsOpen);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<number | null>(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const faqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? FAQ.filter((f) => `${f.q} ${f.a}`.toLowerCase().includes(q)) : FAQ;
  }, [query]);

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject || 'Hirenex support')}&body=${encodeURIComponent(message)}`;
  };

  const card = 'flex items-center gap-3 rounded-2xl border border-border bg-surface-1 p-4 shadow-sm';
  const inputCls = 'w-full rounded-md border border-border bg-bg px-3 py-2 text-base focus:border-primary focus:outline-none focus-visible:shadow-focus';

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-6 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold">Help &amp; support</h1>
        <p className="text-base text-muted">Find answers fast, or talk to a person.</p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <div className={card}>
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 text-primary"><Mail size={18} /></span>
          <a href={`mailto:${CONTACT.email}`} className="min-w-0 flex-1"><p className="text-sm text-muted">Email</p><p className="truncate font-medium hover:underline">{CONTACT.email}</p></a>
          <CopyBtn text={CONTACT.email} label="Copy email" />
        </div>
        <div className={card}>
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 text-primary"><Phone size={18} /></span>
          <a href={`tel:${CONTACT.phoneHref}`} className="min-w-0 flex-1"><p className="text-sm text-muted">Phone</p><p className="truncate font-medium hover:underline">{CONTACT.phone}</p></a>
          <CopyBtn text={CONTACT.phone} label="Copy phone number" />
        </div>
        <div className={card}>
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 text-primary"><Clock size={18} /></span>
          <div><p className="text-sm text-muted">Support hours</p><p className="font-medium">{CONTACT.hours}</p></div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="flex flex-col gap-3 lg:col-span-3">
          <h2 className="text-md font-semibold">Frequently asked questions</h2>
          <label className="relative block">
            <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search help…" aria-label="Search help" className={cn(inputCls, 'pl-9')} />
          </label>
          {faqs.length === 0 ? <p className="rounded-xl border border-border bg-surface-1 p-4 text-sm text-muted">No answers match. Send us a message and we will help.</p> : null}
          <ul className="flex flex-col gap-2">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <li key={f.q} className="overflow-hidden rounded-xl border border-border bg-surface-1">
                  <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)} className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left font-medium focus-visible:shadow-focus">
                    {f.q}
                    <ChevronDown size={16} aria-hidden="true" className={cn('shrink-0 text-muted transition-transform', isOpen && 'rotate-180')} />
                  </button>
                  {isOpen ? <p className="px-4 pb-4 text-sm leading-relaxed text-muted">{f.a}</p> : null}
                </li>
              );
            })}
          </ul>
          <button type="button" onClick={() => setShortcuts(true)} className="inline-flex min-h-10 items-center gap-2 self-start rounded-md border border-border bg-surface-2 px-3 text-sm font-medium hover:border-primary focus-visible:shadow-focus">
            <Keyboard size={16} /> View keyboard shortcuts
          </button>
        </section>

        <form onSubmit={send} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-1 p-5 shadow-sm lg:col-span-2">
          <h2 className="text-md font-semibold">Message support</h2>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" aria-label="Subject" className={inputCls} />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="How can we help?" aria-label="Message" className={inputCls} />
          <button type="submit" disabled={!message.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 font-medium text-primary-fg disabled:opacity-50 focus-visible:shadow-focus">
            <Send size={16} /> Send message
          </button>
          <p className="text-xs text-muted">Opens your email app addressed to {CONTACT.email}.</p>
        </form>
      </div>
    </section>
  );
}
