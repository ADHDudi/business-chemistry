import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Firestore mock
// ---------------------------------------------------------------------------
const { mockUpdateDoc, mockGetDoc, mockDoc } = vi.hoisted(() => ({
  mockUpdateDoc: vi.fn(),
  mockGetDoc: vi.fn(),
  mockDoc: vi.fn((db: unknown, ...segments: string[]) => ({ _path: segments.join('/') })),
}));

vi.mock('../firebaseConfig', () => ({ db: {} }));

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  updateDoc: mockUpdateDoc,
  getDoc: mockGetDoc,
  serverTimestamp: () => 'SERVER_TS',
  setDoc: vi.fn(),
  getDocs: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  addDoc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
}));

import { checkAndMarkBothReady } from './sessionStatusService';

// ---------------------------------------------------------------------------
// JUS-342: checkAndMarkBothReady
// ---------------------------------------------------------------------------

const TOTAL_QUESTIONS = 35;

function makeAnswers(count: number): Record<number, number> {
  const out: Record<number, number> = {};
  for (let i = 0; i < count; i++) out[i] = 3;
  return out;
}

describe('checkAndMarkBothReady', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('updates status to both_ready when both answer sets are complete', async () => {
    mockUpdateDoc.mockResolvedValueOnce(undefined);
    await checkAndMarkBothReady('ABC123', makeAnswers(TOTAL_QUESTIONS), makeAnswers(TOTAL_QUESTIONS));
    const [, data] = mockUpdateDoc.mock.calls[0];
    expect(data.status).toBe('both_ready');
  });

  it('does NOT update status when only user A is done', async () => {
    await checkAndMarkBothReady('ABC123', makeAnswers(TOTAL_QUESTIONS), makeAnswers(10));
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it('does NOT update status when only user B is done', async () => {
    await checkAndMarkBothReady('ABC123', makeAnswers(5), makeAnswers(TOTAL_QUESTIONS));
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it('does NOT update status when neither user is done', async () => {
    await checkAndMarkBothReady('ABC123', makeAnswers(0), makeAnswers(0));
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it('considers exactly 35 answers as complete', async () => {
    mockUpdateDoc.mockResolvedValueOnce(undefined);
    await checkAndMarkBothReady('ABC123', makeAnswers(35), makeAnswers(35));
    expect(mockUpdateDoc).toHaveBeenCalledOnce();
  });
});
