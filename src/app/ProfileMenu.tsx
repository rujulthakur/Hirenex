import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronDown, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore, useProfileStore } from '@/stores';
import { useProfileActions } from '@/features/settings/useProfile';

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  return `${p[0]?.[0] ?? '?'}${p.length > 1 ? p[p.length - 1][0] : ''}`.toUpperCase();
}

function Photo({ name, src, size }: { name: string; src: string | null; size: number }) {
  return src ? (
    <img src={src} alt={name} style={{ width: size, height: size }} className="shrink-0 rounded-full object-cover" />
  ) : (
    <span
      role="img"
      aria-label={name}
      style={{ width: size, height: size, fontSize: size / 2.6 }}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-fg"
    >
      {initials(name)}
    </span>
  );
}

/** Rightmost top bar item: name + avatar. Opens on hover or click; shows photo, Settings and a red Sign out. */
export function ProfileMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const photo = useProfileStore((s) => s.photo);
  const { uploadPhoto } = useProfileActions();
  const wrap = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  if (!user) return null;

  const hoverOpen = () => { if (closeTimer.current) window.clearTimeout(closeTimer.current); setOpen(true); };
  const hoverClose = () => { closeTimer.current = window.setTimeout(() => setOpen(false), 160); };

  const item = 'flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-base transition-colors hover:bg-surface-1 focus-visible:bg-surface-1 focus-visible:outline-none';

  return (
    <div ref={wrap} className="relative ml-auto" onMouseEnter={hoverOpen} onMouseLeave={hoverClose}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface-2 py-1 pl-1 pr-3 transition-colors hover:border-primary focus-visible:shadow-focus"
      >
        <Photo name={user.name} src={photo} size={32} />
        <span className="hidden max-w-36 truncate text-sm font-medium sm:inline">{user.name}</span>
        <ChevronDown size={14} aria-hidden="true" className={cn('text-muted transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div role="menu" aria-label="Profile menu" className="pop3d absolute right-0 top-full z-40 w-72 pt-2">
          <div className="overflow-hidden rounded-xl border border-border bg-surface-2 shadow-lg">
            <div className="flex flex-col items-center gap-2 bg-surface-1 px-4 py-5 text-center">
              <div className="relative">
                <Photo name={user.name} src={photo} size={72} />
                <button
                  type="button"
                  onClick={() => file.current?.click()}
                  aria-label="Change profile photo"
                  className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface-2 text-muted hover:text-text focus-visible:shadow-focus"
                >
                  <Camera size={14} aria-hidden="true" />
                </button>
                <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { void uploadPhoto(e.target.files?.[0]); e.target.value = ''; }} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{user.name}</p>
                <p className="truncate text-sm text-muted">{user.email}</p>
              </div>
            </div>
            <div className="p-1">
              <button type="button" role="menuitem" className={item} onClick={() => { setOpen(false); navigate('/app/settings'); }}>
                <Settings size={18} strokeWidth={1.5} aria-hidden="true" /> Settings
              </button>
              <button
                type="button"
                role="menuitem"
                className={cn(item, 'font-medium text-danger')}
                onClick={() => { setOpen(false); void logout().then(() => navigate('/login')); }}
              >
                <LogOut size={18} strokeWidth={1.5} aria-hidden="true" /> Sign out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
