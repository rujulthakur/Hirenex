import { useState } from 'react';
import { CalendarPlus, Hourglass, Undo2, UserX } from 'lucide-react';
import { Button, ConfirmDialog } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Candidate } from '@/types';
import { useSendMeetings } from '@/features/meetings/hooks/useMeetings';
import { useCandidateName } from '@/features/candidates/hooks/useCandidateName';
import { useDecideCandidate, useHiringSettings } from '../hooks/useHiring';

const CAN_DECIDE = ['applied', 'scored', 'shortlisted', 'waitlisted', 'on_hold'];
const CAN_SCHEDULE = ['shortlisted', 'waitlisted', 'on_hold'];

/**
 * HR decision buttons: Schedule meeting, Hold (waiting list), Reject, and Move back to review.
 * variant "inline" sits in the page header on tablets and up; "sticky" is a thumb-reach bar pinned to the bottom of the
 * screen on phones (position: sticky, so it keeps working inside animated page wrappers). Render both; each hides itself.
 */
export function DecisionBar({ candidate, jobId, variant }: { candidate: Candidate; jobId: string; variant: 'inline' | 'sticky' }) {
  const decide = useDecideCandidate(jobId);
  const send = useSendMeetings(jobId);
  const s = useHiringSettings();
  const nameOf = useCandidateName();
  const [confirm, setConfirm] = useState<'hold' | 'reject' | null>(null);
  const name = nameOf(candidate);
  const stage = candidate.stage;
  const canDecide = CAN_DECIDE.includes(stage);
  const canReopen = stage === 'on_hold' || stage === 'rejected';
  if (!canDecide && !canReopen) return null;

  const wrap = variant === 'inline'
    ? 'hidden flex-wrap items-center gap-2 md:flex'
    : 'sticky bottom-0 z-20 -mx-4 grid grid-cols-3 gap-2 border-t border-border bg-surface-1/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden';
  const btn = variant === 'sticky' ? 'min-h-12 w-full flex-col gap-0.5 px-1 text-xs sm:text-sm' : '';

  return (
    <>
      <div className={cn(wrap, canReopen && !canDecide && variant === 'sticky' && 'grid-cols-1')} role="group" aria-label="Decide on this candidate">
        {CAN_SCHEDULE.includes(stage) ? (
          <Button className={btn} loading={send.isPending} onClick={() => send.mutate([candidate.id])}>
            <CalendarPlus aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" /> Schedule
          </Button>
        ) : null}
        {canDecide && stage !== 'on_hold' ? (
          <Button className={btn} variant="secondary" onClick={() => setConfirm('hold')}>
            <Hourglass aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" /> Hold
          </Button>
        ) : null}
        {canDecide ? (
          <Button className={btn} variant="danger" onClick={() => setConfirm('reject')}>
            <UserX aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" /> Reject
          </Button>
        ) : null}
        {canReopen ? (
          <Button className={btn} variant="secondary" loading={decide.isPending} onClick={() => decide.mutate({ id: candidate.id, action: 'reopen' })}>
            <Undo2 aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" /> Back to review
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirm === 'hold'}
        onClose={() => setConfirm(null)}
        title="Put on hold?"
        description={`${name} gets an email saying they are on the waiting list. They stay there for ${s.holdDays} days. If you haven't scheduled or rejected by then, they are rejected automatically.`}
        confirmLabel="Hold and email"
        loading={decide.isPending}
        onConfirm={() => decide.mutate({ id: candidate.id, action: 'hold' }, { onSettled: () => setConfirm(null) })}
      />
      <ConfirmDialog
        open={confirm === 'reject'}
        onClose={() => setConfirm(null)}
        title="Reject this candidate?"
        description={`${name} gets a polite email that you are not moving forward. You can move them back to review later, but the email cannot be unsent.`}
        confirmLabel="Reject and email"
        tone="danger"
        loading={decide.isPending}
        onConfirm={() => decide.mutate({ id: candidate.id, action: 'reject' }, { onSettled: () => setConfirm(null) })}
      />
    </>
  );
}
