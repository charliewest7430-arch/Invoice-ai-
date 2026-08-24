import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Receipt,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Zap,
  Lock,
  BarChart3,
  Users,
  FileText,
  Star,
  ChevronRight,
  X,
  CreditCard,
  Building2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { signIn, signUp, resetPasswordForEmail, enableDemoMode } = useAuth();
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot_password' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetFormState = (newMode: 'signin' | 'signup' | 'forgot_password' | null) => {
    setErrorMsg('');
    setPassword('');
    setConfirmPassword('');
    setResetEmailSent(false);
    setAuthModalMode(newMode);
  };

  const validateForm = (): string | null => {
    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail) {
      return 'Email address is required.';
    }
    if (!emailRegex.test(cleanEmail)) {
      return 'Please enter a valid email address.';
    }

    if (authModalMode === 'forgot_password') {
      return null;
    }

    if (!password) {
      return 'Password is required.';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }

    if (authModalMode === 'signup') {
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

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsSubmitting(true);

    if (authModalMode === 'signup') {
      console.info('[Signup Debug] 1. Signup button clicked', { email: email.trim() });
      console.info('[Signup Debug] 2. signUp() called');
      const res = await signUp(email.trim(), password, fullName.trim(), businessName.trim());
      console.info(`[Signup Debug] 7. signup result = ${JSON.stringify(res)}`);
      
      if (!res.success) {
        console.info(`[Signup Debug] 10. navigation decision = Stay on modal and display error: ${res.error}`);
        setErrorMsg(res.error || 'Failed to sign up');
      } else {
        console.info('[Signup Debug] 8. current auth state = Authenticated (session active)');
        console.info('[Signup Debug] 9. current application route/state = Dashboard');
        console.info('[Signup Debug] 10. navigation decision = Close auth modal and render Dashboard');
        resetFormState(null);
      }
    } else if (authModalMode === 'forgot_password') {
      try {
        const res = await resetPasswordForEmail(email.trim());
        if (res && !res.success && res.error) {
          setErrorMsg(res.error);
        } else {
          setResetEmailSent(true);
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to send reset link. Please try again.');
      }
    } else {
      console.info('[Auth Debug] Sign-in button clicked', { email: email.trim() });
      const res = await signIn(email.trim(), password);
      console.info('[Auth Debug] Sign-in response received:', res);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to sign in');
      } else {
        console.info('[Auth Debug] Sign-in successful. Closing auth modal and opening Dashboard.');
        resetFormState(null);
      }
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#f0f4f9] text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-200/80 sticky top-0 z-40 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="font-black text-lg tracking-tight text-slate-900">InvoiceFlow AI</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAuthModalMode('signin')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => enableDemoMode()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.02]"
            >
              Launch App Demo
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-16 lg:pt-24 lg:pb-20 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-7 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide uppercase shadow-2xs">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>AI-Powered Invoicing & Instant Payments</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Create and Manage Invoices with <span className="text-blue-600">InvoiceFlow AI</span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            Generate custom branded invoices in seconds, collect payments securely via Paystack, track client records, and get instant business intelligence powered by Gemini AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setAuthModalMode('signup')}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => enableDemoMode()}
              className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-bold rounded-2xl shadow-2xs transition-all"
            >
              Explore Live Demo
            </button>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Natural Language Invoicing</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Describe services in plain English and let Gemini AI craft structured line items, taxes, discounts, and terms automatically.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Seamless Paystack Payments</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Collect payments instantly with automated reconciliation, multi-currency pricing, and real-time payment confirmation status.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Real-Time Financial Insights</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Monitor monthly cash flow, invoice statuses, customer collections, and dynamic currency conversions in one unified dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-8 bg-white text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Receipt className="w-4 h-4 text-blue-600" />
            <span>InvoiceFlow AI</span>
          </div>
          <p>© {new Date().getFullYear()} InvoiceFlow AI. All rights reserved.</p>
        </div>
      </footer>

      {/* Auth Modal */}
      {authModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-slide-up">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {authModalMode === 'signup'
                    ? 'Create an Account'
                    : authModalMode === 'forgot_password'
                    ? 'Reset Password'
                    : 'Sign In to InvoiceFlow'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {authModalMode === 'signup'
                    ? 'Start generating invoices in seconds'
                    : authModalMode === 'forgot_password'
                    ? "We'll send a password recovery email"
                    : 'Access your invoices, clients, and revenue metrics'}
                </p>
              </div>
              <button
                onClick={() => resetFormState(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 font-medium">
                {errorMsg}
              </p>
            )}

            {authModalMode === 'forgot_password' ? (
              resetEmailSent ? (
                <div className="space-y-4 text-center py-2">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold leading-relaxed">
                    Check your email for a password reset link.
                  </div>
                  <button
                    type="button"
                    onClick={() => resetFormState('signin')}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAuthSubmit} className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Enter your email address and we'll send you a password reset link.
                  </p>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@example.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-500/20 transition-all mt-2 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending link...' : 'Send reset link'}
                  </button>

                  <div className="text-center pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => resetFormState('signin')}
                      className="text-xs text-blue-600 hover:underline font-bold"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              )
            ) : (
              <>
                <form onSubmit={handleAuthSubmit} className="space-y-3">
                  {authModalMode === 'signup' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Full Name *</label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. John Smith"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Business Name (Optional)</label>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="e.g. Smith Innovations"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                      placeholder="alex@example.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Password *</label>
                      {authModalMode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => resetFormState('forgot_password')}
                          className="text-[11px] text-blue-600 hover:underline font-bold"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>

                  {authModalMode === 'signup' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Confirm Password *</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        minLength={6}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        required
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-500/20 transition-all mt-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Processing...' : authModalMode === 'signup' ? 'Sign Up' : 'Sign In'}
                  </button>
                </form>

                <div className="text-center pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => resetFormState(authModalMode === 'signup' ? 'signin' : 'signup')}
                    className="text-xs text-blue-600 hover:underline font-bold"
                  >
                    {authModalMode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
