import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { trackViewContent } from '../lib/tiktokPixel';
import { SeoHead } from '../components/common/SeoHead';
import { PRO_MONTHLY, ENTERPRISE_MONTHLY, TRIAL_DAYS } from '../types';
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
  ChevronDown,
  X,
  CreditCard,
  Building2,
  Globe2,
  Clock,
  Repeat,
  DollarSign,
  TrendingUp,
  Briefcase,
  Layers,
  Send,
  HelpCircle,
  Menu,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate?: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
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
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigateTo = (path: string, e?: React.MouseEvent) => {
    if (path.startsWith('#')) return;
    if (e) e.preventDefault();
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  useEffect(() => {
    trackViewContent({
      content_id: 'landing_page',
      content_name: 'InvoiceFlow AI Landing Page & Features',
      content_type: 'product',
    });
  }, []);

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
        setErrorMsg(res.error || 'Incorrect email or password. Please try again.');
      } else {
        console.info('[Auth Debug] Sign-in successful. Closing auth modal and opening Dashboard.');
        resetFormState(null);
      }
    }

    setIsSubmitting(false);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqItems = [
    {
      question: 'What is an AI invoice generator?',
      answer:
        'An AI invoice generator uses natural language processing to convert simple descriptions of your services into complete, professionally structured invoices. With InvoiceFlow, you simply describe the work completed, and our AI automatically organizes line items, calculates taxes, applies discounts, and configures appropriate payment terms in seconds.',
    },
    {
      question: 'Can I create professional invoices online?',
      answer:
        'Yes! InvoiceFlow is a comprehensive online invoice generator. You can customize invoice layouts using multiple designer templates, add your business logo and payment instructions, export print-ready PDF invoices, and send them directly to your clients from any web browser.',
    },
    {
      question: 'Is InvoiceFlow suitable for freelancers?',
      answer:
        'InvoiceFlow is purpose-built for freelancers, solo contractors, and creators. It streamlines client management, speeds up invoicing with AI assistance, supports multi-currency billing for international clients, and automates overdue payment reminders so you can focus on your work.',
    },
    {
      question: 'Is InvoiceFlow suitable for small businesses?',
      answer:
        'Yes. Small businesses and agencies can organize a centralized product and service catalog, set up recurring invoices for monthly retainers, record operating expenses with receipt attachments, issue payment receipts, and monitor financial performance through real-time P&L analytics.',
    },
    {
      question: 'Can I invoice clients internationally?',
      answer:
        'Yes. InvoiceFlow enables you to invoice clients anywhere in the world. You can create invoices and issue receipts in multiple major currencies, including US Dollars (USD), British Pounds (GBP), Euros (EUR), Canadian Dollars (CAD), Australian Dollars (AUD), and Nigerian Naira (NGN).',
    },
    {
      question: 'Can I automate payment reminders?',
      answer:
        'Yes. InvoiceFlow includes an automated payment reminder engine that allows you to configure customizable schedules for initial reminders, second reminders, and final overdue notices, helping you collect outstanding payments promptly without awkward manual follow-ups.',
    },
    {
      question: 'Can I create recurring invoices?',
      answer:
        'Yes. You can schedule recurring invoices with weekly, monthly, quarterly, or yearly frequencies. Recurring invoices automatically generate on their scheduled dates and can send email notifications to clients upon creation.',
    },
    {
      question: 'Does InvoiceFlow have a free plan or trial?',
      answer:
        `Yes. New accounts start on our Free Starter plan with ${TRIAL_DAYS} days of complimentary access to all Pro features. You can continue with the Free plan or upgrade anytime to our Pro plan ($${PRO_MONTHLY}/month) or Enterprise plan ($${ENTERPRISE_MONTHLY}/month).`,
    },
  ];

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'InvoiceFlow',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
    },
    description:
      'AI invoice generator for freelancers and small businesses. Create professional invoices in seconds, automate reminders, manage clients, and track expenses.',
    mainEntity: {
      '@type': 'FAQPage',
      mainEntity: faqItems.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      <SeoHead
        title="AI Invoice Generator for Freelancers & Small Businesses | InvoiceFlow"
        description="Create professional invoices in seconds with InvoiceFlow's AI invoice generator. Automated reminders, multi-currency billing, client management, and expense tracking."
        canonicalUrl="https://invoiceflow.com/"
        schemaJson={schemaData}
      />

      {/* Navigation Header */}
      <header className="border-b border-slate-200/80 sticky top-0 z-40 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/"
              onClick={(e) => navigateTo('/', e)}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 bg-blue-600 rounded-xl text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Receipt className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="font-black text-lg tracking-tight text-slate-900">InvoiceFlow</span>
            </a>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-bold text-slate-600">
            <a
              href="/ai-invoice-generator"
              onClick={(e) => navigateTo('/ai-invoice-generator', e)}
              className="hover:text-blue-600 transition-colors"
            >
              AI Generator
            </a>
            <a
              href="/free-invoice-generator"
              onClick={(e) => navigateTo('/free-invoice-generator', e)}
              className="hover:text-blue-600 transition-colors"
            >
              Free Generator
            </a>
            <a
              href="/invoice-generator"
              onClick={(e) => navigateTo('/invoice-generator', e)}
              className="hover:text-blue-600 transition-colors"
            >
              Invoice Generator
            </a>
            <a
              href="/invoice-maker"
              onClick={(e) => navigateTo('/invoice-maker', e)}
              className="hover:text-blue-600 transition-colors"
            >
              Invoice Maker
            </a>
            <a
              href="/freelance-invoice-generator"
              onClick={(e) => navigateTo('/freelance-invoice-generator', e)}
              className="hover:text-blue-600 transition-colors"
            >
              Freelancers
            </a>
            <a
              href="/invoice-software-small-business"
              onClick={(e) => navigateTo('/invoice-software-small-business', e)}
              className="hover:text-blue-600 transition-colors"
            >
              Small Business
            </a>
            <a
              href="/blog"
              onClick={(e) => navigateTo('/blog', e)}
              className="hover:text-blue-600 transition-colors"
            >
              Blog
            </a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">
              FAQ
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

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg">
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
              Online Invoice Generator
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
              Online Invoicing
            </a>
            <a
              href="/blog"
              onClick={(e) => navigateTo('/blog', e)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
            >
              Invoicing Blog & Guides
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
            >
              Pricing
            </a>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-14 pb-16 lg:pt-20 lg:pb-20 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide uppercase shadow-2xs">
            <Sparkles className="w-4 h-4 text-blue-600" aria-hidden="true" />
            <span>AI-Powered Invoicing & Instant Client Billing</span>
          </div>

          {/* Primary H1 */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            AI Invoice Generator for Freelancers & Small Businesses
          </h1>

          {/* Supporting Hero Subheading */}
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            Create professional invoices in seconds with AI. Manage clients, send invoices, automate payment reminders, create recurring invoices, and get paid faster — all from one simple invoicing platform.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setAuthModalMode('signup')}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer"
            >
              <span>Create Your First Invoice Free</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              onClick={() => enableDemoMode()}
              className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-bold rounded-2xl shadow-2xs transition-all cursor-pointer"
            >
              Explore Live Demo
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-3 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              Free 7-Day Pro Trial
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              No Credit Card Required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              Instant PDF Downloads
            </span>
          </div>
        </div>
      </section>

      {/* Short Product Explanation */}
      <section className="bg-white border-y border-slate-200/80 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-slate-700 text-base sm:text-lg font-normal leading-relaxed">
            <strong className="font-semibold text-slate-900">InvoiceFlow</strong> is an AI-powered invoicing platform designed for freelancers, consultants, agencies, contractors, and small businesses. Create professional invoices, manage clients, automate payment reminders, and accept payments from clients around the world.
          </p>
        </div>
      </section>

      {/* How InvoiceFlow Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            How InvoiceFlow Works
          </h2>
          <p className="text-slate-600 text-sm">
            Create, send, and get paid for your work in three straightforward steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900">Create your invoice</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Add your client and service details or use InvoiceFlow’s AI tools to generate invoice line items quickly.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900">Send it to your client</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Create a professional invoice and send or share it with your client.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900">Get paid faster</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Use available payment options and automatic payment reminders to make it easier for clients to pay.
            </p>
          </div>
        </div>
      </section>

      {/* Built For Section */}
      <section id="built-for" className="bg-slate-100/60 border-y border-slate-200/80 py-16 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Built for Freelancers and Small Businesses
            </h2>
            <p className="text-slate-600 text-sm">
              Smart invoice software tailored to meet the day-to-day billing requirements of modern professionals and teams.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Freelancers</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Generate polished invoices in seconds for design, development, writing, or marketing gigs, complete with instant PDF generation and multi-currency billing.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Consultants</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Bill clients accurately for strategy hours, advisory retainers, and milestone projects with custom branding, payment terms, and client history tracking.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Agencies</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Streamline client roster invoicing, automate recurring retainer cycles, track company expenses, and review monthly cashflow from a single workspace.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Layers className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Contractors</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Create clear itemized invoices for materials and labor, manage client records, and send automatic payment reminders to keep project cashflow healthy.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Creators</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Bill brand sponsors, production partners, and clients with professional templates, clear due dates, payment links, and instant payment receipts.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Small Businesses</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Manage your product catalog, log business expenses, create recurring billing schedules, and maintain full visibility over revenue and profit trends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Complete Invoicing & Business Management Features
          </h2>
          <p className="text-slate-600 text-sm">
            Everything freelancers and small business owners need to bill clients, track expenses, and grow revenue.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900">AI Invoice Generation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Describe deliverables in plain English to automatically draft line items, calculate applicable taxes and discounts, and format terms.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Professional Invoice Creation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Choose from Modern, Professional, Minimal, and Corporate designer templates customized with your company logo and brand styling.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Client Management</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Organize client contact profiles, company information, tax identifiers, billing addresses, and historical invoice records in one central hub.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Automatic Payment Reminders</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Configure scheduled overdue notices to notify clients when invoices are approaching or past due, reducing unpaid balances.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Repeat className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Recurring Invoices</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automate routine client retainers on weekly, monthly, quarterly, or annual schedules with automated creation and client notification.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Expense Tracking & P&L</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Record business expenses across categories, track receipts, and view real-time net income reports alongside invoice revenue.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900">PDF Invoices & Receipts</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Download clean, print-ready PDF invoices and official payment receipts with full breakdown of taxes, line items, and payment status.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Globe2 className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Multi-Currency Invoicing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Invoice international clients in USD ($), GBP (£), EUR (€), CAD (CA$), AUD (A$), and NGN (₦) with flexible per-invoice currency selection.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Financial Reports & Analytics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Monitor monthly revenue trends, payment collection rates, outstanding balances, and client growth in an intuitive analytics dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* International Positioning Banner */}
      <section className="bg-blue-600 text-white py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-white text-xs font-semibold">
            <Globe2 className="w-4 h-4 text-blue-200" aria-hidden="true" />
            <span>Global Invoicing Made Simple</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Invoice Clients Anywhere in the World
          </h2>
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Whether you work with clients in the United States, United Kingdom, Canada, Europe, or beyond, InvoiceFlow lets you invoice easily in major global currencies including USD, GBP, EUR, CAD, AUD, and NGN.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setAuthModalMode('signup')}
              className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              Start Invoicing Globally Free
            </button>
          </div>
        </div>
      </section>

      {/* Transparent Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Simple, Transparent Pricing
          </h2>
          <p className="text-slate-600 text-sm">
            Start with our free 7-day Pro trial. No hidden fees. Upgrade or cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-2xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Starter</h3>
                <p className="text-xs text-slate-500">For new freelancers testing the waters</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">$0</span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span>5 invoices per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span>3 clients directory</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span>5 AI invoice generations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span>1 recurring invoice</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span>Standard PDF downloads</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => setAuthModalMode('signup')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Get Started Free
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white border-2 border-blue-600 rounded-3xl p-7 shadow-lg relative flex flex-col justify-between space-y-6">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Pro</h3>
                <p className="text-xs text-slate-500">For active freelancers and growing businesses</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">${PRO_MONTHLY}</span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                  <span className="font-semibold text-slate-900">1,000 invoices per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                  <span>1,000 clients directory</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                  <span>200 AI invoice generations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                  <span>100 recurring invoices</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                  <span>Custom business logo & branding</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                  <span>Automated payment reminders</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => setAuthModalMode('signup')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              Start 7-Day Free Trial
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-2xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Enterprise</h3>
                <p className="text-xs text-slate-500">For agencies and high-volume billing</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">${ENTERPRISE_MONTHLY}</span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span className="font-semibold text-slate-900">Unlimited invoices</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span>Unlimited clients & products</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span>Unlimited AI generations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span>Unlimited recurring invoices</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span>Full financial analytics & P&L</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => setAuthModalMode('signup')}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Get Enterprise Access
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-white border-y border-slate-200/80 py-16 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 text-sm">
              Common questions about InvoiceFlow’s AI invoice generator and features.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="border border-slate-200 rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-bold text-slate-900">{item.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center space-y-6">
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Ready to Create Professional Invoices in Seconds?
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Join freelancers, consultants, contractors, and small business owners who save time and get paid faster with InvoiceFlow.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setAuthModalMode('signup')}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer"
          >
            <span>Create Your First Invoice Free</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => enableDemoMode()}
            className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-bold rounded-2xl shadow-2xs transition-all cursor-pointer"
          >
            Explore Live Demo
          </button>
        </div>
      </section>

      {/* Footer */}
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
                    href="#pricing"
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

      {/* Auth Modal */}
      {authModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-slide-up">
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
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
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
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-500/20 transition-all mt-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Sending link...' : 'Send reset link'}
                  </button>

                  <div className="text-center pt-2 border-t border-slate-100">
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
                          className="text-[11px] text-blue-600 hover:underline font-bold cursor-pointer"
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
                    {isSubmitting ? 'Processing...' : authModalMode === 'signup' ? 'Create Your Account' : 'Sign In'}
                  </button>
                </form>

                <div className="text-center pt-2 border-t border-slate-100">
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
