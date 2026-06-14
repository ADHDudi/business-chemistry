import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildPayload, saveReport, sendFinalReport } from './reportingService';
import { PERSONA_DATA } from '../constants';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const fixtureUser = { name: 'Test User', email: 'test@example.com' };
const fixtureScores = { formal: '4.50', dominant: '3.20' };
const fixturePersona = PERSONA_DATA.DRIVER;
const fixtureLanguage = 'en' as const;
const fixtureAnswers: Record<number, number> = { 0: 3, 1: 4, 2: 5 };

// ─── buildPayload ─────────────────────────────────────────────────────────────

describe('buildPayload', () => {
  it('returns an object with the expected shape', () => {
    const payload = buildPayload(fixtureUser, fixtureScores, fixturePersona, fixtureLanguage, fixtureAnswers);
    expect(payload).toHaveProperty('appId');
    expect(payload).toHaveProperty('user');
    expect(payload).toHaveProperty('scores');
    expect(payload).toHaveProperty('personaKey');
    expect(payload).toHaveProperty('personaTitle');
    expect(payload).toHaveProperty('personaDetails');
    expect(payload).toHaveProperty('aiInsight');
    expect(payload).toHaveProperty('aiFeedback');
    expect(payload).toHaveProperty('refinementReason');
    expect(payload).toHaveProperty('clicks');
    expect(payload).toHaveProperty('answers');
    expect(payload).toHaveProperty('language');
    expect(payload).toHaveProperty('isFinal');
    expect(payload).toHaveProperty('timestamp');
  });

  it('isFinal defaults to false', () => {
    const payload = buildPayload(fixtureUser, fixtureScores, fixturePersona, fixtureLanguage, fixtureAnswers);
    expect(payload.isFinal).toBe(false);
  });

  it('timestamp is a valid ISO string', () => {
    const before = Date.now();
    const payload = buildPayload(fixtureUser, fixtureScores, fixturePersona, fixtureLanguage, fixtureAnswers);
    const after = Date.now();
    const ts = new Date(payload.timestamp).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('overrides isFinal when provided', () => {
    const payload = buildPayload(fixtureUser, fixtureScores, fixturePersona, fixtureLanguage, fixtureAnswers, { isFinal: true });
    expect(payload.isFinal).toBe(true);
  });

  it('overrides aiInsight when provided', () => {
    const payload = buildPayload(fixtureUser, fixtureScores, fixturePersona, fixtureLanguage, fixtureAnswers, { aiInsight: 'some insight' });
    expect(payload.aiInsight).toBe('some insight');
  });

  it('overrides aiFeedback when provided', () => {
    const payload = buildPayload(fixtureUser, fixtureScores, fixturePersona, fixtureLanguage, fixtureAnswers, { aiFeedback: 'positive' });
    expect(payload.aiFeedback).toBe('positive');
  });

  it('personaKey matches the persona key', () => {
    const payload = buildPayload(fixtureUser, fixtureScores, fixturePersona, fixtureLanguage, fixtureAnswers);
    expect(payload.personaKey).toBe(fixturePersona.key);
  });

  it('scores are passed through correctly', () => {
    const payload = buildPayload(fixtureUser, fixtureScores, fixturePersona, fixtureLanguage, fixtureAnswers);
    expect(payload.scores).toEqual({ formal: '4.50', dominant: '3.20' });
  });

  it('user is passed through correctly', () => {
    const payload = buildPayload(fixtureUser, fixtureScores, fixturePersona, fixtureLanguage, fixtureAnswers);
    expect(payload.user).toEqual(fixtureUser);
  });

  it('answers are passed through correctly', () => {
    const payload = buildPayload(fixtureUser, fixtureScores, fixturePersona, fixtureLanguage, fixtureAnswers);
    expect(payload.answers).toEqual(fixtureAnswers);
  });

  it('language is passed through correctly', () => {
    const payload = buildPayload(fixtureUser, fixtureScores, fixturePersona, fixtureLanguage, fixtureAnswers);
    expect(payload.language).toBe(fixtureLanguage);
  });

  it('aiInsight defaults to empty string', () => {
    const payload = buildPayload(fixtureUser, fixtureScores, fixturePersona, fixtureLanguage, fixtureAnswers);
    expect(payload.aiInsight).toBe('');
  });

  it('aiFeedback defaults to Pending', () => {
    const payload = buildPayload(fixtureUser, fixtureScores, fixturePersona, fixtureLanguage, fixtureAnswers);
    expect(payload.aiFeedback).toBe('Pending');
  });

  it('personaDetails includes required fields', () => {
    const payload = buildPayload(fixtureUser, fixtureScores, fixturePersona, fixtureLanguage, fixtureAnswers);
    expect(payload.personaDetails).toHaveProperty('strengths');
    expect(payload.personaDetails).toHaveProperty('tips');
    expect(payload.personaDetails).toHaveProperty('adhd_challenge');
    expect(payload.personaDetails).toHaveProperty('communication_challenge');
    expect(payload.personaDetails).toHaveProperty('consultation_benefit');
  });
});

// ─── saveReport ───────────────────────────────────────────────────────────────

describe('saveReport', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue({ ok: true });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs to GOOGLE_SCRIPT_URL with correct headers', async () => {
    const payload = buildPayload(fixtureUser, fixtureScores, fixturePersona, fixtureLanguage, fixtureAnswers);
    await saveReport(payload);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(typeof url).toBe('string');
    expect(url.length).toBeGreaterThan(0);
    expect(options.method).toBe('POST');
    expect(options.mode).toBe('no-cors');
    expect(options.headers['Content-Type']).toBe('text/plain;charset=utf-8');
  });

  it('sends the payload as JSON-serialised body', async () => {
    const payload = buildPayload(fixtureUser, fixtureScores, fixturePersona, fixtureLanguage, fixtureAnswers);
    await saveReport(payload);
    const [, options] = fetchMock.mock.calls[0];
    // Parse both to compare without timestamp drift
    const sentBody = JSON.parse(options.body);
    expect(sentBody.appId).toBe(payload.appId);
    expect(sentBody.personaKey).toBe(payload.personaKey);
    expect(sentBody.user).toEqual(payload.user);
    expect(sentBody.answers).toEqual(payload.answers);
  });

  it('does not include keepalive', async () => {
    const payload = buildPayload(fixtureUser, fixtureScores, fixturePersona, fixtureLanguage, fixtureAnswers);
    await saveReport(payload);
    const [, options] = fetchMock.mock.calls[0];
    expect(options.keepalive).toBeFalsy();
  });
});

// ─── sendFinalReport ──────────────────────────────────────────────────────────

describe('sendFinalReport', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue({ ok: true });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('adds keepalive: true', async () => {
    const payload = buildPayload(fixtureUser, fixtureScores, fixturePersona, fixtureLanguage, fixtureAnswers);
    await sendFinalReport(payload);
    const [, options] = fetchMock.mock.calls[0];
    expect(options.keepalive).toBe(true);
  });

  it('POSTs to the same URL with correct headers', async () => {
    const payload = buildPayload(fixtureUser, fixtureScores, fixturePersona, fixtureLanguage, fixtureAnswers);
    await sendFinalReport(payload);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(typeof url).toBe('string');
    expect(url.length).toBeGreaterThan(0);
    expect(options.method).toBe('POST');
    expect(options.mode).toBe('no-cors');
    expect(options.headers['Content-Type']).toBe('text/plain;charset=utf-8');
  });
});
