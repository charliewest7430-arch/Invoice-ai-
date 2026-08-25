import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { trackViewContent } from '../../lib/tiktokPixel';
import {
  Receipt,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  X,
  CreditCard,
  Building2,
  ChevronDown,
  Globe2,
  Menu,
} from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  onNavigate?: (path: string) => void;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  activePath = '/',
  onNavigate,
}) => {
  const { signIn, signUp, resetPassword, enableDemoMode } = useAuth();

  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot_password' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigateTo = (path: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const resetFormState = (mode: 'signin' | 'signup' | 'forgot_password' | null) => {
    setAuthModalMode(mode);
    setErrorMsg('');
    setResetEmailSent(false);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    if (authModalMode === 'signin') {
      const res = await signIn(email.trim(), password);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to sign in');
      } else {
        setAuthModalMode(null);
      }
    } else if (authModalMode === 'signup') {
      const res = await signUp(email.trim(), password, fullName.trim(), businessName.trim());
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to sign up');
      } else {
        setAuthModalMode(null);
      }
    }
    setIsSubmitting(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    const res = await resetPassword(email.trim());
    if (res.success) {
      setResetEmailSent(true);
    } else {
      setErrorMsg(res.error || 'Failed to send reset email');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="border-b border-slate-200/80 sticky top-0 z-40 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/"
              onClick={(e) => navigateTo('/', e)}
              className="flex items-center gap-2.5 group cursor-pointer"
            >
              <div className="w-9 h-9 bg-blue-600 rounded-xl text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Receipt className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="font-black text-lg tracking-tight text-slate-900">InvoiceFlow</span>
            </a>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a
              href="/ai-invoice-generator"
              onClick={(e) => navigateTo('/ai-invoice-generator', e)}
              className={`hover:text-blue-600 transition-colors ${
                activePath === '/ai-invoice-generator' ? 'text-blue-600 font-extrabold' : ''
              }`}
            >
              AI Generator
            </a>
            <a
              href="/free-invoice-generator"
              onClick={(e) => navigateTo('/free-invoice-generator', e)}
              className={`hover:text-blue-600 transition-colors ${
                activePath === '/free-invoice-generator' ? 'text-blue-600 font-extrabold' : ''
              }`}
            >
              Free Generator
            </a>
            <a
              href="/invoice-generator"
              onClick={(e) => navigateTo('/invoice-generator', e)}
              className={`hover:text-blue-600 transition-colors ${
                activePath === '/invoice-generator' ? 'text-blue-600 font-extrabold' : ''
              }`}
            >
              Invoice Generator
            </a>
            <a
              href="/invoice-maker"
              onClick={(e) => navigateTo('/invoice-maker', e)}
              className={`hover:text-blue-600 transition-colors ${
                activePath === '/invoice-maker' ? 'text-blue-600 font-extrabold' : ''
              }`}
            >
              Invoice Maker
            </a>
            <a
              href="/freelance-invoice-generator"
              onClick={(e) => navigateTo('/freelance-invoice-generator', e)}
              className={`hover:text-blue-600 transition-colors ${
                activePath === '/freelance-invoice-generator' ? 'text-blue-600 font-extrabold' : ''
              }`}
            >
              Freelancers
            </a>
            <a
              href="/invoice-software-small-business"
              onClick={(e) => navigateTo('/invoice-software-small-business', e)}
              className={`hover:text-blue-600 transition-colors ${
                activePath === '/invoice-software-small-business' ? 'text-blue-600 font-extrabold' : ''
              }`}
            >
              Small Business
            </a>
            <a
              href="/online-invoice-generator"
              onClick={(e) => navigateTo('/online-invoice-generator', e)}
              className={`hover:text-blue-600 transition-colors ${
                activePath === '/online-invoice-generator' ? 'text-blue-600 font-extrabold' : ''
              }`}
            >
              Online Invoicing
            </a>
            <a
              href="/blog"
              onClick={(e) => navigateTo('/blog', e)}
              className={`hover:text-blue-600 transition-colors ${
                activePath === '/blog' ? 'text-blue-600 font-extrabold' : ''
              }`}
            >
              Blog
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setAuthModalMode('signin')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => enableDemoMode()}
              className="hidden sm:inline-flex px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Explore Live Demo
            </button>
            <button
              onClick={() => setAuthModalMode('signup')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              Get Started Free
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg">
            <a
              href="/"
              onClick={(e) => navigateTo('/', e)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
            >
              Home
            </a>
            <a
              href="/ai-invoice-generator"
              onClick={(e) => navigateTo('/ai-invoice-generator', e)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
            >
              AI Invoice Generator
            </a>
            <a
              href="/free-invoice-generator"
              onClick={(e) => navigateTo('/free-invoice-generator', e)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
            >
              Free Invoice Generator
            </a>
            <a
              href="/invoice-generator"
              onClick={(e) => navigateTo('/invoice-generator', e)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
            >
              Invoice Generator
            </a>
            <a
              href="/invoice-maker"
              onClick={(e) => navigateTo('/invoice-maker', e)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
            >
              Invoice Maker
            </a>
            <a
              href="/freelance-invoice-generator"
              onClick={(e) => navigateTo('/freelance-invoice-generator', e)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
            >
              Freelance Invoice Generator
            </a>
            <a
              href="/invoice-software-small-business"
              onClick={(e) => navigateTo('/invoice-software-small-business', e)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
            >
              Small Business Invoice Software
            </a>
            <a
              href="/online-invoice-generator"
              onClick={(e) => navigateTo('/online-invoice-generator', e)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
            >
              Online Invoice Generator
            </a>
            <a
              href="/blog"
              onClick={(e) => navigateTo('/blog', e)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
            >
              Invoicing Blog & Guides
            </a>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  enableDemoMode();
                }}
                className="w-full py-2.5 bg-slate-100 text-slate-800 font-bold text-xs rounded-xl"
              >
                Explore Live Demo
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalMode('signup');
                }}
                className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Create Your First Invoice Free
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Page Content Body */}
      <main className="flex-1">
        {React.cloneElement(children as React.ReactElement, {
          onOpenSignup: () => setAuthModalMode('signup'),
          onOpenSignin: () => setAuthModalMode('signin'),
          onOpenDemo: () => enableDemoMode(),
          onNavigate: navigateTo,
        })}
      </main>

      {/* Reusable Site Footer */}
      <footer className="border-t border-slate-200/80 py-12 bg-white text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Receipt className="w-5 h-5 text-blue-600" aria-hidden="true" />
                <span className="text-sm">InvoiceFlow</span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                AI invoice generator and invoicing software for freelancers, contractors, consultants, and small businesses worldwide.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                <Globe2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Multi-Currency: USD, CAD, GBP, EUR, AUD, NGN</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Product & Tools</h4>
              <ul className="space-y-2 text-slate-600">
                <li>
                  <a
                    href="/ai-invoice-generator"
                    onClick={(e) => navigateTo('/ai-invoice-generator', e)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    AI Invoice Generator
                  </a>
                </li>
                <li>
                  <a
                    href="/free-invoice-generator"
                    onClick={(e) => navigateTo('/free-invoice-generator', e)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Free Invoice Generator
                  </a>
                </li>
                <li>
                  <a
                    href="/invoice-generator"
                    onClick={(e) => navigateTo('/invoice-generator', e)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Online Invoice Generator
                  </a>
                </li>
                <li>
                  <a
                    href="/invoice-maker"
                    onClick={(e) => navigateTo('/invoice-maker', e)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Professional Invoice Maker
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Solutions</h4>
              <ul className="space-y-2 text-slate-600">
                <li>
                  <a
                    href="/freelance-invoice-generator"
                    onClick={(e) => navigateTo('/freelance-invoice-generator', e)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Freelancer Invoicing
                  </a>
                </li>
                <li>
                  <a
                    href="/invoice-software-small-business"
                    onClick={(e) => navigateTo('/invoice-software-small-business', e)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Small Business Invoicing
                  </a>
                </li>
                <li>
                  <a
                    href="/online-invoice-generator"
                    onClick={(e) => navigateTo('/online-invoice-generator', e)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Web-Based Billing
                  </a>
                </li>
                <li>
                  <a
                    href="/blog"
                    onClick={(e) => navigateTo('/blog', e)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Invoicing Blog & Guides
                  </a>
                </li>
                <li>
                  <a
                    href="/#pricing"
                    onClick={(e) => navigateTo('/#pricing', e)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Pricing Plans
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Get Started</h4>
              <p className="text-slate-500 text-xs">
                Try all Pro features free for 7 days. No credit card required.
              </p>
              <div className="pt-1 flex flex-col gap-2">
                <button
                  onClick={() => setAuthModalMode('signup')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all text-center cursor-pointer"
                >
                  Create First Invoice Free
                </button>
                <button
                  onClick={() => enableDemoMode()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all text-center cursor-pointer"
                >
                  Explore Live Demo
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
            <p>© {new Date().getFullYear()} InvoiceFlow. All rights reserved.</p>
            <p>AI Invoice Generator & Invoicing Software</p>
          </div>
        </div>
      </footer>

      {/* Shared Auth Modal */}
      {authModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {authModalMode === 'signup'
                    ? 'Create Your Account'
                    : authModalMode === 'forgot_password'
                    ? 'Reset Password'
                    : 'Sign In to InvoiceFlow'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {authModalMode === 'signup'
                    ? 'Start generating invoices in seconds with your 7-day free trial'
                    : authModalMode === 'forgot_password'
                    ? "We'll send a password recovery email"
                    : 'Access your invoices, clients, and revenue metrics'}
                </p>
              </div>
              <button
                onClick={() => resetFormState(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {authModalMode === 'forgot_password' ? (
              resetEmailSent ? (
                <div className="space-y-4 text-center">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs space-y-1">
                    <p className="font-bold">Password Reset Link Sent!</p>
                    <p>Check your email for instructions to reset your password.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => resetFormState('signin')}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Account Email</label>
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-500/20 transition-all mt-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Sending link...' : 'Send reset link'}
                  </button>
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => resetFormState('signin')}
                      className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              )
            ) : (
              <>
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authModalMode === 'signup' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Jane Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Business Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Acme Studio"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Work Email</label>
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Password</label>
                      {authModalMode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => resetFormState('forgot_password')}
                          className="text-[11px] text-blue-600 hover:underline font-bold cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-500/20 transition-all mt-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Processing...' : authModalMode === 'signup' ? 'Create Your Account' : 'Sign In'}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => resetFormState(authModalMode === 'signup' ? 'signin' : 'signup')}
                    className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
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
