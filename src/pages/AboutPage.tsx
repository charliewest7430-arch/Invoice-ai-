import React from 'react';
import { SeoHead } from '../components/common/SeoHead';
import {
  Sparkles,
  Receipt,
  Users,
  Repeat,
  Bell,
  PieChart,
  FileCheck,
  Globe2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Briefcase,
  Layers,
  Clock,
  Compass,
} from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../types';

interface AboutPageProps {
  onOpenSignup?: () => void;
  onOpenSignin?: () => void;
  onOpenDemo?: () => void;
  onNavigate?: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onOpenSignup,
  onOpenDemo,
  onNavigate,
}) => {
  const navigateTo = (path: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://invoiceflowai.cloud/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'About InvoiceFlow',
            item: 'https://invoiceflowai.cloud/about',
          },
        ],
      },
      {
        '@type': 'Organization',
        '@id': 'https://invoiceflowai.cloud/#organization',
        name: 'InvoiceFlow',
        url: 'https://invoiceflowai.cloud/',
        logo: 'https://invoiceflowai.cloud/favicon.ico',
        description:
          'InvoiceFlow is an AI-powered invoicing and billing platform designed to help freelancers and small businesses create professional invoices, manage clients, and simplify getting paid.',
      },
    ],
  };

  const audienceGroups = [
    {
      title: 'Freelancers & Solo Pros',
      description:
        'Quickly bill clients for hourly work, milestone deliverables, and creative services with fast AI drafting and branded templates.',
      icon: Briefcase,
    },
    {
      title: 'Consultants & Advisors',
      description:
        'Deliver polished, itemized billing statements with flexible terms, retainer schedules, and professional ledger layouts.',
      icon: Layers,
    },
    {
      title: 'Creative & Digital Agencies',
      description:
        'Manage recurring client retainers, track project expenses, and oversee multi-client payment statuses from a unified dashboard.',
      icon: Users,
    },
    {
      title: 'Contractors & Trades',
      description:
        'Generate on-the-spot mobile invoices, calculate line-item taxes, and dispatch downloadable PDF bills directly to clients.',
      icon: FileCheck,
    },
    {
      title: 'Creators & Coaches',
      description:
        'Package digital products, coaching tiers, and workshops into clear, professional invoices with international currency support.',
      icon: Sparkles,
    },
    {
      title: 'Small & Growing Businesses',
      description:
        'Organize team billing, log vendor receipts, monitor unpaid receivables, and automate gentle payment reminder cycles.',
      icon: PieChart,
    },
  ];

  const features = [
    {
      title: 'AI-Assisted Invoice Creation',
      desc: 'Describe your job in plain English or prompt our AI engine to automatically compute quantities, rates, sub-totals, and descriptions.',
      icon: Sparkles,
    },
    {
      title: 'Professional Customizable Invoices',
      desc: 'Choose from four tailored invoice templates (Modern, Professional, Minimal, and Corporate) and personalize your business logo, terms, and tax IDs.',
      icon: Receipt,
    },
    {
      title: 'Client Management Directory',
      desc: 'Store client contact details, billing addresses, country settings, and historical invoice logs in one searchable contact manager.',
      icon: Users,
    },
    {
      title: 'Automated Payment Reminders',
      desc: 'Configure gentle, structured email reminder schedules so overdue invoices get followed up on time without awkward conversations.',
      icon: Bell,
    },
    {
      title: 'Recurring Invoices & Subscriptions',
      desc: 'Set up weekly, monthly, quarterly, or yearly billing schedules for ongoing retainer clients and recurring contracts.',
      icon: Repeat,
    },
    {
      title: 'Expense & Receipt Tracking',
      desc: 'Categorize business operational costs across software, equipment, office, and transport to maintain clear financial visibility.',
      icon: PieChart,
    },
    {
      title: 'Multi-Currency Invoicing',
      desc: 'Bill clients in major world currencies including USD ($), GBP (£), EUR (€), CAD (CA$), AUD (A$), and NGN (₦) with instant conversion views.',
      icon: Globe2,
    },
    {
      title: 'Payment Receipts & CSV Exports',
      desc: 'Issue instant proof-of-payment receipts for settled invoices and export clean financial data for your accounting records.',
      icon: FileCheck,
    },
  ];

  return (
    <div className="space-y-16 py-8">
      <SeoHead
        title="About InvoiceFlow | AI-Powered Invoicing for Businesses"
        description="Learn about InvoiceFlow, an AI-powered invoicing platform designed to help freelancers and small businesses create professional invoices and simplify their invoicing workflow."
        canonicalUrl="https://invoiceflowai.cloud/about"
        schemaJson={schemaData}
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="max-w-5xl mx-auto px-4 sm:px-6">
        <ol className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <li>
            <a
              href="/"
              onClick={(e) => navigateTo('/', e)}
              className="hover:text-blue-600 transition-colors"
            >
              Home
            </a>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </li>
          <li>
            <span className="text-slate-900 font-bold" aria-current="page">
              About
            </span>
          </li>
        </ol>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide uppercase shadow-2xs">
          <Compass className="w-4 h-4" />
          <span>Our Story & Mission</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          About InvoiceFlow
        </h1>

        <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          InvoiceFlow helps freelancers and small businesses create professional invoices, manage clients, and simplify the process of getting paid.
        </p>
      </section>

      {/* Mission Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-sm space-y-6">
          <div className="inline-flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Our Mission</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Making Invoicing Simpler, Faster, and More Accessible
          </h2>
          <div className="space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed">
            <p>
              Invoicing shouldn’t be a time-consuming administrative burden. Independent professionals, freelancers, and small business owners often lose valuable billable hours battling rigid accounting software, manually copying spreadsheet templates, and awkwardly chasing late client payments.
            </p>
            <p>
              InvoiceFlow was built to eliminate that friction. By combining intuitive modern design with intelligent AI assistance, InvoiceFlow enables you to generate accurate, itemized invoices in seconds, maintain structured client records, automate recurring billing, and present a polished, professional image to every client you serve.
            </p>
          </div>
        </div>
      </section>

      {/* Built for Modern Businesses */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Built for Modern Businesses & Independent Pros
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">
            Whether you are billing your very first client or managing dozens of recurring contracts across the globe, InvoiceFlow adapts seamlessly to your workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {audienceGroups.map((group) => {
            const Icon = group.icon;
            return (
              <div
                key={group.title}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-shadow space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{group.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{group.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why InvoiceFlow? Features Grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Why Choose InvoiceFlow?
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">
            Explore the core built-in features engineered to simplify every stage of your billing cycle.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 text-blue-600 flex items-center justify-center border border-slate-200">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{feat.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Built for Clients Around the World */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            <Globe2 className="w-3.5 h-3.5" />
            <span>Global Invoicing</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Built for Clients Around the World
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            InvoiceFlow is designed for businesses and independent specialists serving clients internationally across North America, the United Kingdom, Europe, and beyond.
          </p>

          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Supported Multi-Currency Options
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {SUPPORTED_CURRENCIES.map((curr) => (
                <div
                  key={curr.code}
                  className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-center"
                >
                  <span className="text-lg font-black text-blue-400 block">{curr.symbol}</span>
                  <span className="text-xs font-bold text-white block">{curr.code}</span>
                  <span className="text-[10px] text-slate-400 block truncate">{curr.name}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-400 pt-2 leading-relaxed">
            Easily enter custom tax identification numbers, VAT/EIN details, and tailored bank transfer instructions on every invoice to meet your client’s localized documentation preferences.
          </p>
        </div>
      </section>

      {/* Internal Navigation Links Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Explore Related Invoicing Tools & Resources
          </h3>
          <div className="flex flex-wrap gap-2.5 text-xs font-semibold">
            <a
              href="/ai-invoice-generator"
              onClick={(e) => navigateTo('/ai-invoice-generator', e)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 transition-colors"
            >
              AI Invoice Generator
            </a>
            <a
              href="/invoice-generator"
              onClick={(e) => navigateTo('/invoice-generator', e)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 transition-colors"
            >
              Online Invoice Generator
            </a>
            <a
              href="/free-invoice-generator"
              onClick={(e) => navigateTo('/free-invoice-generator', e)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 transition-colors"
            >
              Free Invoice Generator
            </a>
            <a
              href="/freelance-invoice-generator"
              onClick={(e) => navigateTo('/freelance-invoice-generator', e)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 transition-colors"
            >
              Freelance Invoicing
            </a>
            <a
              href="/invoice-software-small-business"
              onClick={(e) => navigateTo('/invoice-software-small-business', e)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 transition-colors"
            >
              Small Business Software
            </a>
            <a
              href="/faq"
              onClick={(e) => navigateTo('/faq', e)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 transition-colors"
            >
              Frequently Asked Questions
            </a>
            <a
              href="/contact"
              onClick={(e) => navigateTo('/contact', e)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-linear-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Ready to Streamline Your Business Invoicing?
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Create professional invoices in seconds, automate client reminders, and get paid on time with InvoiceFlow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenSignup}
              className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-blue-50 text-blue-700 font-bold text-sm rounded-xl shadow-md hover:scale-[1.02] transition-all cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <span>Create Your First Invoice Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenDemo}
              className="w-full sm:w-auto px-6 py-3.5 bg-blue-500/20 hover:bg-blue-500/30 text-white font-bold text-sm rounded-xl border border-white/20 transition-all cursor-pointer"
            >
              Explore Live Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
