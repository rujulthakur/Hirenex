import { useId } from 'react';
import { copy } from '@/lib/copy';
import { Input } from './Input';

export interface DateRange {
  from: string;
  to: string;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (next: DateRange) => void;
  label?: string;
  min?: string;
  disabled?: boolean;
}

/** Usage: <DateRangePicker value={{from:'2026-11-02',to:'2026-11-06'}} onChange={set} />. Native date inputs (YYYY-MM-DD). */
export function DateRangePicker({ value, onChange, label = copy.overlays.dateRangeLabel, min, disabled }: DateRangePickerProps) {
  const id = useId();
  const invalid = value.from !== '' && value.to !== '' && value.to < value.from;
  return (
    <fieldset className="flex flex-col gap-1" disabled={disabled}>
      <legend className="mb-1 text-sm font-medium text-text">{label}</legend>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={`${id}-from`} className="flex items-center gap-2 text-sm text-muted">
          {copy.overlays.dateFrom}
          <Input id={`${id}-from`} type="date" min={min} value={value.from} invalid={invalid} onChange={(e) => onChange({ ...value, from: e.target.value })} className="w-auto" />
        </label>
        <label htmlFor={`${id}-to`} className="flex items-center gap-2 text-sm text-muted">
          {copy.overlays.dateTo}
          <Input id={`${id}-to`} type="date" min={value.from || min} value={value.to} invalid={invalid} aria-describedby={invalid ? `${id}-err` : undefined} onChange={(e) => onChange({ ...value, to: e.target.value })} className="w-auto" />
        </label>
      </div>
      {invalid ? (
        <p id={`${id}-err`} role="alert" className="text-xs text-danger">
          {copy.overlays.dateInvalid}
        </p>
      ) : null}
    </fieldset>
  );
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface TimeRangeInputProps {
  value: TimeRange;
  onChange: (next: TimeRange) => void;
  label?: string;
  disabled?: boolean;
}

/** Usage: <TimeRangeInput value={{start:'09:00',end:'17:00'}} onChange={set} />. Native time inputs (HH:mm). */
export function TimeRangeInput({ value, onChange, label = copy.overlays.timeRangeLabel, disabled }: TimeRangeInputProps) {
  const id = useId();
  const invalid = value.start !== '' && value.end !== '' && value.end <= value.start;
  return (
    <fieldset className="flex flex-col gap-1" disabled={disabled}>
      <legend className="mb-1 text-sm font-medium text-text">{label}</legend>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={`${id}-s`} className="flex items-center gap-2 text-sm text-muted">
          {copy.overlays.timeStart}
          <Input id={`${id}-s`} type="time" value={value.start} invalid={invalid} onChange={(e) => onChange({ ...value, start: e.target.value })} className="w-auto tabular-nums" />
        </label>
        <label htmlFor={`${id}-e`} className="flex items-center gap-2 text-sm text-muted">
          {copy.overlays.timeEnd}
          <Input id={`${id}-e`} type="time" value={value.end} invalid={invalid} aria-describedby={invalid ? `${id}-err` : undefined} onChange={(e) => onChange({ ...value, end: e.target.value })} className="w-auto tabular-nums" />
        </label>
      </div>
      {invalid ? (
        <p id={`${id}-err`} role="alert" className="text-xs text-danger">
          {copy.overlays.timeInvalid}
        </p>
      ) : null}
    </fieldset>
  );
}
