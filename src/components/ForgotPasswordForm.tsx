import React, { useState } from 'react';
import { X, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
}

export default function ForgotPasswordForm({ onSubmit, onClose, isLoading, error }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(email);
      setIsSubmitted(true);
    } catch (err) {
      // Error is handled by parent component
      console.error('Forgot password error:', err);
    }
  };

  const displayError = error || localError;

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-2xl font-black text-slate-800">Check Your Email</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Success Content */}
          <div className="p-8 space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-600" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800">Password Reset Email Sent</h3>
              <p className="text-slate-600 font-medium">
                We've sent a password reset link to <span className="font-bold text-slate-800">{email}</span>
              </p>
              <p className="text-sm text-slate-500">
                Please check your inbox and follow the link to reset your password. The link will expire in 1 hour.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 btn-gradient text-white rounded-lg font-bold text-[15px] active:scale-[0.98] transition-transform"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-2xl font-black text-slate-800">Forgot Password?</h2>
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
          {/* Instructions */}
          <p className="text-sm text-slate-600 font-medium">
            Enter your email address and we'll send you a link to reset your password.
          </p>

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
                Sending Link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>

          {/* Back to Sign In Link */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[#8b5cf6] font-bold text-[13px] hover:text-purple-600 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
