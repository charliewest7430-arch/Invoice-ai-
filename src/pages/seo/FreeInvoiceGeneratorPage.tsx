import React, { useState } from 'react';
import { SeoHead } from '../../components/common/SeoHead';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Receipt,
  FileText,
  UserCheck,
  Percent,
  Calendar,
  Download,
  Link,
  ChevronDown,
  ChevronRight,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface SeoPageProps {
  onOpenSignup?: () => void;
  onOpenSignin?: () => void;
  onOpenDemo?: () => void;
  onNavigate?: (path: string) => void;
}

export const FreeInvoiceGeneratorPage: React.FC<SeoPageProps> = ({
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

  const steps = [
    {
      icon: UserCheck,
      title: '1. Add Client Details',
      desc: 'Enter client name, billing email, company address, and tax identification number or select a saved client from your directory.',
    },
    {
      icon: Layers,
      title: '2. Add Products or Services',
      desc: 'Add line items for billable services, consulting hours, milestone deliverables, or catalog products.',
    },
    {
      icon: FileText,
      title: '3. Set Quantities and Rates',
      desc: 'Specify the quantity, hourly rate, or unit price. Subtotals and item amounts calculate automatically in real time.',
    },
    {
      icon: Percent,
      title: '4. Configure Taxes & Discounts',
      desc: 'Apply custom sales tax percentages, VAT, or special promotional discounts (fixed or percentage-based) with one click.',
    },
    {
      icon: Calendar,
      title: '5. Define Payment Terms',
      desc: 'Choose payment due dates (e.g. Net 15, Net 30, Due Upon Receipt), custom bank transfer notes, and payment instructions.',
    },
    {
      icon: Download,
      title: '6. Download, Share & Send',
      desc: 'Export high-quality print-ready PDF invoices, email invoices directly to clients, and track their delivery status.',
    },
  ];

  const faqItems = [
    {
      question: 'Is this invoice generator completely free?',
      answer:
        'Yes! InvoiceFlow offers a free Starter plan that includes 5 free invoices per month, 3 client profiles, 5 AI invoice generations, and standard PDF downloads. Plus, all new signups receive a 7-day complimentary trial with access to all Pro features with no credit card required.',
    },
    {
      question: 'Do I need to enter a credit card to use the free plan?',
      answer:
        'No credit card is required to sign up, start your free trial, or use the free Starter plan. You only provide payment details if you decide to upgrade to a paid Pro or Enterprise tier.',
    },
    {
      question: 'Can I download PDF invoices on the free plan?',
      answer:
        'Yes. You can generate, customize, preview, and download clean, vectorized PDF invoices directly to your computer or mobile device on all plans.',
    },
    {
      question: 'Can I add my logo and customize colors on free invoices?',
      answer:
        'Yes. You can upload your business logo, select from our professionally designed invoice templates (Modern, Professional, Minimal, Corporate), and customize business details on your invoices.',
    },
    {
      question: 'Which currencies are supported for free invoices?',
      answer:
        'InvoiceFlow supports multi-currency invoicing in US Dollars (USD), British Pounds (GBP), Euros (EUR), Canadian Dollars (CAD), Australian Dollars (AUD), and Nigerian Naira (NGN).',
    },
    {
      question: 'What happens when I reach the monthly invoice limit?',
      answer:
        'On the free Starter plan, your invoice allowance resets at the start of each billing cycle. If your business grows and you need higher invoice volume, you can upgrade seamlessly to Pro ($9.99/mo) for 1,000 monthly invoices or Enterprise for unlimited invoicing.',
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
            name: 'Free Invoice Generator',
            item: 'https://www.yourinvoiceflow.com/free-invoice-generator',
          },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'InvoiceFlow Free Invoice Generator',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        url: 'https://www.yourinvoiceflow.com/free-invoice-generator',
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'USD',
        },
        description:
          'Create professional invoices for free with InvoiceFlow. Free invoice generator for freelancers and small businesses. No credit card required.',
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
        title="Free Invoice Generator | Create Professional Invoices Online | InvoiceFlow"
        description="Create professional invoices for free with InvoiceFlow. Free invoice generator for freelancers and small businesses. No credit card required."
        canonicalUrl="https://www.yourinvoiceflow.com/free-invoice-generator"
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
              Free Invoice Generator
            </span>
          </li>
        </ol>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold tracking-wide uppercase shadow-2xs">
          <Sparkles className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          <span>100% Free Starter Plan • No Credit Card</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
          Free Online Invoice Generator
        </h1>

        <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
          Generate clean, professional invoices in minutes. Add clients, customize line items, calculate taxes, apply discounts, and download print-ready PDFs at zero cost.
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
            Free Starter Plan
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            Instant PDF Downloads
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            Includes 7-Day Pro Trial
          </span>
        </div>
      </section>

      {/* Step-by-Step Invoice Creation Breakdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            How to Create an Invoice Step by Step
          </h2>
          <p className="text-slate-600 text-sm">
            Everything you need to craft a legally compliant, beautiful invoice in under two minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-3 flex flex-col justify-start"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* What's Included in Free Plan */}
      <section className="bg-slate-100/60 border-y border-slate-200/80 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              What’s Included in Your Free Plan
            </h2>
            <p className="text-slate-600 text-sm">
              Generous limits designed for freelancers, independent contractors, and new business owners.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <span className="text-3xl font-black text-blue-600">5</span>
              <p className="text-xs font-bold text-slate-900">Invoices / Month</p>
              <p className="text-[11px] text-slate-500">Free forever allowance</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl font-black text-blue-600">3</span>
              <p className="text-xs font-bold text-slate-900">Saved Clients</p>
              <p className="text-[11px] text-slate-500">Directory profiles</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl font-black text-blue-600">5</span>
              <p className="text-xs font-bold text-slate-900">AI Generations</p>
              <p className="text-[11px] text-slate-500">Natural language drafts</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl font-black text-blue-600">100%</span>
              <p className="text-xs font-bold text-slate-900">PDF Downloads</p>
              <p className="text-[11px] text-slate-500">High-res export included</p>
            </div>
          </div>
        </div>
      </section>

      {/* Internal Navigation Block */}
      <section className="bg-slate-50 border-y border-slate-200/80 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Related Invoicing Solutions</h3>
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
            Everything you need to know about our free invoice generator.
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
          Create and Download Your First Invoice for Free
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          No credit card required. Generate your invoice, export a print-ready PDF, and send it to your client in seconds.
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
