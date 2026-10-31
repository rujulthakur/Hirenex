import { useEffect, useState } from 'react';
import { Button, Dialog, Field, Textarea } from '@/components/ui';
import { copy } from '@/lib/copy';

interface DeclineProps {
  open: boolean;
  onClose: () => void;
  busy: boolean;
  onConfirm: (reason: string | undefined) => void;
}

/** Confirm step for declining, with an optional reason. */
export function DeclineDialog({ open, onClose, busy, onConfirm }: DeclineProps) {
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (open) setReason('');
  }, [open]);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={copy.portal.declineTitle}
      description={copy.portal.declineBody}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>{copy.portal.declineKeep}</Button>
          <Button variant="danger" loading={busy} onClick={() => onConfirm(reason.trim() === '' ? undefined : reason.trim())}>
            {copy.portal.declineConfirm}
          </Button>
        </>
      }
    >
      <Field id="decline-reason" label={copy.portal.declineReason}>
        <Textarea id="decline-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
      </Field>
    </Dialog>
  );
}

interface RescheduleProps {
  open: boolean;
  onClose: () => void;
  busy: boolean;
  onSend: (note: string) => void;
}

const MIN_NOTE = 3;

/** Reschedule request: a note is required. */
export function RescheduleDialog({ open, onClose, busy, onSend }: RescheduleProps) {
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (open) {
      setNote('');
      setTouched(false);
    }
  }, [open]);
  const tooShort = note.trim().length < MIN_NOTE;
  const submit = (): void => {
    setTouched(true);
    if (!tooShort) onSend(note.trim());
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={copy.portal.rescheduleTitle}
      description={copy.portal.rescheduleBody}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>{copy.portal.cancel}</Button>
          <Button loading={busy} onClick={submit}>{copy.portal.rescheduleSend}</Button>
        </>
      }
    >
      <Field id="reschedule-note" label={copy.portal.rescheduleNote} hint={copy.portal.rescheduleHint} error={touched && tooShort ? copy.portal.rescheduleTooShort : undefined}>
        <Textarea
          id="reschedule-note"
          rows={4}
          value={note}
          invalid={touched && tooShort}
          aria-describedby={touched && tooShort ? 'reschedule-note-error' : 'reschedule-note-hint'}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
        />
      </Field>
    </Dialog>
  );
}
