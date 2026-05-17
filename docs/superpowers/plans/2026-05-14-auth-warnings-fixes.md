# Auth Warnings Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix critical authentication security issue and implement missing sign-up and password reset flows identified by acceptance tests.

**Architecture:** Three independent auth features: (1) Fix critical email/password auth bypass by calling Firebase signInWithEmailAndPassword(), (2) Implement sign-up form and flow with email/password creation, (3) Implement forgot password reset flow. Each task is independent and can be reviewed/tested separately before moving to the next.

**Tech Stack:** React, Firebase Auth, TypeScript, Vite, Tailwind CSS

**Priority Order:** Task 1 (Critical Security Fix) → Task 2 (Sign-Up) → Task 3 (Forgot Password)

---

## File Structure

### Files to Modify
- `src/App.tsx` - Main auth orchestration component
  - `handleRegister()` - Fix to call Firebase signInWithEmailAndPassword
  - Add `handleSignUp()` - New sign-up handler
  - Add `handleForgotPassword()` - New forgot password handler
  - Add state for sign-up form visibility
  - Add state for forgot password form visibility

- `src/index.css` - Add styles for new modals/forms

### Files to Create
- `src/components/SignUpForm.tsx` - New sign-up form component
- `src/components/ForgotPasswordForm.tsx` - New forgot password form component

---

## Task 1: Fix Critical Email/Password Auth Bypass

**Files:**
- Modify: `src/App.tsx:handleRegister()` (around line 50-70)
- Modify: `test.js` - Add test to verify auth is actually called

**Context:** 
The current `handleRegister()` function only checks if email is non-empty but never calls Firebase's `signInWithEmailAndPassword()`. This allows ANY valid-format email with ANY password to bypass authentication. This is a critical security issue that must be fixed first.

**Current buggy code (pseudo):**
```typescript
const handleRegister = async (email: string, password: string) => {
  if (!email.trim()) {
    setError("Email is required");
    return;
  }
  // ❌ Missing: Firebase auth call here!
  // ❌ Missing: Password validation
  setUser({ name: email, email });
  setStep(2);
};
```

- [ ] **Step 1: Find the handleRegister function in App.tsx**

Locate the `handleRegister` function. It should be around lines 50-70 and look like the pseudo-code above (only checks if email is non-empty).

Run: `grep -n "handleRegister" src/App.tsx`
Expected: Shows line number where function is defined

- [ ] **Step 2: Read the full handleRegister function and understand current flow**

Read the entire function to see:
- What parameters it accepts (email, password)
- What validation it currently does
- How it sets user state
- How it advances to step 2

Run: `sed -n '50,80p' src/App.tsx` (adjust line numbers based on Step 1 output)
Expected: Full function code

- [ ] **Step 3: Replace handleRegister with proper Firebase auth call**

Update the function to actually call Firebase's `signInWithEmailAndPassword()`. Include error handling for:
- Wrong password
- User not found
- Invalid email format
- Firebase service errors

```typescript
const handleRegister = async (email: string, password: string) => {
  if (!email.trim()) {
    setError("Email is required");
    return;
  }
  if (!password.trim()) {
    setError("Password is required");
    return;
  }
  
  setError("");
  setLoading(true);
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    setUser({ 
      name: user.displayName || email.split('@')[0],
      email: user.email || email 
    });
    setStep(2);
  } catch (error: any) {
    setLoading(false);
    
    // Map Firebase error codes to user-friendly messages
    if (error.code === 'auth/user-not-found') {
      setError("No account found with this email. Please sign up first.");
    } else if (error.code === 'auth/wrong-password') {
      setError("Incorrect password. Please try again.");
    } else if (error.code === 'auth/invalid-email') {
      setError("Invalid email format.");
    } else if (error.code === 'auth/too-many-requests') {
      setError("Too many failed login attempts. Please try again later.");
    } else {
      setError(error.message || "Failed to sign in. Please try again.");
    }
  }
};
```

- [ ] **Step 4: Verify import of signInWithEmailAndPassword**

Check that `signInWithEmailAndPassword` is imported from Firebase:

Run: `grep "signInWithEmailAndPassword" src/App.tsx`

If not present, add to imports:
```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';
```

- [ ] **Step 5: Test the fix manually in browser**

1. Navigate to http://localhost:3002
2. Try signing in with:
   - Valid email + wrong password → Should see "Incorrect password" error
   - Completely made-up email + any password → Should see "No account found" error
   - Valid format email (e.g., test@example.com) but non-existent → Should see "No account found"

Expected: Each attempt properly rejected with appropriate error message

- [ ] **Step 6: Run the acceptance test suite to verify fix**

Run: `npm test`

Expected: Test TC-FAIL-04 should now show ✅ PASS instead of ⚠️ WARN

Look for: "TC-FAIL-04: Wrong credentials correctly rejected"

- [ ] **Step 7: Commit the fix**

```bash
git add src/App.tsx
git commit -m "fix(auth): call Firebase signInWithEmailAndPassword in handleRegister - fixes critical auth bypass"
```

---

## Task 2: Implement Sign-Up Flow

