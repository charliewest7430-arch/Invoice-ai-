import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { PRO_MONTHLY, ENTERPRISE_MONTHLY, TRIAL_DAYS } from '../../types';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  X,
  Lock,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

interface AuthUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlan?: 'pro' | 'enterprise';
}

export const AuthUpgradeModal: React.FC<AuthUpgradeModalProps> = ({
  isOpen,
  onClose,
  targetPlan = 'pro',
}) => {
  const { signUp, signIn } = useAuth();
  const { setActivePage, showToast } = useApp();

  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const planTitle = targetPlan === 'enterprise' ? 'Enterprise' : 'Pro';
  const planPrice = targetPlan === 'enterprise' ? `$${ENTERPRISE_MONTHLY}/mo` : `$${PRO_MONTHLY}/mo`;

  const validateForm = (): string | null => {
    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail) {
      return 'Email address is required.';
    }
    if (!emailRegex.test(cleanEmail)) {
      return 'Please enter a valid email address.';
    }
    if (!password) {
      return 'Password is required.';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        return 'Please enter your full name.';
      }
      if (!confirmPassword) {
        return 'Please confirm your password.';
      }
      if (password !== confirmPassword) {
        return 'Passwords do not match.';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsSubmitting(true);

    // Save intended Pro upgrade action to sessionStorage and localStorage
    // so it persists across redirects and email confirmations
    try {
      sessionStorage.setItem('invoiceflow_pending_upgrade', targetPlan);
      localStorage.setItem('invoiceflow_pending_upgrade', targetPlan);
    } catch (e) {
      console.warn('Storage error:', e);
    }

    if (mode === 'signup') {
      const res = await signUp(email.trim(), password, fullName.trim(), businessName.trim());
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create account. Please try again.');
        setIsSubmitting(false);
        return;
      }

      showToast(`Account created! Continuing to ${planTitle} upgrade...`, 'success');
      onClose();
      setActivePage('billing');
    } else {
      const res = await signIn(email.trim(), password);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid email or password. Please try again.');
        setIsSubmitting(false);
        return;
      }

      showToast(`Signed in! Continuing to ${planTitle} upgrade...`, 'success');
      onClose();
      setActivePage('billing');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-slide-up relative overflow-hidden text-slate-800">
        {/* Subtle decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />

        {/* Header with Close */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Zap className="w-5 h-5 text-amber-500 fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {mode === 'signup' ? 'Upgrade to Pro' : 'Sign In to Upgrade'}
              </h2>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full inline-block mt-0.5">
                {planTitle} Plan • {planPrice}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clear Required UI Message */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-1">
          <p className="text-xs font-bold text-blue-900">
            {mode === 'signup'
              ? 'Create your free account to upgrade to Pro.'
              : 'Sign in with your account to continue to Pro.'}
          </p>
          <p className="text-[11px] text-blue-700 leading-relaxed">
            Create your InvoiceFlow account to continue to Pro and unlock unlimited invoices, custom branding, and 200 Gemini AI generations.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Business / Studio Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Apex Design Studio"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@business.com"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>

          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Confirm Password *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mt-2 hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{mode === 'signup' ? 'Create Account' : 'Sign In & Continue to Pro'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Secondary Switch Mode Option */}
        <div className="pt-3 border-t border-slate-100 text-center">
          {mode === 'signup' ? (
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg('');
                }}
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors ml-1"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg('');
                }}
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors ml-1"
              >
                Create Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
