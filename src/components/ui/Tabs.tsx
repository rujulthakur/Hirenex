import { useId, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { spring } from '@/lib/motion';

export interface TabItem {
  id: string;
  label: string;
  panel: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (id: string) => void;
  label: string;
}

/**
 * Usage: <Tabs label="Candidate" items={[...]} value={tab} onValueChange={setTab} />
 * Arrow keys / Home / End move between tabs; indicator animates via layoutId.
 */
export function Tabs({ items, value, onValueChange, label }: TabsProps) {
  const uid = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabled = items.map((t, i) => ({ t, i })).filter(({ t }) => !t.disabled);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const current = enabled.findIndex(({ t }) => t.id === value);
    let next = current;
    if (e.key === 'ArrowRight') next = (current + 1) % enabled.length;
    else if (e.key === 'ArrowLeft') next = (current - 1 + enabled.length) % enabled.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = enabled.length - 1;
    else return;
    e.preventDefault();
    const target = enabled[next];
    if (target) {
      onValueChange(target.t.id);
      refs.current[target.i]?.focus();
    }
  };

  const active = items.find((t) => t.id === value);

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="flex gap-1 overflow-x-auto border-b border-border"
      >
        {items.map((t, i) => {
          const selected = t.id === value;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              type="button"
              id={`${uid}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${uid}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={t.disabled}
              onClick={() => onValueChange(t.id)}
              className={cn(
                'relative min-h-11 whitespace-nowrap px-4 text-base font-medium transition-colors duration-fast focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50',
                selected ? 'text-text' : 'text-muted hover:text-text',
              )}
            >
              {t.label}
              {selected ? (
                <motion.span
                  layoutId={`${uid}-indicator`}
                  transition={spring.snappy}
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-primary"
                />
              ) : null}
            </button>
          );
        })}
      </div>
      {active ? (
        <div
          role="tabpanel"
          id={`${uid}-panel-${active.id}`}
          aria-labelledby={`${uid}-tab-${active.id}`}
          tabIndex={0}
          className="pt-4 focus-visible:shadow-focus"
        >
          {active.panel}
        </div>
      ) : null}
    </div>
  );
}