**Files:**
- Create: `src/components/SignUpForm.tsx`
- Modify: `src/App.tsx` - Add sign-up state and handler
- Modify: `src/index.css` - Add modal styles if needed

**Context:**
Currently there's a "Sign up" link but:
1. No handler when clicked
2. No sign-up form appears
3. No account creation flow

We need to implement a full sign-up flow that:
- Shows a form with email, password, confirm password
- Creates a new Firebase account
- Validates input
- Handles errors (email already exists, weak password, etc.)
- Automatically signs in the user after creation

- [ ] **Step 1: Create SignUpForm component**

Create file `src/components/SignUpForm.tsx`:

```typescript
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface SignUpFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
  error?: string;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSubmit, onClose, isLoading = false, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    // Client-side validation
    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }
    if (!password.trim()) {
      setLocalError('Password is required');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      await onSubmit(email, password);
    } catch (err: any) {
      setLocalError(err.message || 'Sign up failed');
    }
  };

  const displayError = error || localError;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-900">Create Account</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {displayError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm font-medium">
              {displayError}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8c50f0]"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8c50f0]"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8c50f0]"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#8c50f0] text-white font-black py-3 rounded-lg hover:bg-[#7a3fd6] disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUpForm;
```

- [ ] **Step 2: Add sign-up state to App.tsx**

Add these state variables near the top of the App component (after existing auth state):

```typescript
const [showSignUpForm, setShowSignUpForm] = useState(false);
const [signUpError, setSignUpError] = useState('');
const [isSigningUp, setIsSigningUp] = useState(false);
```

- [ ] **Step 3: Create handleSignUp function in App.tsx**

Add this function (near handleRegister):

```typescript
const handleSignUp = async (email: string, password: string) => {
  setSignUpError('');
  setIsSigningUp(true);

  try {
    // Create new user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Automatically sign in the new user
    setUser({
      name: user.displayName || email.split('@')[0],
      email: user.email || email
    });
    
    setShowSignUpForm(false);
    setStep(2);
  } catch (error: any) {
    setIsSigningUp(false);
    
    // Map Firebase error codes
    if (error.code === 'auth/email-already-in-use') {
      setSignUpError('This email is already registered. Please sign in instead.');
    } else if (error.code === 'auth/weak-password') {
      setSignUpError('Password is too weak. Use at least 6 characters.');
    } else if (error.code === 'auth/invalid-email') {
      setSignUpError('Invalid email format.');
    } else {
      setSignUpError(error.message || 'Failed to create account. Please try again.');
    }
  }
};
```

- [ ] **Step 4: Add createUserWithEmailAndPassword import**

Add to imports in App.tsx:

```typescript
import { createUserWithEmailAndPassword } from 'firebase/auth';
```

- [ ] **Step 5: Find the "Sign up" button/link and add onClick handler**

Search for the "Sign up" button in the JSX (likely near the "Sign In" button):

Run: `grep -n "Sign up" src/App.tsx`

Update the button to include onClick:

```typescript
<button 
  onClick={() => setShowSignUpForm(true)}
  className="text-[#8c50f0] hover:underline font-bold text-sm"
>
  Sign up
</button>
```

- [ ] **Step 6: Render SignUpForm component in App.tsx JSX**

Add this to the JSX (in the return statement, after the main form):

```typescript
{showSignUpForm && (
  <SignUpForm
    onSubmit={handleSignUp}
    onClose={() => setShowSignUpForm(false)}
    isLoading={isSigningUp}
    error={signUpError}
  />
)}
```

- [ ] **Step 7: Test sign-up flow in browser**

1. Navigate to http://localhost:3002
2. Click "Sign up" link
3. Verify modal appears with email, password, confirm password fields
4. Try scenarios:
   - Empty fields → Should show "required" errors
   - Mismatched passwords → Should show "Passwords do not match"
   - Weak password (< 6 chars) → Should show error
   - Valid new email + password → Should create account and advance to questionnaire
   - Existing email → Should show "email already in use" error

Expected: Full sign-up flow works end-to-end

- [ ] **Step 8: Run acceptance tests**

Run: `npm test`

Expected: Test "TC-FAIL-05: Sign-Up flow appears on Sign up click" should now show ✅ PASS

- [ ] **Step 9: Commit**

```bash
git add src/components/SignUpForm.tsx src/App.tsx
git commit -m "feat(auth): implement sign-up form and flow with Firebase account creation"
```

---

## Task 3: Implement Forgot Password Flow

**Files:**
- Create: `src/components/ForgotPasswordForm.tsx`
- Modify: `src/App.tsx` - Add forgot password state and handler
- Modify: `src/index.css` - Add modal styles if needed

**Context:**
Currently there's a "Forgot Password?" link but no handler. We need to implement a password reset flow that:
- Shows a form requesting email address
- Sends a password reset email via Firebase
- Shows confirmation message
- Links back to sign-in

Note: This sends a real email to the user's inbox with a reset link. Firebase handles the actual password reset via email link.

- [ ] **Step 1: Create ForgotPasswordForm component**

Create file `src/components/ForgotPasswordForm.tsx`:

