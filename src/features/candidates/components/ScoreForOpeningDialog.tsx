import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button, Dialog, InlineAlert } from '@/components/ui';
import { OpeningSelect } from '@/features/jobs/components/OpeningSelect';
import { api } from '@/services';
import { qk } from '@/services/queryKeys';

interface Props {
  open: boolean;
  onClose: () => void;
  fromJobId: string;
  candidateIds: string[];
  onDone: () => void;
}

/** Scores the ticked resumes against another opening: they are added to it and its scoring run starts. */
export function ScoreForOpeningDialog({ open, onClose, fromJobId, candidateIds, onDone }: Props) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [target, setTarget] = useState('');
  const [error, setError] = useState<string | null>(null);

  const run = useMutation<string, Error, string>({
    mutationFn: async (targetId) => {
      await api.candidates.copyToJob(targetId, fromJobId, candidateIds);
      await api.scoring.start(targetId);
      return targetId;
    },
    onSuccess: async (targetId) => {
      await client.invalidateQueries({ queryKey: qk.jobs.all });
      await client.invalidateQueries({ queryKey: qk.candidates.all(targetId) });
      onDone();
      close();
      navigate(`/app/jobs/${targetId}/candidates`);
    },
    onError: (e) => setError(e.message || 'Could not start scoring for that opening.'),
  });

  const close = (): void => {
    setError(null);
    onClose();
  };
  const n = candidateIds.length;

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Score for another opening"
      description={`${n} resume${n === 1 ? '' : 's'} will be added to the opening you pick and scored against its skills and criteria. Scores here stay as they are.`}
      footer={
        <>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button loading={run.isPending} disabled={target === '' || n === 0} onClick={() => { setError(null); run.mutate(target); }}>
            Score for this opening
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label htmlFor="score-target" className="text-sm font-medium">Opening</label>
        <OpeningSelect id="score-target" value={target} onChange={setTarget} exclude={[fromJobId]} />
        {error !== null ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
      </div>
    </Dialog>
  );
}
