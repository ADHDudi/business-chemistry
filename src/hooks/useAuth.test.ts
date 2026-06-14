/// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Firebase mock — vi.hoisted ensures these are available before vi.mock hoisting
// ---------------------------------------------------------------------------
const {
  mockUnsubscribe,
  mockOnAuthStateChanged,
  mockSignInWithPopup,
  mockSignOut,
  mockSignInWithEmailAndPassword,
  mockCreateUserWithEmailAndPassword,
  mockSendPasswordResetEmail,
} = vi.hoisted(() => {
  const mockUnsubscribe = vi.fn();
  return {
    mockUnsubscribe,
    mockOnAuthStateChanged: vi.fn(() => mockUnsubscribe),
    mockSignInWithPopup: vi.fn(),
    mockSignOut: vi.fn(),
    mockSignInWithEmailAndPassword: vi.fn(),
    mockCreateUserWithEmailAndPassword: vi.fn(),
    mockSendPasswordResetEmail: vi.fn(),
  };
});

vi.mock('../firebaseConfig', () => ({
  auth: {},
  googleProvider: {},
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: mockOnAuthStateChanged,
  signInWithPopup: mockSignInWithPopup,
  signOut: mockSignOut,
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
}));

// Import after mocks are set up
import { useAuth } from './useAuth';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simulate onAuthStateChanged calling back with a user (or null). */
function triggerAuthChange(user: unknown) {
  // calls[0] is [auth, callback] — index 1 is the callback
  const calls = mockOnAuthStateChanged.mock.calls as unknown as Array<[unknown, (u: unknown) => void]>;
  const callback = calls[0]?.[1];
  if (callback) act(() => callback(user));
}

// ---------------------------------------------------------------------------
// JUS-173: Canary — hook environment works
// ---------------------------------------------------------------------------

