/// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import SessionWizard from './SessionWizard';

afterEach(cleanup);

const props = {
  onStartSession: vi.fn(async () => {}),
  onJoinSession: vi.fn(async () => {}),
  isProcessing: false,
  language: 'en' as const,
};

// ---------------------------------------------------------------------------
// JUS-433: the Join modal opens straight on the code input
// ---------------------------------------------------------------------------

describe('SessionWizard', () => {
  it('starts on the Start/Join menu by default', () => {
    render(<SessionWizard {...props} />);
    expect(screen.queryByPlaceholderText('______')).toBeNull();
  });

  it('shows the join-code input directly with joinOnly, without a Back button', () => {
    render(<SessionWizard {...props} joinOnly />);
    expect(screen.getByPlaceholderText('______')).toBeTruthy();
    expect(screen.queryByText(/back/i)).toBeNull();
  });
});
