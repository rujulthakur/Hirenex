import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OtpInput } from '@/components/ui';

function Harness({ onComplete }: { onComplete?: (v: string) => void }) {
  const [value, setValue] = useState('');
  return <OtpInput value={value} onChange={setValue} onComplete={onComplete} />;
}

describe('OtpInput', () => {
  it('renders six boxes', () => {
    render(<Harness />);
    expect(screen.getAllByRole('textbox')).toHaveLength(6);
  });

  it('auto-advances while typing and calls onComplete with six digits', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);
    await user.click(screen.getAllByRole('textbox')[0]);
    await user.keyboard('123456');
    expect(onComplete).toHaveBeenCalledWith('123456');
    expect(screen.getAllByRole('textbox')[5]).toHaveValue('6');
  });

  it('accepts a pasted code', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);
    await user.click(screen.getAllByRole('textbox')[0]);
    await user.paste('654321');
    expect(onComplete).toHaveBeenCalledWith('654321');
  });

  it('ignores non-digit characters', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getAllByRole('textbox')[0]);
    await user.keyboard('ab1');
    expect(screen.getAllByRole('textbox')[0]).toHaveValue('1');
  });

  it('backspace on an empty box moves back and clears the previous digit', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getAllByRole('textbox')[0]);
    await user.keyboard('12');
    await user.keyboard('{Backspace}');
    const boxes = screen.getAllByRole('textbox');
    expect(boxes[1]).toHaveValue('');
    expect(boxes[0]).toHaveValue('1');
  });
});
