import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Receipt, Lock, CheckCircle2, ArrowLeft, KeyRound, AlertCircle } from 'lucide-react';

interface ResetPasswordPageProps {
  onBackToSignIn?: () => void;
  initialStep?: 'request' | 'update';
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  onBackToSignIn,
  initialStep,
}) => {
  const { resetPasswordForEmail, updatePassword, signOut, isPasswordRecovery, setIsPasswordRecovery } = useAuth();

  const [step, setStep] = useState<'request' | 'sent' | 'update' | 'success'>(() => {
    if (initialStep) return initialStep;
    if (
      isPasswordRecovery ||
      window.location.hash.includes('type=recovery') ||
      window.location.search.includes('type=recovery') ||
      window.location.hash.includes('access_token=') ||
      window.location.search.includes('code=')
    ) {
      return 'update';
    }
    return 'request';
  });

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (
      isPasswordRecovery ||
      window.location.hash.includes('type=recovery') ||
      window.location.search.includes('type=recovery') ||
      window.location.hash.includes('access_token=') ||
      window.location.search.includes('code=')
    ) {
      setStep((prev) => (prev === 'success' ? 'success' : 'update'));
      setIsPasswordRecovery(true);
    }
  }, [isPasswordRecovery, setIsPasswordRecovery]);

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !email.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPasswordForEmail(email.trim());
      if (res && !res.success && res.error) {
        setErrorMsg(res.error);
      } else {
        setStep('sent');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword) {
      setErrorMsg('Password is required.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updatePassword(newPassword);
      if (res.success) {
        setStep('success');
      } else {
        setErrorMsg(res.error || 'Failed to update password. Your reset link may be invalid or expired.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred while updating your password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToSignIn = async () => {
    await signOut();
    setIsPasswordRecovery(false);
    window.history.replaceState({}, document.title, window.location.pathname === '/reset-password' ? '/' : window.location.pathname);
    if (onBackToSignIn) {
      onBackToSignIn();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f9] text-slate-800 flex flex-col items-center justify-center p-4 sm:p-6 font-sans selection:bg-blue-600 selection:text-white">
      {/* Header Logo */}
      <div className="mb-6 flex items-center gap-3 relative z-10">
        <div className="w-10 h-10 bg-blue-600 rounded-2xl text-white flex items-center justify-center shadow-md shadow-blue-500/20">
          <Receipt className="w-5 h-5" />
        </div>
        <span className="font-black text-xl tracking-tight text-slate-900">InvoiceFlow AI</span>
      </div>

      {/* Main Container Card */}
      <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 animate-slide-up">
        
        {/* STEP 1: Request Password Reset */}
        {step === 'request' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 mb-3 shadow-2xs">
                <KeyRound className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Reset your password</h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Enter the email address associated with your account and we will send you a link to reset your password.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? 'Sending link...' : 'Send reset link'}
              </button>
            </form>

            <div className="pt-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={handleGoToSignIn}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-bold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Email Sent Confirmation */}
        {step === 'sent' && (
          <div className="space-y-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 mx-auto shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Check your email</h1>
              <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                Check your email for a password reset link.
              </p>
              <p className="text-xs text-slate-500 pt-1">
                If an account exists for <span className="text-slate-800 font-bold">{email || 'your email'}</span>, you will receive password reset instructions shortly.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleGoToSignIn}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Update Password */}
        {step === 'update' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 mb-3 shadow-2xs">
                <Lock className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Create new password</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Please enter a new password for your account. Must be at least 8 characters long.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
                  required
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                {isSubmitting ? 'Updating...' : 'Update password'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 4: Password Updated Success */}
        {step === 'success' && (
          <div className="space-y-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 mx-auto shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Password Reset Complete</h1>
              <p className="text-xs sm:text-sm text-emerald-700 font-bold bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                Password updated successfully.
              </p>
              <p className="text-xs text-slate-500">
                You can now sign in with your new password.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleGoToSignIn}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-500/20 transition-all"
              >
                Sign in
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
