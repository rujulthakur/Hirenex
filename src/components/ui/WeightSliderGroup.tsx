import { Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { copy } from '@/lib/copy';
import { Button } from './Button';
import { Slider } from './Slider';

export interface WeightItem {
  id: string;
  name: string;
  weight: number;
  locked?: boolean;
}

const TOTAL = 100;

function distribute(total: number, weights: number[]): number[] {
  if (weights.length === 0) return [];
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = sum === 0 ? weights.map(() => total / weights.length) : weights.map((w) => (w / sum) * total);
  const floors = raw.map(Math.floor);
  let left = total - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (left <= 0) break;
    floors[i] += 1;
    left -= 1;
  }
  return floors;
}

/**
 * Pure rebalance: sets `id` to `value` (clamped by locked weights) and spreads the remainder over
 * the other UNLOCKED items proportionally. Result always sums to exactly 100 (integers).
 */
export function rebalanceWeights(items: WeightItem[], id: string, value: number): WeightItem[] {
  const target = items.find((i) => i.id === id);
  if (!target || target.locked) return items;
  const others = items.filter((i) => i.id !== id);
  const lockedSum = others.filter((i) => i.locked).reduce((a, i) => a + i.weight, 0);
  const free = others.filter((i) => !i.locked);
  const maxForTarget = TOTAL - lockedSum;
  const next = free.length === 0 ? maxForTarget : Math.min(maxForTarget, Math.max(0, Math.round(value)));
  const shares = distribute(TOTAL - lockedSum - next, free.map((i) => i.weight));
  const freeNew = new Map(free.map((i, idx) => [i.id, shares[idx]]));
  return items.map((i) => {
    if (i.id === id) return { ...i, weight: next };
    const w = freeNew.get(i.id);
    return w === undefined ? i : { ...i, weight: w };
  });
}

export interface WeightSliderGroupProps {
  items: WeightItem[];
  onChange: (next: WeightItem[]) => void;
  disabled?: boolean;
}

/** Usage: <WeightSliderGroup items={criteria} onChange={setCriteria} />. Sliders always sum to 100; lock icons freeze a criterion. */
export function WeightSliderGroup({ items, onChange, disabled = false }: WeightSliderGroupProps) {
  const sum = items.reduce((a, i) => a + i.weight, 0);
  const unlockedCount = items.filter((i) => !i.locked).length;
  return (
    <div role="group" aria-label={copy.overlays.weightGroup} className="flex flex-col gap-3">
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-base">{it.name}</span>
          <Slider
            className="flex-1"
            label={it.name}
            value={it.weight}
            disabled={disabled || it.locked === true || unlockedCount < 2}
            onValueChange={(v) => onChange(rebalanceWeights(items, it.id, v))}
          />
          <Button
            variant="icon"
            aria-pressed={it.locked === true}
            aria-label={it.locked ? copy.overlays.weightUnlock(it.name) : copy.overlays.weightLock(it.name)}
            disabled={disabled}
            onClick={() => onChange(items.map((x) => (x.id === it.id ? { ...x, locked: !x.locked } : x)))}
          >
            {it.locked ? (
              <Lock aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
            ) : (
              <Unlock aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
            )}
          </Button>
        </div>
      ))}
      <p
        role="status"
        className={cn('text-sm font-medium tabular-nums', sum === TOTAL ? 'text-success' : 'text-danger')}
      >
        {copy.overlays.weightSum(sum)}
        {sum === TOTAL ? ` · ${copy.overlays.weightOk}` : ''}
      </p>
    </div>
  );
}
