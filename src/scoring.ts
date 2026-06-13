import { traitsList, PERSONA_DATA } from './constants';
import { AxisType, Results, Persona } from './types';

export const PERSONA_CENTROIDS: Record<string, { dominant: number; formal: number }> = {
  PIONEER:    { dominant: 5, formal: 2 },
  DRIVER:     { dominant: 5, formal: 5 },
  GUARDIAN:   { dominant: 2, formal: 5 },
  INTEGRATOR: { dominant: 2, formal: 2 },
};

export function calculateResults(answers: Record<number, number>): Results {
  const profileData = traitsList.map((trait, index) => {
    const rawScore = answers[index] || 3.5;
    const normalizedScore = trait.reverse ? 7 - rawScore : rawScore;
    return { ...trait, rawScore, normalizedScore };
  });

  const formalTraits = profileData.filter(t => t.axis === AxisType.FORMAL);
  const dominantTraits = profileData.filter(t => t.axis === AxisType.DOMINANT);

  const avgFormal = formalTraits.reduce((acc, curr) => acc + curr.normalizedScore, 0) / (formalTraits.length || 1);
  const avgDominant = dominantTraits.reduce((acc, curr) => acc + curr.normalizedScore, 0) / (dominantTraits.length || 1);

  return {
    formal: avgFormal.toFixed(2),
    dominant: avgDominant.toFixed(2),
    profileData,
  };
}

export function getPersona(formal: string, dominant: string): Persona {
  const f = parseFloat(formal);
  const d = parseFloat(dominant);

  if (d > 3.5) {
    return f > 3.5 ? PERSONA_DATA.DRIVER : PERSONA_DATA.PIONEER;
  } else {
    return f > 3.5 ? PERSONA_DATA.GUARDIAN : PERSONA_DATA.INTEGRATOR;
  }
}

export function computePersonaAffinities(formal: number, dominant: number) {
  const MAX_D = Math.sqrt(18);
  return (['PIONEER', 'DRIVER', 'GUARDIAN', 'INTEGRATOR'] as const).map(key => {
    const c = PERSONA_CENTROIDS[key];
    const dist = Math.hypot(dominant - c.dominant, formal - c.formal);
    const affinity = Math.max(0, Math.round((1 - dist / MAX_D) * 100));
    return { key, affinity };
  }).sort((a, b) => b.affinity - a.affinity);
}

export function generateMockAnswers(targetPersonaKey: string): Record<number, number> {
  const answers: Record<number, number> = {};
  traitsList.forEach((trait, index) => {
    let targetNormalized = 3.5;
    if (trait.axis === AxisType.DOMINANT) {
      targetNormalized = (targetPersonaKey === 'PIONEER' || targetPersonaKey === 'DRIVER') ? 5 + Math.random() : 1 + Math.random();
    } else if (trait.axis === AxisType.FORMAL) {
      targetNormalized = (targetPersonaKey === 'DRIVER' || targetPersonaKey === 'GUARDIAN') ? 5 + Math.random() : 1 + Math.random();
    }
    const rawScore = Math.round(trait.reverse ? 7 - targetNormalized : targetNormalized);
    answers[index] = Math.max(1, Math.min(6, rawScore));
  });
  return answers;
}
