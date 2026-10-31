import { useEffect, useState } from 'react';
import { copy } from '@/lib/copy';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { Dialog } from './Dialog';

export interface ApprovalPerson {
  id: string;
  label: string;
}

export interface ApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  onApprove: () => void;
  shortlist: ApprovalPerson[];
  waitlist: ApprovalPerson[];
  loading?: boolean;
}

function PersonList({ title, people }: { title: string; people: ApprovalPerson[] }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-sm font-medium text-text">{title}</h3>
      {people.length === 0 ? (
        <p className="text-sm text-muted">{copy.overlays.approvalNone}</p>
      ) : (
        <ol className="list-decimal pl-5 text-base marker:text-muted">
          {people.map((p) => (
            <li key={p.id}>{p.label}</li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Usage: <ApprovalDialog open onClose onApprove shortlist={[...]} waitlist={[...]} />. Step 1 summary, step 2 checkbox gates the final button. */
export function ApprovalDialog({ open, onClose, onApprove, shortlist, waitlist, loading = false }: ApprovalDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setReviewed(false);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={copy.overlays.approvalTitle}
      description={`${copy.overlays.approvalStep(step, 2)} · ${copy.overlays.approvalIntro}`}
      size="md"
      footer={
        step === 1 ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              {copy.overlays.cancel}
            </Button>
            <Button onClick={() => setStep(2)} disabled={shortlist.length === 0}>
              {copy.overlays.approvalNext}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setStep(1)}>
              {copy.overlays.approvalBack}
            </Button>
            <Button onClick={onApprove} disabled={!reviewed} loading={loading}>
              {copy.overlays.approvalConfirm}
            </Button>
          </>
        )
      }
    >
      {step === 1 ? (
        <div className="flex flex-col gap-4">
          <PersonList title={copy.overlays.approvalShortlist(shortlist.length)} people={shortlist} />
          <PersonList title={copy.overlays.approvalWaitlist(waitlist.length)} people={waitlist} />
        </div>
      ) : (
        <Checkbox label={copy.overlays.approvalReviewed} checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} />
      )}
    </Dialog>
  );
}
