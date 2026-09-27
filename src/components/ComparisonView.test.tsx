/// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(cleanup);
import ComparisonView, { dotLeftStyle, computeMatchScore } from './ComparisonView';
import type { SessionData } from '../services/sessionService';
import { traitsList } from '../constants';

const makeSession = (
  answersA: Record<number, number> = {},
  answersB: Record<number, number> = {}
): SessionData => ({
  sessionId: 'TEST01',
  createdAt: null,
  status: 'both_ready',
  founderAUid: 'uid-a',
  founderAName: 'Alice',
  founderAEmail: 'a@test.com',
  answersA,
  founderBUid: 'uid-b',
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

// ─── computeMatchScore ────────────────────────────────────────────────────────

describe('computeMatchScore', () => {
  it('returns 100 when all answers are identical', () => {
    const answers: Record<number, number> = {};
    traitsList.forEach((_, i) => { answers[i] = 3; });
    expect(computeMatchScore(answers, answers)).toBe(100);
  });

  it('returns 0 when every answer is maximally different (1 vs 6)', () => {
    const a: Record<number, number> = {};
    const b: Record<number, number> = {};
    traitsList.forEach((_, i) => { a[i] = 1; b[i] = 6; });
    expect(computeMatchScore(a, b)).toBe(0);
  });

  it('returns ~60 for a mean delta of 2 across all traits', () => {
    const a: Record<number, number> = {};
    const b: Record<number, number> = {};
    traitsList.forEach((_, i) => { a[i] = 1; b[i] = 3; }); // delta = 2 each
    expect(computeMatchScore(a, b)).toBe(60);
  });
});

// ─── JUS-345: persona header and match score in rendered output ───────────────

describe('ComparisonView — personas and match score', () => {
  function makeFullSession(scoreA: number, scoreB: number): SessionData {
    const answersA: Record<number, number> = {};
    const answersB: Record<number, number> = {};
    traitsList.forEach((_, i) => { answersA[i] = scoreA; answersB[i] = scoreB; });
    return {
      sessionId: 'FULL01',
      createdAt: null,
      status: 'both_ready',
      founderAUid: 'uid-a',
      founderAName: 'Alice',
      founderAEmail: 'a@test.com',
      answersA,
      founderBUid: 'uid-b',
      founderBName: 'Bob',
      founderBEmail: 'b@test.com',
      answersB,
    };
  }

  it('renders persona type labels for both users', () => {
    render(<ComparisonView sessionData={makeFullSession(3, 3)} language="en" />);
    // Both users have same answers → same persona. Check that persona text appears at least once.
    const personaEls = screen.getAllByTestId('persona-label');
    expect(personaEls.length).toBe(2);
  });

  it('renders a match score element', () => {
    render(<ComparisonView sessionData={makeFullSession(3, 3)} language="en" />);
    expect(screen.getByTestId('match-score')).toBeTruthy();
  });

  it('shows 100% match when both users answer identically', () => {
    render(<ComparisonView sessionData={makeFullSession(3, 3)} language="en" />);
    expect(screen.getByTestId('match-score').textContent).toContain('100');
  });

  it('renders all trait rows (no null skipping)', () => {
    const session = makeFullSession(2, 4);
    render(<ComparisonView sessionData={session} language="en" />);
    const deltaEls = screen.getAllByText(/Delta: 2/);
    expect(deltaEls.length).toBe(traitsList.length);
  });
});
