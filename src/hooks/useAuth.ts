import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseAuthReturn {
  // State
  authUser: any;
  authError: string | null;
  isAuthLoading: boolean;
  showSignUpForm: boolean;
  signUpError: string | null;
  isSigningUp: boolean;
  showForgotPasswordForm: boolean;
  forgotPasswordError: string | null;
  isSendingReset: boolean;

  // Setters for form visibility (App.tsx still needs direct control)
  setShowSignUpForm: (v: boolean) => void;
  setShowForgotPasswordForm: (v: boolean) => void;
  setForgotPasswordError: (v: string | null) => void;

  // Handlers
  login: () => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Error-code → human message helpers (mirrors App.tsx logic)
// ---------------------------------------------------------------------------

function loginErrorMessage(code: string, fallback: string): string {
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-email':
      return 'Invalid email format';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later.';
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    default:
      return fallback || 'Authentication failed';
  }
}

function signUpErrorMessage(code: string, fallback: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Invalid email format.';
    case 'auth/operation-not-allowed':
      return 'Account creation is not enabled. Please contact support.';
    default:
      return fallback || 'Account creation failed';
  }
}

function resetErrorMessage(code: string, fallback: string): string {
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/invalid-email':
      return 'Invalid email format.';
    case 'auth/too-many-requests':
      return 'Too many requests. Please try again later.';
    default:
      return fallback || 'Failed to send reset email';
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): UseAuthReturn {
  const [authUser, setAuthUser] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Sign-up form state
  const [showSignUpForm, setShowSignUpForm] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Forgot-password form state
  const [showForgotPasswordForm, setShowForgotPasswordForm] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Subscribe to Firebase auth state on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setAuthUser(fbUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ------------------------------------------------------------------
  // JUS-179: Google login / logout
  // ------------------------------------------------------------------

  const login = async (): Promise<void> => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google login error:', error);
      setAuthError(error?.message || 'Google sign-in failed');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  };

  // ------------------------------------------------------------------
  // JUS-182: Email/password sign-in (register)
  // ------------------------------------------------------------------

  const register = async (email: string, password: string): Promise<void> => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      const msg = loginErrorMessage(error.code, error.message);
      setAuthError(msg);
      console.error('Auth error:', error.code, error.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // JUS-185: Sign-up (create account) and forgot password
  // ------------------------------------------------------------------

  const signUp = async (email: string, password: string): Promise<void> => {
    setSignUpError(null);
    setIsSigningUp(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setShowSignUpForm(false);
    } catch (error: any) {
      const msg = signUpErrorMessage(error.code, error.message);
      setSignUpError(msg);
      console.error('Sign up error:', error.code, error.message);
    } finally {
      setIsSigningUp(false);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    setForgotPasswordError(null);
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      const msg = resetErrorMessage(error.code, error.message);
      setForgotPasswordError(msg);
      console.error('Forgot password error:', error.code, error.message);
    } finally {
      setIsSendingReset(false);
    }
  };

  return {
    authUser,
    authError,
    isAuthLoading,
    showSignUpForm,
    signUpError,
    isSigningUp,
    showForgotPasswordForm,
    forgotPasswordError,
    isSendingReset,
    setShowSignUpForm,
    setShowForgotPasswordForm,
    setForgotPasswordError,
    login,
    logout,
    register,
    signUp,
    forgotPassword,
  };
}
