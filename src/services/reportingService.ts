import { GOOGLE_SCRIPT_URL, APP_ID } from '../constants';
import { Language, User, Persona } from '../types';

export interface ReportScores {
  formal: string;
  dominant: string;
}

export interface ReportPayload {
  appId: string;
  user: User;
  scores: ReportScores;
  personaKey: string;
  personaTitle: string;
  personaDetails: {
    strengths: string;
    tips: string;
    adhd_challenge: string;
    communication_challenge: string;
    consultation_benefit: string;
  };
  aiInsight: string;
  aiFeedback: string;
  refinementReason: string;
  clicks: { website: boolean; schedule: boolean; socials: Record<string, boolean> };
  answers: Record<number, number>;
  language: Language;
  isFinal: boolean;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * Pure function — no side effects, no React, no Firebase.
 * Assembles the complete Google Sheets sync payload from its inputs.
 */
export function buildPayload(
  user: User,
  scores: ReportScores,
  persona: Persona,
  language: Language,
  answers: Record<number, number>,
  overrides: Record<string, unknown> = {}
): ReportPayload {
  const base: ReportPayload = {
    appId: APP_ID,
    user,
    scores,
    personaKey: persona.key,
    personaTitle: persona.title[language],
    personaDetails: {
      strengths: persona.strengths[language].join('; '),
      tips: persona.tips[language].join('; '),
      adhd_challenge: persona.adhd_challenge[language],
      communication_challenge: persona.communication_challenge[language],
      consultation_benefit: persona.consultation_benefit[language],
    },
    aiInsight: '',
    aiFeedback: 'Pending',
    refinementReason: '',
    clicks: { website: false, schedule: false, socials: {} },
    answers,
    language,
    isFinal: false,
    timestamp: new Date().toISOString(),
  };

  return { ...base, ...overrides } as ReportPayload;
}

/**
 * Posts the payload to GOOGLE_SCRIPT_URL.
 * Uses no-cors mode to avoid CORS errors with the Google Apps Script endpoint.
 */
export async function saveReport(payload: ReportPayload): Promise<void> {
  if (!GOOGLE_SCRIPT_URL) return;
  await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
}

/**
 * Identical to saveReport but adds keepalive: true so the request survives
 * a tab close or page navigation (used in visibilitychange / pagehide handler).
 */
export async function sendFinalReport(payload: ReportPayload): Promise<void> {
  if (!GOOGLE_SCRIPT_URL) return;
  await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    keepalive: true,
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
}
