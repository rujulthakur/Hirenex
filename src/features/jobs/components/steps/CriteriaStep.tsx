import { Plus, Trash2 } from 'lucide-react';
import { Button, Field, InlineAlert, Input, WeightSliderGroup, rebalanceWeights } from '@/components/ui';
import type { WeightItem } from '@/components/ui';
import { copy } from '@/lib/copy';
import { newLocalId } from '../../schemas';
import type { WizardCriterion } from '../../schemas';
import { fieldError } from './types';
import type { StepProps } from './types';

/** Step 3: scoring criteria with weights that always add up to 100. */
export function CriteriaStep(props: StepProps) {
  const { form } = props;
  const criteria = form.watch('criteria');
  const sum = criteria.reduce((a, c) => a + (Number.isFinite(c.weight) ? c.weight : 0), 0);
  const groupError = fieldError(props, 'criteria');

  const commit = (next: WizardCriterion[]) => form.setValue('criteria', next, { shouldDirty: true });

  const rename = (id: string, name: string) => commit(criteria.map((c) => (c.id === id ? { ...c, name } : c)));

  const add = () => {
    const created: WizardCriterion = { id: newLocalId('crit'), name: '', weight: 0 };
    const items: WeightItem[] = [...criteria, created];
    const share = Math.floor(100 / items.length);
    commit(rebalanceWeights(items, created.id, share));
  };

  const remove = (id: string) => {
    const gone = criteria.find((c) => c.id === id);
    const rest = criteria.filter((c) => c.id !== id);
    if (!gone) return;
    const receiver = rest.find((c) => !c.locked);
    commit(receiver ? rebalanceWeights(rest, receiver.id, receiver.weight + gone.weight) : rest);
  };

  /** Slider group shows a fallback label for blank names; the stored names are never overwritten by it. */
  const display: WeightItem[] = criteria.map((c, i) => ({ ...c, name: c.name.trim() || copy.jobs.fields.criterionName(i + 1) }));
  const onWeights = (next: WeightItem[]) =>
    commit(next.map((n) => ({ id: n.id, weight: n.weight, locked: n.locked, name: criteria.find((c) => c.id === n.id)?.name ?? n.name })));

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <p className="text-base text-muted">{copy.jobs.fields.criteriaIntro}</p>

      <ul className="flex flex-col gap-3">
        {criteria.map((c, i) => {
          const nameError = fieldError(props, `criteria.${i}.name`);
          const id = `criterion-${c.id}`;
          return (
            <li key={c.id} className="flex items-start gap-2">
              <Field id={id} label={copy.jobs.fields.criterionName(i + 1)} error={nameError} className="flex-1">
                <Input
                  id={id}
                  value={c.name}
                  placeholder={copy.jobs.fields.criterionPlaceholder}
                  invalid={!!nameError}
                  aria-describedby={nameError ? `${id}-error` : undefined}
                  onChange={(e) => rename(c.id, e.target.value)}
                />
              </Field>
              <Button
                variant="icon"
                aria-label={copy.jobs.fields.removeCriterion(c.name || copy.jobs.fields.criterionName(i + 1))}
                onClick={() => remove(c.id)}
                className="mt-6"
              >
                <Trash2 aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
              </Button>
            </li>
          );
        })}
      </ul>

      <div>
        <Button variant="outline" onClick={add}>
          <Plus aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
          {copy.jobs.fields.addCriterion}
        </Button>
      </div>

      <WeightSliderGroup items={display} onChange={onWeights} />
      <p className="text-sm tabular-nums text-muted" aria-live="polite">
        {copy.jobs.fields.criteriaSum(sum)}
      </p>

      {groupError ? <InlineAlert tone="danger">{groupError}</InlineAlert> : null}
    </div>
  );
}
