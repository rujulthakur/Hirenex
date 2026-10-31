import { Select } from '@/components/ui';
import { useJobsList } from '../hooks/useJobs';

interface OpeningSelectProps {
  value: string;
  onChange: (jobId: string) => void;
  id?: string;
  disabled?: boolean;
  /** Opening ids to leave out (for example the one resumes are being copied from). */
  exclude?: string[];
  label?: string;
}

/** Picks one of HR's openings. Each opening has its own skills and scoring criteria, so scores are per opening. */
export function OpeningSelect({ value, onChange, id, disabled, exclude = [], label = 'Opening' }: OpeningSelectProps) {
  const { data, isLoading } = useJobsList();
  const jobs = (data?.items ?? []).filter((j) => !exclude.includes(j.id));
  const options = jobs.map((j) => ({ value: j.id, label: `${j.title} (${j.candidateCount ?? 0})` }));
  if (options.length === 0) options.push({ value: '', label: isLoading ? 'Loading openings…' : 'No openings yet' });
  else if (value !== '' && !options.some((o) => o.value === value) && exclude.length === 0) options.unshift({ value, label: 'Current opening' });
  return <Select id={id} aria-label={label} options={options} value={value} disabled={disabled || isLoading} onChange={(e) => onChange(e.target.value)} />;
}
