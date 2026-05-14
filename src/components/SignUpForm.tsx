import React, { useState } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';

interface SignUpFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
}

export default function SignUpForm({ onSubmit, onClose, isLoading, error }: SignUpFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    setLocalError(null);

    if (!email.trim()) {
      setLocalError('Email is required');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('Please enter a valid email address');
      return false;
    }

    if (!password) {
      setLocalError('Password is required');
      return false;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return false;
    }

    if (!confirmPassword) {
      setLocalError('Please confirm your password');
      return false;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(email, password);
    } catch (err) {
      // Error is handled by parent component
      console.error('Sign up error:', err);
    }
  };

  const displayError = error || localError;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-2xl font-black text-slate-800">Create Account</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isLoading}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-[#8c50f0] focus:ring-1 focus:ring-purple-300 transition-all outline-none text-[15px] font-medium text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              disabled={isLoading}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-[#8c50f0] focus:ring-1 focus:ring-purple-300 transition-all outline-none text-[15px] font-medium text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              disabled={isLoading}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-[#8c50f0] focus:ring-1 focus:ring-purple-300 transition-all outline-none text-[15px] font-medium text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          {/* Error Message */}
          {displayError && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-700">{displayError}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-6 btn-gradient text-white rounded-lg font-bold text-[15px] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

          {/* Sign In Link */}
          <div className="text-center pt-2">
            <span className="text-slate-400 font-medium text-[13px]">Already have an account? </span>
            <button
              type="button"
              onClick={onClose}
              className="text-[#8b5cf6] font-bold text-[13px] hover:text-purple-600 transition-colors"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
