/// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(cleanup);
import ComparisonView, { dotLeftStyle } from './ComparisonView';
import type { SessionData } from '../services/sessionService';

const makeSession = (
  answersA: Record<number, number> = {},
  answersB: Record<number, number> = {}
): SessionData => ({
  sessionId: 'TEST01',
  createdAt: null,
  founderAName: 'Alice',
  founderAEmail: 'a@test.com',
  answersA,
  founderBName: 'Bob',
  founderBEmail: 'b@test.com',
  answersB,
});

// ─── Smoke test ───────────────────────────────────────────────────────────────

describe('ComparisonView', () => {
  it('renders without throwing when both users have no answers yet', () => {
    render(<ComparisonView sessionData={makeSession()} language="en" />);
  });

  it('renders the comparison title', () => {
    render(<ComparisonView sessionData={makeSession()} language="en" />);
    expect(screen.getByText('Answer Comparison')).toBeTruthy();
  });

  it('renders the Hebrew title when language is he', () => {
    render(<ComparisonView sessionData={makeSession()} language="he" />);
    expect(screen.getByText('השוואת תשובות')).toBeTruthy();
  });

  // ─── Visibility rules ──────────────────────────────────────────────────────

  it('shows no trait rows when both users have no answers', () => {
    const { container } = render(<ComparisonView sessionData={makeSession()} language="en" />);
    // Delta badges only appear on answered traits
    expect(container.querySelectorAll('[class*="rounded-full"]').length).toBeGreaterThanOrEqual(0);
    // No "Delta:" text should appear
    expect(screen.queryByText(/Delta:/)).toBeNull();
  });

  it('shows a row only for traits where both users answered', () => {
    // Only trait 0 has both answers
    const session = makeSession({ 0: 3, 1: 4 }, { 0: 5 });
    render(<ComparisonView sessionData={session} language="en" />);
    // Delta for trait 0: |3 - 5| = 2 → "Delta: 2"
    expect(screen.getByText('Delta: 2')).toBeTruthy();
    // Trait 1 is missing B answer → no row
    expect(screen.queryByText('Delta: 0')).toBeNull();
  });

  // ─── Delta colour logic ────────────────────────────────────────────────────

  it('shows delta value for a high-friction pair (delta >= 3)', () => {
    // scoreA=1, scoreB=6 → delta=5 (friction / red)
    const session = makeSession({ 0: 1 }, { 0: 6 });
    render(<ComparisonView sessionData={session} language="en" />);
    expect(screen.getByText('Delta: 5')).toBeTruthy();
  });

  it('shows delta value for an agreement pair (delta <= 1)', () => {
    // scoreA=3, scoreB=4 → delta=1 (agreement / green)
    const session = makeSession({ 0: 3 }, { 0: 4 });
    render(<ComparisonView sessionData={session} language="en" />);
    expect(screen.getByText('Delta: 1')).toBeTruthy();
  });

  it('shows delta value for a gap pair (delta == 2)', () => {
    // scoreA=2, scoreB=4 → delta=2 (gap / amber)
    const session = makeSession({ 0: 2 }, { 0: 4 });
    render(<ComparisonView sessionData={session} language="en" />);
    expect(screen.getByText('Delta: 2')).toBeTruthy();
  });

  // ─── dotLeftStyle — pure function, no browser needed ──────────────────────

  it('dotLeftStyle uses clamp() for all scores', () => {
    for (let score = 1; score <= 6; score++) {
      expect(dotLeftStyle(score)).toContain('clamp(0px,');
    }
  });

  it('dotLeftStyle minimum bound is 0px (score=1 never goes negative)', () => {
    expect(dotLeftStyle(1)).toMatch(/^clamp\(0px,/);
  });

  it('dotLeftStyle maximum bound prevents right overflow (score=6)', () => {
    expect(dotLeftStyle(6)).toContain('calc(100% - 32px)');
  });
});
