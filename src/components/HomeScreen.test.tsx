/// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';

afterEach(() => { cleanup(); vi.useRealTimers(); });

// ---------------------------------------------------------------------------
// Mock getLatestReport so we can control what the home screen sees
// ---------------------------------------------------------------------------
const { mockGetLatestReport } = vi.hoisted(() => ({
  mockGetLatestReport: vi.fn(),
}));

vi.mock('../services/reportingService', () => ({
  getLatestReport: mockGetLatestReport,
}));

vi.mock('../firebaseConfig', () => ({ db: {}, analytics: {} }));
vi.mock('firebase/analytics', () => ({ logEvent: vi.fn() }));

import HomeScreen, { PROFILE_LOAD_TIMEOUT_MS } from './HomeScreen';
import type { UserReport } from '../services/reportingService';

const fixtureReport: UserReport = {
  uid: 'uid-alice',
  createdAt: { seconds: 1700000000 },
  answers: {},
  scores: { formal: '4.0', dominant: '2.0' },
  personaKey: 'PIONEER',
  language: 'en',
};

const defaultProps = {
  uid: 'uid-alice',
  language: 'en' as const,
  onStartSolo: vi.fn(),
  onStartSession: vi.fn(),
  onJoinSession: vi.fn(),
};

// ---------------------------------------------------------------------------
// JUS-341: HomeScreen — returning user with existing analysis
// ---------------------------------------------------------------------------

describe('HomeScreen — returning user', () => {
  it('shows the persona title when a report exists', async () => {
    mockGetLatestReport.mockResolvedValueOnce(fixtureReport);
    render(<HomeScreen {...defaultProps} />);
    // Wait for async report load
    await screen.findByTestId('persona-summary');
    expect(screen.getByTestId('persona-summary')).toBeTruthy();
  });

  it('shows "Redo analysis" button for returning users', async () => {
    mockGetLatestReport.mockResolvedValueOnce(fixtureReport);
    render(<HomeScreen {...defaultProps} />);
    await screen.findByTestId('redo-analysis-btn');
    expect(screen.getByTestId('redo-analysis-btn')).toBeTruthy();
  });

  it('pair session buttons are enabled for returning users', async () => {
    mockGetLatestReport.mockResolvedValueOnce(fixtureReport);
    render(<HomeScreen {...defaultProps} />);
    await screen.findByTestId('start-session-btn');
    expect(screen.getByTestId('start-session-btn')).not.toBeDisabled();
    expect(screen.getByTestId('join-session-btn')).not.toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// JUS-341: HomeScreen — first-time user (no existing report)
// ---------------------------------------------------------------------------

describe('HomeScreen — first-time user', () => {
  it('shows "Start Your Analysis" CTA when no report exists', async () => {
    mockGetLatestReport.mockResolvedValueOnce(null);
    render(<HomeScreen {...defaultProps} />);
    await screen.findByTestId('start-analysis-btn');
    expect(screen.getByTestId('start-analysis-btn')).toBeTruthy();
  });

  it('pair session buttons are disabled for first-time users', async () => {
    mockGetLatestReport.mockResolvedValueOnce(null);
    render(<HomeScreen {...defaultProps} />);
    await screen.findByTestId('start-session-btn');
    expect(screen.getByTestId('start-session-btn')).toBeDisabled();
    expect(screen.getByTestId('join-session-btn')).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Profile load failures must not leave the spinner up forever
// ---------------------------------------------------------------------------

describe('HomeScreen — profile load failure', () => {
  beforeEach(() => { mockGetLatestReport.mockReset(); });

  it('shows an error with a retry button when getLatestReport rejects', async () => {
    mockGetLatestReport.mockRejectedValueOnce(new Error('unavailable'));
    render(<HomeScreen {...defaultProps} />);
    await screen.findByTestId('home-load-error');
    expect(screen.queryByTestId('start-analysis-btn')).toBeNull();
  });

  it('shows an error when getLatestReport never settles', async () => {
    vi.useFakeTimers();
    mockGetLatestReport.mockReturnValueOnce(new Promise(() => {}));
    render(<HomeScreen {...defaultProps} />);
    await act(async () => { vi.advanceTimersByTime(PROFILE_LOAD_TIMEOUT_MS); });
    expect(screen.getByTestId('home-load-error')).toBeTruthy();
  });

  it('retries the load when "Try again" is clicked', async () => {
    mockGetLatestReport.mockRejectedValueOnce(new Error('unavailable'));
    mockGetLatestReport.mockResolvedValueOnce(fixtureReport);
    render(<HomeScreen {...defaultProps} />);
    fireEvent.click(await screen.findByTestId('retry-load-btn'));
    await screen.findByTestId('persona-summary');
    expect(mockGetLatestReport).toHaveBeenCalledTimes(2);
  });
});
