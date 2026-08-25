import React, { useState } from 'react';
import { SeoHead } from '../../components/common/SeoHead';
import {
  Building2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Clock,
  Repeat,
  TrendingUp,
  BarChart3,
  Globe2,
  Layers,
  ChevronDown,
  ChevronRight,
  Receipt,
  FileCheck,
  Briefcase,
} from 'lucide-react';

interface SeoPageProps {
  onOpenSignup?: () => void;
  onOpenSignin?: () => void;
  onOpenDemo?: () => void;
  onNavigate?: (path: string) => void;
}

export const SmallBusinessInvoiceSoftwarePage: React.FC<SeoPageProps> = ({
  onOpenSignup,
  onOpenDemo,
  onNavigate,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const navigateTo = (path: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const featurePillars = [
    {
      icon: Receipt,
      title: '1. Fast, Professional Invoicing',
      desc: 'Draft itemized invoices in seconds using our AI assistant or select pre-configured products from your catalog. Customize with your business logo and terms.',
    },
    {
      icon: Users,
      title: '2. Centralized Client Management',
      desc: 'Maintain organized records for every client: contact details, billing addresses, tax registration numbers, payment histories, and outstanding balance summaries.',
    },
    {
      icon: Clock,
      title: '3. Automated Payment Reminders',
      desc: 'Eliminate manual follow-ups. Schedule gentle payment notifications before due dates and automated overdue notices when payments are late.',
    },
    {
      icon: Repeat,
      title: '4. Recurring Retainer Invoices',
      desc: 'Set up recurring billing schedules on weekly, monthly, quarterly, or yearly cycles. Invoices generate automatically, saving hours of manual billing.',
    },
    {
      icon: TrendingUp,
      title: '5. Business Expense Tracking',
      desc: 'Log operating expenses across categories (software, subcontractors, travel, office), attach receipt proofs, and monitor your true profit margins.',
    },
    {
      icon: BarChart3,
      title: '6. Real-Time Financial Analytics',
      desc: 'Gain instant visibility into your cash flow with real-time metrics for total revenue, collected payments, unpaid balances, and monthly growth trends.',
    },
    {
      icon: Layers,
      title: '7. Product & Service Catalog',
      desc: 'Store standard pricing, descriptions, and tax rates for your regular services to populate invoices in a single click.',
    },
    {
      icon: Globe2,
      title: '8. Global Multi-Currency Support',
      desc: 'Invoice international clients in USD ($), GBP (£), EUR (€), CAD (CA$), AUD (A$), and NGN (₦) with currency-specific formatting.',
    },
    {
      icon: FileCheck,
      title: '9. Official Payment Receipts',
      desc: 'Automatically generate and issue professional payment receipts as soon as invoices are paid to provide complete accounting records.',
    },
  ];

  const targetAudiences = [
    {
      icon: Building2,
      title: 'Small Business Owners',
      desc: 'Keep cashflow predictable with automated invoices, organized client lists, and clean financial reports.',
    },
    {
      icon: Users,
      title: 'Agencies & Studios',
      desc: 'Manage multiple project retainers, track operational overhead, and bill clients across currencies.',
    },
    {
      icon: Briefcase,
      title: 'Consultants & Advisors',
      desc: 'Deliver formal corporate invoices, structure milestone billing, and receive automated payment confirmations.',
    },
    {
      icon: Layers,
      title: 'Contractors & Service Firms',
      desc: 'Itemize labor and materials, apply exact sales taxes, and get paid promptly with automated payment reminders.',
    },
  ];

  const faqItems = [
    {
      question: 'How does InvoiceFlow help small businesses save time?',
      answer:
        'InvoiceFlow automates repetitive billing tasks. With AI invoice generation, centralized client profiles, automated overdue email reminders, and recurring invoice schedules, business owners save an estimated 5 to 10 hours each month on administrative bookkeeping.',
    },
    {
      question: 'Can I set up recurring retainers for my monthly clients?',
      answer:
        'Yes. You can configure recurring invoices for weekly, monthly, quarterly, or yearly retainers. InvoiceFlow automatically generates the invoice on the scheduled date and can send it directly to your client.',
    },
    {
      question: 'Does InvoiceFlow track company expenses and net profit?',
      answer:
        'Yes. InvoiceFlow includes a dedicated expense tracker where you can record business purchases, categorize expenses, upload receipts, and view your real-time Net Profit (Revenue minus Expenses) in the Analytics dashboard.',
    },
    {
      question: 'Can I manage multiple clients and catalog items?',
      answer:
        'Yes. You can store hundreds of client profiles and product/service catalog items with preset prices and tax rates, enabling instant one-click invoice creation.',
    },
    {
      question: 'What currencies are supported for small business invoicing?',
      answer:
        'InvoiceFlow supports multi-currency invoicing in US Dollars (USD), British Pounds (GBP), Euros (EUR), Canadian Dollars (CAD), Australian Dollars (AUD), and Nigerian Naira (NGN).',
    },
    {
      question: 'Is there a free trial for small businesses?',
      answer:
        'Yes. You can start with our free Starter plan or take advantage of our 7-day complimentary Pro trial with full access to all templates, AI drafting, and recurring invoice schedules.',
    },
  ];

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
            item: 'https://www.yourinvoiceflow.com/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Small Business Invoice Software',
            item: 'https://www.yourinvoiceflow.com/invoice-software-small-business',
          },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'InvoiceFlow Small Business Invoice Software',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        url: 'https://www.yourinvoiceflow.com/invoice-software-small-business',
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'USD',
        },
        description:
          'Simple invoice software for small businesses. Create invoices, manage clients, automate payment reminders, and simplify your invoicing with InvoiceFlow.',
      },
      {
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
    ],
  };

  return (
    <div className="space-y-16 py-8">
      <SeoHead
        title="Invoice Software for Small Businesses | InvoiceFlow"
        description="Simple invoice software for small businesses. Create invoices, manage clients, automate payment reminders, and simplify your invoicing with InvoiceFlow."
        canonicalUrl="https://www.yourinvoiceflow.com/invoice-software-small-business"
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
              Small Business Invoice Software
            </span>
          </li>
        </ol>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide uppercase shadow-2xs">
          <Building2 className="w-4 h-4 text-blue-600" aria-hidden="true" />
          <span>Small Business Billing & Invoicing Software</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
          Simple Invoice Software for Small Businesses
        </h1>

        <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
          Create invoices, manage clients, automate payment reminders, log expenses, and monitor business profitability from a single, intuitive billing platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onOpenSignup}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer"
          >
            <span>Create Your First Invoice Free</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={onOpenDemo}
            className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-bold rounded-2xl shadow-2xs transition-all cursor-pointer"
          >
            Explore Live Demo
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-3 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            Automated Overdue Reminders
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            Recurring Invoices & Retainers
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            Real-Time P&L Tracking
          </span>
        </div>
      </section>

      {/* 9 Core Feature Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Comprehensive Business Invoicing Features
          </h2>
          <p className="text-slate-600 text-sm">
            Everything your small business needs to streamline collections, track overhead, and stay organized.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featurePillars.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div key={index} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{feat.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Target Customers Section */}
      <section className="bg-slate-100/60 border-y border-slate-200/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Designed for Growing Businesses and Service Teams
            </h2>
            <p className="text-slate-600 text-sm">
              Discover how InvoiceFlow powers invoicing for teams across diverse service sectors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {targetAudiences.map((aud, i) => {
              const Icon = aud.icon;
              return (
                <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{aud.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{aud.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Internal Navigation Block */}
      <section className="bg-slate-50 border-y border-slate-200/80 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Explore Invoicing Tools</h3>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-blue-600">
            <a
              href="/ai-invoice-generator"
              onClick={(e) => {
                e.preventDefault();
                onNavigate && onNavigate('/ai-invoice-generator');
              }}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-2xs transition-all"
            >
              AI Invoice Generator
            </a>
            <a
              href="/free-invoice-generator"
              onClick={(e) => {
                e.preventDefault();
                onNavigate && onNavigate('/free-invoice-generator');
              }}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-2xs transition-all"
            >
              Free Invoice Generator
            </a>
            <a
              href="/invoice-generator"
              onClick={(e) => {
                e.preventDefault();
                onNavigate && onNavigate('/invoice-generator');
              }}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-2xs transition-all"
            >
              Online Invoice Generator
            </a>
            <a
              href="/freelance-invoice-generator"
              onClick={(e) => {
                e.preventDefault();
                onNavigate && onNavigate('/freelance-invoice-generator');
              }}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-2xs transition-all"
            >
              Freelance Invoice Generator
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 text-sm">
            Common questions about InvoiceFlow’s small business invoice software.
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-colors bg-white"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-bold text-slate-900">{item.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 text-center space-y-6">
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Simplify Your Business Invoicing Today
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Start your 7-day free trial. Manage clients, automate payment reminders, and keep your small business cashflow healthy with InvoiceFlow.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onOpenSignup}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer"
          >
            <span>Create Your First Invoice Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenDemo}
            className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-bold rounded-2xl shadow-2xs transition-all cursor-pointer"
          >
            Explore Live Demo
          </button>
        </div>
      </section>
    </div>
  );
};
