import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Ban, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { copy } from '@/lib/copy';
import { CandidateStage } from '@/types';
import type { Candidate } from '@/types';
import { STAGES, groupByStage, judgeMove } from '../candidatesModel';
import type { MoveVerdict } from '../candidatesModel';
import { useCandidateName } from '../hooks/useCandidateName';
import { KanbanCard, KanbanCardPreview } from './KanbanCard';

const DRAG_START_DISTANCE_PX = 6;

interface CandidatesKanbanProps {
  jobId: string;
  items: Candidate[];
  onOpen: (candidate: Candidate) => void;
}

interface MoveNotice {
  text: string;
  link: MoveVerdict['link'];
}

interface ColumnProps {
  stage: CandidateStage;
  items: Candidate[];
  /** Stage of the card being dragged, or null when nothing is being dragged. */
  draggingFrom: CandidateStage | null;
  onOpen: (candidate: Candidate) => void;
}

function Column({ stage, items, draggingFrom, onOpen }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const verdict = draggingFrom !== null && isOver ? judgeMove(draggingFrom, stage) : null;
  const refused = verdict !== null && !verdict.allowed;
  const title = copy.domain.stage[stage];

  return (
    <section
      ref={setNodeRef}
      aria-label={copy.candidates.kanban.columnLabel(title, items.length)}
      className={cn(
        'flex w-64 shrink-0 flex-col gap-3 rounded-lg border bg-surface-1 p-3 transition-colors duration-fast ease-standard',
        refused ? 'border-dashed border-danger' : isOver ? 'border-primary' : 'border-border',
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{title}</h3>
        <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs tabular-nums text-muted">{items.length}</span>
      </header>
      {refused ? (
        <p className="flex items-center gap-1 text-xs text-danger">
          <Ban aria-hidden="true" strokeWidth={1.5} className="h-3 w-3" />
          {copy.candidates.kanban.moveNotAllowed}
        </p>
      ) : null}
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted">{copy.candidates.kanban.emptyColumn}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((c) => (
            <KanbanCard key={c.id} candidate={c} onOpen={onOpen} />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Usage: <CandidatesKanban jobId={id} items={items} onOpen={openDrawer} />.
 * Seven columns, one per stage. The shared API has no stage-change endpoint, so no drop is applied: a refused drop
 * snaps the card back and explains why (and where the action really happens). Shortlisted and later cards cannot
 * be picked up at all.
 */
export function CandidatesKanban({ jobId, items, onOpen }: CandidatesKanbanProps) {
  const nameOf = useCandidateName();
  const groups = useMemo(() => groupByStage(items), [items]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notice, setNotice] = useState<MoveNotice | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DRAG_START_DISTANCE_PX } }),
    useSensor(KeyboardSensor),
  );

  const active = activeId === null ? undefined : items.find((c) => c.id === activeId);
  const nameFor = (id: string | number): string => {
    const c = items.find((x) => x.id === String(id));
    return c ? nameOf(c) : '';
  };

  const onDragStart = (e: DragStartEvent): void => {
    setNotice(null);
    setActiveId(String(e.active.id));
  };

  const onDragEnd = (e: DragEndEvent): void => {
    setActiveId(null);
    const card = items.find((c) => c.id === String(e.active.id));
    const target = CandidateStage.safeParse(e.over ? String(e.over.id) : '');
    if (!card || !target.success) return;
    const verdict = judgeMove(card.stage, target.data);
    if (verdict.allowed) return;
    setNotice({
      text: verdict.reason === 'same' ? copy.candidates.kanban.sameStage : copy.candidates.kanban.moveBlocked[verdict.reason],
      link: verdict.link,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {notice !== null ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-warning bg-surface-1 px-3 py-2">
          <Ban aria-hidden="true" strokeWidth={1.5} className="h-4 w-4 shrink-0 text-warning" />
          <p className="min-w-0 flex-1 text-base">
            <span className="font-medium">{copy.candidates.kanban.moveNotAllowed}. </span>
            {notice.text}
          </p>
          {notice.link !== null ? (
            <Link
              to={`/app/jobs/${jobId}/${notice.link}`}
              className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm hover:bg-surface-2 focus-visible:shadow-focus"
            >
              {notice.link === 'shortlist' ? copy.candidates.kanban.goShortlist : copy.candidates.kanban.goUpload}
            </Link>
          ) : null}
          <Button variant="icon" aria-label={copy.common.dismiss} onClick={() => setNotice(null)}>
            <X aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
        accessibility={{
          screenReaderInstructions: { draggable: copy.candidates.kanban.dragInstructions },
          announcements: {
            onDragStart: ({ active: a }) => copy.candidates.kanban.pickedUp(nameFor(a.id)),
            onDragOver: () => undefined,
            onDragEnd: ({ active: a }) => copy.candidates.kanban.droppedBack(nameFor(a.id)),
            onDragCancel: ({ active: a }) => copy.candidates.kanban.droppedBack(nameFor(a.id)),
          },
        }}
      >
        <div role="group" aria-label={copy.candidates.kanban.label} className="flex gap-3 overflow-x-auto pb-3">
          {STAGES.map((stage) => (
            <Column key={stage} stage={stage} items={groups[stage]} draggingFrom={active ? active.stage : null} onOpen={onOpen} />
          ))}
        </div>
        <DragOverlay>{active ? <KanbanCardPreview candidate={active} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
