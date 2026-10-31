import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApprovalDialog, WeightSliderGroup, rebalanceWeights } from '@/components/ui';
import type { WeightItem } from '@/components/ui';
import { HighlightedText, RepairDiffView } from '@/components/domain';
import { copy } from '@/lib/copy';
import type { RepairDiff } from '@/types';

const items: WeightItem[] = [
  { id: 'a', name: 'Skills', weight: 40 },
  { id: 'b', name: 'Experience', weight: 35 },
  { id: 'c', name: 'Education', weight: 25 },
];
const sum = (l: WeightItem[]) => l.reduce((t, i) => t + i.weight, 0);

describe('WeightSliderGroup', () => {
  it('always sums to 100 after any change', () => {
    for (const v of [0, 7, 33, 61, 100]) expect(sum(rebalanceWeights(items, 'a', v))).toBe(100);
  });
  it('keeps a locked weight fixed', () => {
    const locked = items.map((i) => (i.id === 'b' ? { ...i, locked: true } : i));
    const next = rebalanceWeights(locked, 'a', 50);
    expect(next.find((i) => i.id === 'b')?.weight).toBe(35);
    expect(sum(next)).toBe(100);
  });
  it('renders one slider per criterion', () => {
    render(<WeightSliderGroup items={items} onChange={() => undefined} />);
    expect(screen.getAllByRole('slider')).toHaveLength(3);
  });
});

describe('HighlightedText', () => {
  it('marks the given ranges', () => {
    const { container } = render(<HighlightedText text="Built Python services daily" ranges={[{ id: 'q1', start: 6, end: 12 }]} />);
    const marks = container.querySelectorAll('mark');
    expect(marks).toHaveLength(1);
    expect(marks[0]?.textContent).toBe('Python');
  });
  it('renders plain text when there are no ranges', () => {
    const { container } = render(<HighlightedText text="Nothing here" />);
    expect(container.querySelectorAll('mark')).toHaveLength(0);
    expect(container.textContent).toBe('Nothing here');
  });
});

describe('ApprovalDialog gating', () => {
  function Harness({ onApprove }: { onApprove: () => void }) {
    const [open, setOpen] = useState(true);
    return <ApprovalDialog open={open} onClose={() => setOpen(false)} onApprove={onApprove} shortlist={[{ id: '1', label: 'Candidate 01' }]} waitlist={[]} />;
  }
  it('keeps the final button disabled until the review box is ticked', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    render(<Harness onApprove={onApprove} />);
    await user.click(screen.getByRole('button', { name: copy.overlays.approvalNext }));
    const confirm = screen.getByRole('button', { name: copy.overlays.approvalConfirm });
    expect(confirm).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: copy.overlays.approvalReviewed }));
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    expect(onApprove).toHaveBeenCalledTimes(1);
  });
});

describe('RepairDiffView', () => {
  it('shows the moved and conflict summary', () => {
    const diff: RepairDiff = { id: 'r1', reason: 'Interviewer unavailable', createdAt: '2026-01-01T00:00:00.000Z', before: [], after: [], moved: ['1', '2'], unplaced: [] };
    render(<RepairDiffView diff={diff} labels={{}} conflicts={0} />);
    expect(screen.getByRole('status')).toHaveTextContent(copy.domain.repairSummary(2, 0));
  });
});

