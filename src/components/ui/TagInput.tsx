import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { copy } from '@/lib/copy';
import { Badge } from './Badge';

export interface SkillTag {
  name: string;
  required: boolean;
}

export interface TagInputProps {
  value: SkillTag[];
  onChange: (next: SkillTag[]) => void;
  label?: string;
  disabled?: boolean;
}

/** Usage: <TagInput value={skills} onChange={setSkills} />. Enter or comma adds (as required); press a chip to flip required/preferred. */
export function TagInput({ value, onChange, label = copy.overlays.skillsLabel, disabled = false }: TagInputProps) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | undefined>();
  const id = useId();

  const add = () => {
    const name = draft.trim();
    if (name === '') return;
    if (value.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      setError(copy.overlays.tagDuplicate);
      return;
    }
    setError(undefined);
    onChange([...value, { name, required: true }]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add();
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const toggle = (name: string) => onChange(value.map((t) => (t.name === name ? { ...t, required: !t.required } : t)));
  const remove = (name: string) => onChange(value.filter((t) => t.name !== name));

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
      </label>
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 rounded-md border bg-surface-1 p-2 focus-within:border-primary focus-within:shadow-focus',
          error ? 'border-danger' : 'border-border',
        )}
      >
        {value.map((t) => {
          const kind = t.required ? copy.overlays.tagRequired : copy.overlays.tagPreferred;
          return (
            <span key={t.name} className="inline-flex items-center gap-1">
              <button
                type="button"
                disabled={disabled}
                aria-label={copy.overlays.tagToggle(t.name, kind)}
                onClick={() => toggle(t.name)}
                className="min-h-8 rounded-full focus-visible:shadow-focus focus-visible:outline-none"
              >
                <Badge tone={t.required ? 'primary' : 'neutral'} outline={t.required ? 'solid' : 'dashed'}>
                  {t.name} · {kind}
                </Badge>
              </button>
              <button
                type="button"
                disabled={disabled}
                aria-label={copy.overlays.tagRemove(t.name)}
                onClick={() => remove(t.name)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-text focus-visible:shadow-focus focus-visible:outline-none"
              >
                <X aria-hidden="true" strokeWidth={1.5} className="h-3 w-3" />
              </button>
            </span>
          );
        })}
        <input
          id={id}
          value={draft}
          disabled={disabled}
          placeholder={copy.overlays.tagPlaceholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(undefined);
          }}
          onKeyDown={onKeyDown}
          className="h-8 min-w-40 flex-1 bg-transparent text-base text-text placeholder:text-muted focus-visible:outline-none"
        />
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