describe('useAuth canary', () => {
  it('renders without error in happy-dom environment', () => {
    mockOnAuthStateChanged.mockReturnValueOnce(mockUnsubscribe);
    const { result } = renderHook(() => useAuth());
    expect(result.current).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// JUS-176: onAuthStateChanged subscription
// ---------------------------------------------------------------------------

describe('useAuth – auth state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns authUser as null before auth resolves', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.authUser).toBeNull();
  });

  it('isAuthLoading starts true and becomes false after auth resolves', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthLoading).toBe(true);

    triggerAuthChange(null);
    expect(result.current.isAuthLoading).toBe(false);
  });

  it('authUser is set when onAuthStateChanged fires with a user', () => {
    const fakeUser = { uid: '123', displayName: 'Test', email: 'test@x.com' };
    const { result } = renderHook(() => useAuth());

    triggerAuthChange(fakeUser);
    expect(result.current.authUser).toEqual(fakeUser);
  });

  it('unsubscribes from onAuthStateChanged on unmount', () => {
    const { unmount } = renderHook(() => useAuth());
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// JUS-179: login (Google OAuth) and logout handlers
// ---------------------------------------------------------------------------

describe('useAuth – login / logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);
  });

  it('login calls signInWithPopup with googleProvider', async () => {
    mockSignInWithPopup.mockResolvedValueOnce({ user: { displayName: 'G', email: 'g@x.com' } });
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.login());
    expect(mockSignInWithPopup).toHaveBeenCalledOnce();
  });

  it('login returns true on success', async () => {
    mockSignInWithPopup.mockResolvedValueOnce({ user: { displayName: 'G', email: 'g@x.com' } });
    const { result } = renderHook(() => useAuth());
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.login(); });
    expect(ok).toBe(true);
  });

  it('login returns false on failure', async () => {
    mockSignInWithPopup.mockRejectedValueOnce(new Error('popup closed'));
    const { result } = renderHook(() => useAuth());
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.login(); });
    expect(ok).toBe(false);
  });

  it('login sets authError on failure', async () => {
    mockSignInWithPopup.mockRejectedValueOnce(new Error('popup closed'));
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.login());
    expect(result.current.authError).toBeTruthy();
  });

  it('logout calls signOut', async () => {
    mockSignOut.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.logout());
    expect(mockSignOut).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// JUS-182: register (email/password sign-in) handler
// ---------------------------------------------------------------------------

describe('useAuth – register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);
  });

  it('register calls signInWithEmailAndPassword', async () => {
    mockSignInWithEmailAndPassword.mockResolvedValueOnce({
      user: { displayName: null, email: 'a@b.com' },
    });
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.register('a@b.com', 'pass123'));
    expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith({}, 'a@b.com', 'pass123');
  });

  it('register returns true on success', async () => {
    mockSignInWithEmailAndPassword.mockResolvedValueOnce({
      user: { displayName: null, email: 'a@b.com' },
    });
    const { result } = renderHook(() => useAuth());
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.register('a@b.com', 'pass123'); });
    expect(ok).toBe(true);
  });

  it('register returns false on failure', async () => {
    const err: any = new Error('wrong-password');
    err.code = 'auth/wrong-password';
    mockSignInWithEmailAndPassword.mockRejectedValueOnce(err);
    const { result } = renderHook(() => useAuth());
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.register('a@b.com', 'wrong'); });
    expect(ok).toBe(false);
  });

  it('register sets authError on failure', async () => {
    const err: any = new Error('wrong-password');
    err.code = 'auth/wrong-password';
    mockSignInWithEmailAndPassword.mockRejectedValueOnce(err);
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.register('a@b.com', 'wrong'));
    expect(result.current.authError).toBeTruthy();
  });

  it('register clears authError on success', async () => {
    // First fail to set an error...
    const err: any = new Error('wrong');
    err.code = 'auth/wrong-password';
    mockSignInWithEmailAndPassword.mockRejectedValueOnce(err);
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.register('a@b.com', 'bad'));
    expect(result.current.authError).toBeTruthy();

    // Then succeed to clear it
    mockSignInWithEmailAndPassword.mockResolvedValueOnce({
      user: { displayName: null, email: 'a@b.com' },
    });
    await act(() => result.current.register('a@b.com', 'good'));
    expect(result.current.authError).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// JUS-185: signUp and forgotPassword handlers
// ---------------------------------------------------------------------------

describe('useAuth – signUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);
  });

  it('signUp calls createUserWithEmailAndPassword', async () => {
    mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
      user: { displayName: null, email: 'new@b.com' },
    });
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signUp('new@b.com', 'pass123'));
    expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith({}, 'new@b.com', 'pass123');
  });

  it('signUp returns true on success', async () => {
    mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
      user: { displayName: null, email: 'new@b.com' },
    });
    const { result } = renderHook(() => useAuth());
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.signUp('new@b.com', 'pass123'); });
    expect(ok).toBe(true);
  });

  it('signUp returns false on failure', async () => {
    const err: any = new Error('already-in-use');
    err.code = 'auth/email-already-in-use';
    mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(err);
    const { result } = renderHook(() => useAuth());
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.signUp('dup@b.com', 'pass'); });
    expect(ok).toBe(false);
  });

  it('signUp sets signUpError on failure', async () => {
    const err: any = new Error('already-in-use');
    err.code = 'auth/email-already-in-use';
    mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(err);
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signUp('dup@b.com', 'pass'));
    expect(result.current.signUpError).toBeTruthy();
  });

  it('isSigningUp is false after signUp resolves', async () => {
    mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
      user: { displayName: null, email: 'x@b.com' },
    });
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signUp('x@b.com', 'pass'));
    expect(result.current.isSigningUp).toBe(false);
  });
});

describe('useAuth – forgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);
  });

  it('forgotPassword calls sendPasswordResetEmail', async () => {
    mockSendPasswordResetEmail.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.forgotPassword('x@b.com'));
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith({}, 'x@b.com');
  });

  it('forgotPassword sets forgotPasswordError on failure', async () => {
    const err: any = new Error('not-found');
    err.code = 'auth/user-not-found';
    mockSendPasswordResetEmail.mockRejectedValueOnce(err);
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.forgotPassword('ghost@b.com'));
    expect(result.current.forgotPasswordError).toBeTruthy();
  });

  it('isSendingReset is false after forgotPassword resolves', async () => {
    mockSendPasswordResetEmail.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.forgotPassword('x@b.com'));
    expect(result.current.isSendingReset).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// JUS-186 / JUS-187: form toggle state
// ---------------------------------------------------------------------------

describe('useAuth – form toggles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);
  });

  it('showSignUpForm defaults to false', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.showSignUpForm).toBe(false);
  });

  it('setShowSignUpForm toggles the flag', () => {
    const { result } = renderHook(() => useAuth());
    act(() => result.current.setShowSignUpForm(true));
    expect(result.current.showSignUpForm).toBe(true);
  });

  it('showForgotPasswordForm defaults to false', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.showForgotPasswordForm).toBe(false);
  });

  it('setShowForgotPasswordForm toggles the flag', () => {
    const { result } = renderHook(() => useAuth());
    act(() => result.current.setShowForgotPasswordForm(true));
    expect(result.current.showForgotPasswordForm).toBe(true);
  });
});
