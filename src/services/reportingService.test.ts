import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Firestore mock — vi.hoisted ensures these run before vi.mock hoisting
// ---------------------------------------------------------------------------
const { mockAddDoc, mockGetDocs, mockCollection, mockQuery, mockOrderBy, mockLimit } = vi.hoisted(() => {
  const mockAddDoc = vi.fn();
  const mockGetDocs = vi.fn();
  const mockCollection = vi.fn((...args: string[]) => ({ path: args.join('/') }));
  const mockQuery = vi.fn((...args: unknown[]) => args[0]);
  const mockOrderBy = vi.fn((field: string, dir: string) => ({ _orderBy: field, _dir: dir }));
  const mockLimit = vi.fn((n: number) => ({ _limit: n }));
  return { mockAddDoc, mockGetDocs, mockCollection, mockQuery, mockOrderBy, mockLimit };
});

vi.mock('../firebaseConfig', () => ({ db: {} }));

vi.mock('firebase/firestore', () => ({
  addDoc: mockAddDoc,
  collection: mockCollection,
  getDocs: mockGetDocs,
  query: mockQuery,
  orderBy: mockOrderBy,
  limit: mockLimit,
  serverTimestamp: () => 'SERVER_TIMESTAMP',
}));

import { saveUserReport, getLatestReport, type UserReport } from './reportingService';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const uid = 'user-abc-123';

const fixtureData = {
  answers: { 0: 3, 1: 5, 2: 2 },
  scores: { formal: '4.20', dominant: '2.80' },
  personaKey: 'DRIVER',
  language: 'en' as const,
};

// ---------------------------------------------------------------------------
// JUS-339: saveUserReport
// ---------------------------------------------------------------------------

describe('saveUserReport', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('writes to the users/{uid}/reports collection', async () => {
    mockAddDoc.mockResolvedValueOnce({ id: 'doc-1' });
    await saveUserReport(uid, fixtureData);
    expect(mockCollection).toHaveBeenCalledWith({}, 'users', uid, 'reports');
  });

  it('includes all payload fields in the saved document', async () => {
    mockAddDoc.mockResolvedValueOnce({ id: 'doc-1' });
    await saveUserReport(uid, fixtureData);
    const [, docData] = mockAddDoc.mock.calls[0];
    expect(docData.uid).toBe(uid);
    expect(docData.answers).toEqual(fixtureData.answers);
    expect(docData.scores).toEqual(fixtureData.scores);
    expect(docData.personaKey).toBe(fixtureData.personaKey);
    expect(docData.language).toBe(fixtureData.language);
  });

  it('sets createdAt to serverTimestamp', async () => {
    mockAddDoc.mockResolvedValueOnce({ id: 'doc-1' });
    await saveUserReport(uid, fixtureData);
    const [, docData] = mockAddDoc.mock.calls[0];
    expect(docData.createdAt).toBe('SERVER_TIMESTAMP');
  });
});

// ---------------------------------------------------------------------------
// JUS-339: getLatestReport
// ---------------------------------------------------------------------------

describe('getLatestReport', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('queries users/{uid}/reports ordered by createdAt descending with limit 1', async () => {
    mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });
    await getLatestReport(uid);
    expect(mockCollection).toHaveBeenCalledWith({}, 'users', uid, 'reports');
    expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(mockLimit).toHaveBeenCalledWith(1);
  });

  it('returns null when the user has no reports', async () => {
    mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });
    const result = await getLatestReport(uid);
    expect(result).toBeNull();
  });

  it('returns the report data when a document exists', async () => {
    const storedDoc: UserReport = {
      uid,
      createdAt: { seconds: 1700000000 },
      answers: { 0: 4 },
      scores: { formal: '3.50', dominant: '5.00' },
      personaKey: 'PIONEER',
      language: 'he',
    };
    mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ data: () => storedDoc }],
    });
    const result = await getLatestReport(uid);
    expect(result).toEqual(storedDoc);
  });
});
