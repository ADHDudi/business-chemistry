import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Firestore mock
// ---------------------------------------------------------------------------
const {
  mockSetDoc,
  mockUpdateDoc,
  mockGetDoc,
  mockOnSnapshot,
  mockDoc,
  mockServerTimestamp,
} = vi.hoisted(() => {
  const mockUnsubscribe = vi.fn();
  return {
    mockSetDoc: vi.fn(),
    mockUpdateDoc: vi.fn(),
    mockGetDoc: vi.fn(),
    mockOnSnapshot: vi.fn(() => mockUnsubscribe),
    mockDoc: vi.fn((db: unknown, ...segments: string[]) => ({ _path: segments.join('/') })),
    mockServerTimestamp: vi.fn(() => 'SERVER_TS'),
  };
});

vi.mock('../firebaseConfig', () => ({ db: {} }));

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  getDoc: mockGetDoc,
  onSnapshot: mockOnSnapshot,
  serverTimestamp: mockServerTimestamp,
}));

import { createSession, joinSession, updateAnswers } from './sessionService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSessionSnap(exists: boolean, data: Record<string, unknown> = {}) {
  return { exists: () => exists, data: () => data };
}

// ---------------------------------------------------------------------------
// JUS-340: createSession
// ---------------------------------------------------------------------------

describe('createSession', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('creates a Firestore document under sessions/', async () => {
    mockSetDoc.mockResolvedValueOnce(undefined);
    await createSession('Alice', 'a@test.com', 'uid-alice');
    expect(mockDoc).toHaveBeenCalledWith({}, 'sessions', expect.any(String));
  });

  it('saves founderAUid from the auth user', async () => {
    mockSetDoc.mockResolvedValueOnce(undefined);
    await createSession('Alice', 'a@test.com', 'uid-alice');
    const [, data] = mockSetDoc.mock.calls[0];
    expect(data.founderAUid).toBe('uid-alice');
    expect(data.founderAName).toBe('Alice');
    expect(data.founderAEmail).toBe('a@test.com');
  });

  it('initialises status to "waiting"', async () => {
    mockSetDoc.mockResolvedValueOnce(undefined);
    await createSession('Alice', 'a@test.com', 'uid-alice');
    const [, data] = mockSetDoc.mock.calls[0];
    expect(data.status).toBe('waiting');
  });

  it('initialises empty answer objects for both roles', async () => {
    mockSetDoc.mockResolvedValueOnce(undefined);
    await createSession('Alice', 'a@test.com', 'uid-alice');
    const [, data] = mockSetDoc.mock.calls[0];
    expect(data.answersA).toEqual({});
    expect(data.answersB).toEqual({});
  });

  it('returns the generated session ID', async () => {
    mockSetDoc.mockResolvedValueOnce(undefined);
    const id = await createSession('Alice', 'a@test.com', 'uid-alice');
    expect(typeof id).toBe('string');
    expect(id.length).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// JUS-340: joinSession — success path
// ---------------------------------------------------------------------------

describe('joinSession — success', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('updates founderBUid, founderBName, founderBEmail and status', async () => {
    mockGetDoc.mockResolvedValueOnce(makeSessionSnap(true, {
      founderBName: '',
      founderBEmail: '',
    }));
    mockUpdateDoc.mockResolvedValueOnce(undefined);

    await joinSession('ABC123', 'Bob', 'b@test.com', 'uid-bob');

    const [, updates] = mockUpdateDoc.mock.calls[0];
    expect(updates.founderBUid).toBe('uid-bob');
    expect(updates.founderBName).toBe('Bob');
    expect(updates.founderBEmail).toBe('b@test.com');
    expect(updates.status).toBe('in_progress');
  });

  it('returns the session data on success', async () => {
    const snap = makeSessionSnap(true, { founderBName: '', founderBEmail: '' });
    mockGetDoc.mockResolvedValueOnce(snap);
    mockUpdateDoc.mockResolvedValueOnce(undefined);

    const result = await joinSession('ABC123', 'Bob', 'b@test.com', 'uid-bob');
    expect(result).toEqual(snap.data());
  });
});

// ---------------------------------------------------------------------------
// JUS-340: joinSession — rejection cases
// ---------------------------------------------------------------------------

describe('joinSession — rejection', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('throws "Session not found" when doc does not exist', async () => {
    mockGetDoc.mockResolvedValueOnce(makeSessionSnap(false));
    await expect(joinSession('NOPE00', 'Bob', 'b@test.com', 'uid-bob'))
      .rejects.toThrow('Session not found');
  });

  it('throws "Session is full" when founderBName is already set', async () => {
    mockGetDoc.mockResolvedValueOnce(makeSessionSnap(true, {
      founderBName: 'Carol',
      founderBEmail: 'c@test.com',
    }));
    await expect(joinSession('ABC123', 'Bob', 'b@test.com', 'uid-bob'))
      .rejects.toThrow('Session is full');
  });
});

// ---------------------------------------------------------------------------
// JUS-340: updateAnswers
// ---------------------------------------------------------------------------

describe('updateAnswers', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('writes answersA when role is A', async () => {
    mockUpdateDoc.mockResolvedValueOnce(undefined);
    await updateAnswers('ABC123', 'A', { 0: 3, 1: 4 });
    const [, data] = mockUpdateDoc.mock.calls[0];
    expect(data.answersA).toEqual({ 0: 3, 1: 4 });
    expect(data.answersB).toBeUndefined();
  });

  it('writes answersB when role is B', async () => {
    mockUpdateDoc.mockResolvedValueOnce(undefined);
    await updateAnswers('ABC123', 'B', { 0: 5 });
    const [, data] = mockUpdateDoc.mock.calls[0];
    expect(data.answersB).toEqual({ 0: 5 });
    expect(data.answersA).toBeUndefined();
  });
});