```typescript
import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
  error?: string;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSubmit, onClose, isLoading = false, error }) => {
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }

    try {
      await onSubmit(email);
      setSubmitted(true);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to send reset email');
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Check Your Email</h2>
          <p className="text-slate-600 mb-6">
            We sent a password reset link to <strong>{email}</strong>. 
            Click the link in the email to reset your password.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-[#8c50f0] text-white font-black py-3 rounded-lg hover:bg-[#7a3fd6]"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-900">Reset Password</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <p className="text-slate-600 text-sm mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || localError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm font-medium">
              {error || localError}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8c50f0]"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#8c50f0] text-white font-black py-3 rounded-lg hover:bg-[#7a3fd6] disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-slate-600 font-bold py-2 hover:text-slate-900"
          >
            Back to Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
```

- [ ] **Step 2: Add forgot password state to App.tsx**

Add these state variables (near other auth state):

```typescript
const [showForgotPasswordForm, setShowForgotPasswordForm] = useState(false);
const [forgotPasswordError, setForgotPasswordError] = useState('');
const [isSendingReset, setIsSendingReset] = useState(false);
```

- [ ] **Step 3: Create handleForgotPassword function in App.tsx**

Add this function:

```typescript
const handleForgotPassword = async (email: string) => {
  setForgotPasswordError('');
  setIsSendingReset(true);

  try {
    await sendPasswordResetEmail(auth, email);
    // Form will show success state automatically
  } catch (error: any) {
    setIsSendingReset(false);
    
    if (error.code === 'auth/user-not-found') {
      setForgotPasswordError('No account found with this email.');
    } else if (error.code === 'auth/invalid-email') {
      setForgotPasswordError('Invalid email format.');
    } else if (error.code === 'auth/too-many-requests') {
      setForgotPasswordError('Too many requests. Please try again later.');
    } else {
      setForgotPasswordError(error.message || 'Failed to send reset email.');
    }
  }
};
```

- [ ] **Step 4: Add sendPasswordResetEmail import**

Add to imports in App.tsx:

```typescript
import { sendPasswordResetEmail } from 'firebase/auth';
```

- [ ] **Step 5: Find "Forgot Password?" button and add onClick**

Search for the "Forgot Password?" button (near sign-in form):

Run: `grep -n "Forgot Password" src/App.tsx`

Update it to include onClick:

```typescript
<button
  onClick={() => setShowForgotPasswordForm(true)}
  className="text-[#8c50f0] hover:underline font-bold text-sm"
>
  Forgot Password?
</button>
```

- [ ] **Step 6: Render ForgotPasswordForm component in App.tsx**

Add to JSX (in the return statement):

```typescript
{showForgotPasswordForm && (
  <ForgotPasswordForm
    onSubmit={handleForgotPassword}
    onClose={() => {
      setShowForgotPasswordForm(false);
      setForgotPasswordError('');
    }}
    isLoading={isSendingReset}
    error={forgotPasswordError}
  />
)}
```

- [ ] **Step 7: Test forgot password flow in browser**

1. Navigate to http://localhost:3002
2. Click "Forgot Password?" link
3. Verify modal appears with email field
4. Try scenarios:
   - Empty email → Should show "required" error
   - Non-existent email → Should show error or success (Firebase behavior varies)
   - Valid email → Should show "Check your email" confirmation
   - Click "Back to Sign In" → Should close modal and return to login

Expected: Form appears, submits, shows confirmation message

Note: To fully test password reset, you'd need to check an actual email inbox. For now, just verify the modal and form behavior.

- [ ] **Step 8: Run acceptance tests**

Run: `npm test`

Expected: All auth tests should pass. "Forgot Password link present" warning should now be resolved.

- [ ] **Step 9: Commit**

```bash
git add src/components/ForgotPasswordForm.tsx src/App.tsx
git commit -m "feat(auth): implement forgot password flow with Firebase password reset email"
```

---

## Summary: Execution Order

**Task 1 (Critical Security Fix - Do First):** Fix email/password auth bypass
- Duration: ~15-20 minutes
- Impact: Prevents unauthorized access, fixes critical test failure
- Blocker: Must complete before testing other auth features

**Task 2 (Sign-Up Flow - Do Second):** Implement sign-up form and account creation
- Duration: ~30-40 minutes  
- Impact: Users can now create new accounts instead of only signing in
- Depends on: Task 1 (to verify new accounts work properly)

**Task 3 (Password Reset - Do Third):** Implement forgot password flow
- Duration: ~25-30 minutes
- Impact: Users can reset forgotten passwords
- Independent: Can be done in any order, but makes sense last as lowest priority

---

## Testing & Verification

After completing all tasks, run the full acceptance test suite:

```bash
npm test
```

Expected output:
- ✅ All 16+ tests should pass
- ❌ Zero warnings (all 4 warnings fixed)
- 📄 acceptance_report.html generated with full results

---

**Plan complete and saved.** Two execution options available:

**Option 1: Subagent-Driven (Recommended)** - I dispatch a fresh subagent per task with review checkpoints between tasks. Fast iteration, clear progress tracking.

**Option 2: Inline Execution** - Execute tasks in this session sequentially. All work in one continuous flow.

Which approach would you prefer?