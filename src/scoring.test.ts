import { describe, it, expect } from 'vitest';
import {
  calculateResults,
  getPersona,
  computePersonaAffinities,
  generateMockAnswers,
  PERSONA_CENTROIDS,
} from './scoring';

const TOTAL_TRAITS = 35;

const uniformAnswers = (value: number): Record<number, number> =>
  Object.fromEntries(Array.from({ length: TOTAL_TRAITS }, (_, i) => [i, value]));

// ─── calculateResults ──────────────────────────────────────────────────────────

describe('calculateResults', () => {
  it('returns formal and dominant as numeric strings', () => {
    const result = calculateResults(uniformAnswers(4));
    expect(isNaN(parseFloat(result.formal))).toBe(false);
    expect(isNaN(parseFloat(result.dominant))).toBe(false);
  });

  it('returns profileData with one entry per trait', () => {
    const result = calculateResults(uniformAnswers(3));
    expect(result.profileData).toHaveLength(TOTAL_TRAITS);
  });

  it('defaults missing answers to 3.5', () => {
    const result = calculateResults({});
    expect(parseFloat(result.formal)).toBeCloseTo(3.5, 1);
    expect(parseFloat(result.dominant)).toBeCloseTo(3.5, 1);
  });

  it('normalises reverse traits symmetrically — all-1s + all-6s averages sum to 7', () => {
    // For any trait: normalised(1) + normalised(6) = 7 regardless of reverse flag.
    // So the axis averages must also sum to 7.
    const r1 = calculateResults(uniformAnswers(1));
    const r6 = calculateResults(uniformAnswers(6));
    // toFixed(2) can introduce up to 0.01 rounding error per value
    expect(parseFloat(r1.formal) + parseFloat(r6.formal)).toBeCloseTo(7, 1);
    expect(parseFloat(r1.dominant) + parseFloat(r6.dominant)).toBeCloseTo(7, 1);
  });

  it('reverse traits push the average away from the raw score direction', () => {
    // All answers = 1. Forward traits normalise to 1, reverse traits normalise to 6.
    // The presence of reverse traits means the average is > 1.
    const result = calculateResults(uniformAnswers(1));
    expect(parseFloat(result.formal)).toBeGreaterThan(1);
    expect(parseFloat(result.dominant)).toBeGreaterThan(1);
  });
});

// ─── getPersona ───────────────────────────────────────────────────────────────

describe('getPersona', () => {
  it('returns DRIVER when dominant > 3.5 and formal > 3.5', () => {
    expect(getPersona('4', '4').key).toBe('DRIVER');
  });

  it('returns PIONEER when dominant > 3.5 and formal <= 3.5', () => {
    expect(getPersona('3', '4').key).toBe('PIONEER');
  });

  it('returns GUARDIAN when dominant <= 3.5 and formal > 3.5', () => {
    expect(getPersona('4', '3').key).toBe('GUARDIAN');
  });

  it('returns INTEGRATOR when dominant <= 3.5 and formal <= 3.5', () => {
    expect(getPersona('3', '3').key).toBe('INTEGRATOR');
  });

  it('returns a Persona with the expected shape', () => {
    const persona = getPersona('5', '5');
    expect(persona).toHaveProperty('key');
    expect(persona).toHaveProperty('title');
    expect(persona).toHaveProperty('strengths');
  });
});

// ─── computePersonaAffinities ─────────────────────────────────────────────────

describe('computePersonaAffinities', () => {
  it('returns 4 entries, one per persona', () => {
    expect(computePersonaAffinities(3.5, 3.5)).toHaveLength(4);
  });

  it('returns results sorted descending by affinity', () => {
    const affinities = computePersonaAffinities(5, 5);
    for (let i = 0; i < affinities.length - 1; i++) {
      expect(affinities[i].affinity).toBeGreaterThanOrEqual(affinities[i + 1].affinity);
    }
  });

  it('gives 100% affinity at a persona centroid', () => {
    for (const [key, centroid] of Object.entries(PERSONA_CENTROIDS)) {
      const affinities = computePersonaAffinities(centroid.formal, centroid.dominant);
      const match = affinities.find(a => a.key === key);
      expect(match?.affinity).toBe(100);
    }
  });

  it('gives equal affinity to all personas at the midpoint (3.5, 3.5)', () => {
    const affinities = computePersonaAffinities(3.5, 3.5);
    const values = affinities.map(a => a.affinity);
    expect(new Set(values).size).toBe(1);
  });

  it('midpoint affinity is 50', () => {
    const affinities = computePersonaAffinities(3.5, 3.5);
    expect(affinities[0].affinity).toBe(50);
  });
});

// ─── generateMockAnswers ──────────────────────────────────────────────────────

describe('generateMockAnswers', () => {
  const PERSONA_KEYS = ['PIONEER', 'DRIVER', 'GUARDIAN', 'INTEGRATOR'] as const;

  it('returns an answer for each trait', () => {
    const answers = generateMockAnswers('PIONEER');
    expect(Object.keys(answers)).toHaveLength(TOTAL_TRAITS);
  });

  it('all answers are within the 1-6 scale', () => {
    for (const key of PERSONA_KEYS) {
      const answers = generateMockAnswers(key);
      for (const score of Object.values(answers)) {
        expect(score).toBeGreaterThanOrEqual(1);
        expect(score).toBeLessThanOrEqual(6);
      }
    }
  });

  it('round-trips through scoring to produce the correct persona', () => {
    for (const key of PERSONA_KEYS) {
      const answers = generateMockAnswers(key);
      const results = calculateResults(answers);
      const persona = getPersona(results.formal, results.dominant);
      expect(persona.key).toBe(key);
    }
  });
});
