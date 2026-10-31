import { useEffect, useId, useState } from 'react';
import { Columns3, Rows3, Search, Table2, X } from 'lucide-react';
import { Button, Input, Select, Switch } from '@/components/ui';
import { cn } from '@/lib/cn';
import { copy } from '@/lib/copy';
import { useUiStore } from '@/stores';
import { CandidateStage, FlagKind } from '@/types';
import { hasActiveFilters } from '../candidatesModel';
import type { CandidateParams, CandidateView } from '../candidatesModel';
import type { UpdateOptions } from '../hooks/useCandidateParams';

const SEARCH_DEBOUNCE_MS = 300;

interface CandidateFiltersProps {
  params: CandidateParams;
  onChange: (patch: Partial<CandidateParams>, options?: UpdateOptions) => void;
  onClear: () => void;
}

const stageOptions = [
  { value: '', label: copy.candidates.allStages },
  ...CandidateStage.options.map((s) => ({ value: s, label: copy.domain.stage[s] })),
];
const flagOptions = [
  { value: '', label: copy.candidates.allFlags },
  ...FlagKind.options.map((f) => ({ value: f, label: copy.domain.flag[f] })),
];
const sortOptions = (Object.keys(copy.candidates.sortOptions) as Array<keyof typeof copy.candidates.sortOptions>).map((value) => ({
  value,
  label: copy.candidates.sortOptions[value],
}));

const segment =
  'inline-flex min-h-11 items-center gap-2 px-3 text-sm transition-colors duration-fast ease-standard focus-visible:shadow-focus';

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string; icon: typeof Table2 }>;
  onChange: (v: T) => void;
}

function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex overflow-hidden rounded-md border border-border">
      {options.map((o) => {
        const Icon = o.icon;
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(segment, on ? 'bg-surface-2 text-text' : 'bg-surface-1 text-muted hover:text-text')}
          >
            <Icon aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const viewOptions: ReadonlyArray<{ value: CandidateView; label: string; icon: typeof Table2 }> = [
  { value: 'table', label: copy.candidates.viewTable, icon: Table2 },
  { value: 'kanban', label: copy.candidates.viewKanban, icon: Columns3 },
];

const densityOptions = [
  { value: 'comfortable', label: copy.candidates.comfortable, icon: Rows3 },
  { value: 'compact', label: copy.candidates.compact, icon: Rows3 },
] as const;

/**
 * Usage: <CandidateFilters params={params} onChange={update} onClear={clearFilters} />.
 * Search is debounced into the URL; stage, flag, sort and view update it immediately. Blind mode and density are
 * UI preferences kept in uiStore.
 */
export function CandidateFilters({ params, onChange, onClear }: CandidateFiltersProps) {
  const searchId = useId();
  const stageId = useId();
  const flagId = useId();
  const sortId = useId();
  const blind = useUiStore((s) => s.blindMode);
  const toggleBlind = useUiStore((s) => s.toggleBlindMode);
  const density = useUiStore((s) => s.density);
  const setDensity = useUiStore((s) => s.setDensity);

  const [text, setText] = useState(params.q);

  // Typing updates the URL after a short pause (replacing the history entry so Back is not flooded).
  useEffect(() => {
    if (text === params.q) return undefined;
    const t = window.setTimeout(() => onChange({ q: text }, { replace: true }), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [text, params.q, onChange]);

  // Clearing filters or following a shared link changes the URL from outside; mirror it into the box.
  useEffect(() => {
    setText(params.q);
  }, [params.q]);

  const table = params.view === 'table';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <label htmlFor={searchId} className="text-sm text-muted">
            {copy.candidates.search}
          </label>
          <div className="relative">
            <Search aria-hidden="true" strokeWidth={1.5} className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" />
            <Input
              id={searchId}
              type="search"
              value={text}
              placeholder={copy.candidates.searchPlaceholder}
              className="pl-9"
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        </div>

        {table ? (
          <div className="flex flex-col gap-1">
            <label htmlFor={stageId} className="text-sm text-muted">
              {copy.candidates.stageFilter}
            </label>
            <Select
              id={stageId}
              options={stageOptions}
              value={params.stage ?? ''}
              onChange={(e) => {
                const parsed = CandidateStage.safeParse(e.target.value);
                onChange({ stage: parsed.success ? parsed.data : undefined });
              }}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-1">
          <label htmlFor={flagId} className="text-sm text-muted">
            {copy.candidates.flagFilter}
          </label>
          <Select
            id={flagId}
            options={flagOptions}
            value={params.flag ?? ''}
            onChange={(e) => {
              const parsed = FlagKind.safeParse(e.target.value);
              onChange({ flag: parsed.success ? parsed.data : undefined });
            }}
          />
        </div>

        {table ? (
          <div className="flex flex-col gap-1">
            <label htmlFor={sortId} className="text-sm text-muted">
              {copy.candidates.sortLabel}
            </label>
            <Select
              id={sortId}
              options={sortOptions}
              value={sortOptions.some((o) => o.value === params.sort) ? params.sort : ''}
              onChange={(e) => onChange({ sort: e.target.value })}
            />
          </div>
        ) : null}

        {hasActiveFilters(params) ? (
          <Button variant="ghost" onClick={onClear}>
            <X aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
            {copy.candidates.clearFilters}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Segmented label={copy.candidates.viewLabel} value={params.view} options={viewOptions} onChange={(view) => onChange({ view })} />
        {table ? (
          <Segmented label={copy.candidates.densityLabel} value={density} options={densityOptions} onChange={setDensity} />
        ) : null}
        <div className="flex items-center gap-3">
          <Switch label={copy.candidates.blindToggle} checked={blind} onCheckedChange={toggleBlind} />
          <span className="text-sm">
            {copy.candidates.blindToggle}
            <span className="ml-2 text-muted">{copy.candidates.blindHint}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
