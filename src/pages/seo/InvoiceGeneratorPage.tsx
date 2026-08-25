import React, { useState } from 'react';
import { SeoHead } from '../../components/common/SeoHead';
import {
  Receipt,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileText,
  Clock,
  Globe2,
  Repeat,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Layout,
  Layers,
  XCircle,
} from 'lucide-react';

interface SeoPageProps {
  onOpenSignup?: () => void;
  onOpenSignin?: () => void;
  onOpenDemo?: () => void;
  onNavigate?: (path: string) => void;
}

export const InvoiceGeneratorPage: React.FC<SeoPageProps> = ({
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

  const comparisonPoints = [
    {
      feature: 'Saved Client Database',
      basic: 'No (Re-enter client info every time)',
      invoiceFlow: 'Yes (Instant autofill from client directory)',
    },
    {
      feature: 'AI Natural Language Drafting',
      basic: 'No (Manual row-by-row input only)',
      invoiceFlow: 'Yes (Type work summary & generate draft)',
    },
    {
      feature: 'Automated Payment Reminders',
      basic: 'No (Requires manual follow-up)',
      invoiceFlow: 'Yes (Scheduled upcoming & overdue notices)',
    },
    {
      feature: 'Recurring Retainer Schedules',
      basic: 'No (Manual creation each month)',
      invoiceFlow: 'Yes (Auto-generates weekly, monthly, yearly)',
    },
    {
      feature: 'Payment Tracking & Statuses',
      basic: 'No (No invoice history or statuses)',
      invoiceFlow: 'Yes (Real-time Draft, Sent, Paid, Overdue)',
    },
    {
      feature: 'Expense Logs & P&L Analytics',
      basic: 'No (Invoicing only)',
      invoiceFlow: 'Yes (Track expenses & net profit margins)',
    },
  ];

  const templates = [
    {
      name: 'Modern Template',
      desc: 'Clean typography, vibrant accent headers, and structured totals tailored for digital agencies and creative studios.',
    },
    {
      name: 'Professional Template',
      desc: 'Classic business formatting with balanced margins, ideal for legal, financial, and management consultants.',
    },
    {
      name: 'Minimal Template',
      desc: 'Sleek, monochrome aesthetic with generous whitespace for freelancers, engineers, and solo contractors.',
    },
    {
      name: 'Corporate Template',
      desc: 'High-density tabular layout with formal tax breakdown blocks for established B2B service firms.',
    },
  ];

  const faqItems = [
    {
      question: 'How is InvoiceFlow different from a basic PDF invoice generator?',
      answer:
        'Basic PDF generators create isolated, static documents that disappear once downloaded. InvoiceFlow is a full-featured invoicing platform: it securely stores your client directory, remembers your product/service catalog, tracks invoice payment statuses, automates overdue reminder emails, schedules recurring invoices, and monitors your monthly business revenue.',
    },
    {
      question: 'Can I customize my invoices with a logo and brand colors?',
      answer:
        'Yes. You can upload your business logo, select from four professionally designed invoice templates (Modern, Professional, Minimal, Corporate), and customize contact details, notes, and payment instructions.',
    },
    {
      question: 'What currencies does this invoice generator support?',
      answer:
        'InvoiceFlow supports multi-currency billing in US Dollars (USD), British Pounds (GBP), Euros (EUR), Canadian Dollars (CAD), Australian Dollars (AUD), and Nigerian Naira (NGN).',
    },
    {
      question: 'How do automatic payment reminders work?',
      answer:
        'InvoiceFlow lets you configure automated reminder schedules that notify clients before an invoice is due, on the due date, and when an invoice is overdue, helping you maintain consistent cash flow without manual effort.',
    },
    {
      question: 'Can I track business expenses alongside my invoices?',
      answer:
        'Yes. InvoiceFlow includes an expense management module where you can record business purchases across categories, upload receipts, and monitor your true net profit in real time.',
    },
    {
      question: 'Is there a free plan available?',
      answer:
        'Yes. You can get started on our free Starter plan or test all Pro features during our 7-day free trial with no credit card required.',
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
            name: 'Invoice Generator',
            item: 'https://www.yourinvoiceflow.com/invoice-generator',
          },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'InvoiceFlow Online Invoice Generator',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        url: 'https://www.yourinvoiceflow.com/invoice-generator',
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'USD',
        },
        description:
          'Create professional invoices online with InvoiceFlow. Generate invoices, manage clients, automate reminders, and simplify your business invoicing.',
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
        title="Invoice Generator | Create Professional Invoices Online | InvoiceFlow"
        description="Create professional invoices online with InvoiceFlow. Generate invoices, manage clients, automate reminders, and simplify your business invoicing."
        canonicalUrl="https://www.yourinvoiceflow.com/invoice-generator"
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
              Invoice Generator
            </span>
          </li>
        </ol>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide uppercase shadow-2xs">
          <Receipt className="w-4 h-4 text-blue-600" aria-hidden="true" />
          <span>Complete Online Invoicing Engine</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
          Online Invoice Generator
        </h1>

        <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
          Create, customize, and deliver professional invoices in seconds. Manage clients, automate payment reminders, bill in multiple currencies, and get paid faster.
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
            Designer Templates Included
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            Automatic Payment Reminders
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            Multi-Currency Support
          </span>
        </div>
      </section>

      {/* Comparison: Basic PDF Generator vs InvoiceFlow */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            More Than Just a Basic PDF Template
          </h2>
          <p className="text-slate-600 text-sm">
            See how an integrated billing workflow outperforms isolated, one-off PDF generators.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-2xs overflow-hidden">
          <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 p-4 text-xs font-bold text-slate-700">
            <div className="col-span-5 sm:col-span-4">Feature</div>
            <div className="col-span-3 sm:col-span-4 text-slate-500">Standard PDF Generator</div>
            <div className="col-span-4 text-blue-600 font-extrabold">InvoiceFlow</div>
          </div>
          <div className="divide-y divide-slate-100">
            {comparisonPoints.map((pt, idx) => (
              <div key={idx} className="grid grid-cols-12 p-4 text-xs items-center gap-2">
                <div className="col-span-5 sm:col-span-4 font-bold text-slate-900">{pt.feature}</div>
                <div className="col-span-3 sm:col-span-4 text-slate-500 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 hidden sm:inline" />
                  <span className="truncate sm:whitespace-normal">{pt.basic}</span>
                </div>
                <div className="col-span-4 text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{pt.invoiceFlow}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 Professional Invoice Templates */}
      <section className="bg-slate-100/60 border-y border-slate-200/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              4 Designer Invoice Templates
            </h2>
            <p className="text-slate-600 text-sm">
              Present your business with stunning, beautifully aligned invoice designs customized with your logo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map((tpl, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                    <Layout className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{tpl.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{tpl.desc}</p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center gap-1 text-[11px] font-bold text-blue-600">
                  <span>Customizable Logo & Colors</span>
                </div>
              </div>
            ))}
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
              href="/invoice-maker"
              onClick={(e) => {
                e.preventDefault();
                onNavigate && onNavigate('/invoice-maker');
              }}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-2xs transition-all"
            >
              Professional Invoice Maker
            </a>
            <a
              href="/invoice-software-small-business"
              onClick={(e) => {
                e.preventDefault();
                onNavigate && onNavigate('/invoice-software-small-business');
              }}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-2xs transition-all"
            >
              Small Business Invoice Software
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
            Answers to common questions about our online invoice generator.
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
          Start Generating Professional Invoices Today
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Join thousands of freelancers and businesses who trust InvoiceFlow for client billing, automated reminders, and instant payment receipts.
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
