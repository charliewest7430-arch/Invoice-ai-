import React, { useState } from 'react';
import { SeoHead } from '../../components/common/SeoHead';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Code2,
  Palette,
  PenTool,
  Camera,
  Briefcase,
  Megaphone,
  Video,
  Flame,
  Wrench,
  Globe2,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Receipt,
  FileText,
} from 'lucide-react';

interface SeoPageProps {
  onOpenSignup?: () => void;
  onOpenSignin?: () => void;
  onOpenDemo?: () => void;
  onNavigate?: (path: string) => void;
}

export const FreelanceInvoiceGeneratorPage: React.FC<SeoPageProps> = ({
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

  const freelanceRoles = [
    {
      icon: Code2,
      role: 'Developers & Engineers',
      desc: 'Bill for hourly coding sprints, software architecture milestones, API integrations, and ongoing maintenance retainers.',
    },
    {
      icon: Palette,
      role: 'Designers & UI/UX Artists',
      desc: 'Itemize wireframes, Figma prototypes, branding packages, vector illustration assets, and client revision rounds.',
    },
    {
      icon: PenTool,
      role: 'Writers & Copywriters',
      desc: 'Invoice per article, word count, landing page copy, email newsletters, technical whitepapers, or monthly content retainers.',
    },
    {
      icon: Camera,
      role: 'Photographers & Media Pros',
      desc: 'Bill for half-day or full-day shoot rates, photo retouching, equipment rentals, travel fees, and commercial usage licenses.',
    },
    {
      icon: Briefcase,
      role: 'Consultants & Strategists',
      desc: 'Invoice advisory hours, executive coaching sessions, discovery audits, and workshop facilitation with clear payment terms.',
    },
    {
      icon: Megaphone,
      role: 'Marketers & Growth Experts',
      desc: 'Bill ad campaign management fees, paid search optimization, conversion audits, and social media retainers.',
    },
    {
      icon: Video,
      role: 'Video Editors & Motion Designers',
      desc: 'Itemize video cuts, color grading, audio cleanup, motion graphics rendering, and rush turnaround surcharges.',
    },
    {
      icon: Flame,
      role: 'Creators & Influencers',
      desc: 'Invoice brand sponsorships, dedicated YouTube integrations, TikTok collaborations, and affiliate marketing milestones.',
    },
    {
      icon: Wrench,
      role: 'Independent Contractors',
      desc: 'List labor hours, subcontractor rates, materials, sales tax, and mileage with clear due dates and bank transfer details.',
    },
  ];

  const benefits = [
    {
      icon: Sparkles,
      title: 'AI Natural Language Drafting',
      desc: 'Type a quick sentence about your freelance work and let AI structure hours, rates, discounts, and payment terms.',
    },
    {
      icon: Clock,
      title: 'Automated Overdue Reminders',
      desc: 'Avoid the awkwardness of manual follow-ups. Let automated reminder emails nudge clients before and after payment due dates.',
    },
    {
      icon: Globe2,
      title: 'Bill International Clients',
      desc: 'Invoice global clients seamlessly in US Dollars (USD), British Pounds (GBP), Euros (EUR), Canadian Dollars (CAD), Australian Dollars (AUD), and Nigerian Naira (NGN).',
    },
    {
      icon: TrendingUp,
      title: 'Expense & Tax Tracking',
      desc: 'Keep track of software subscriptions, equipment purchases, and deductible business expenses so tax season is stress-free.',
    },
  ];

  const faqItems = [
    {
      question: 'Why should freelancers use InvoiceFlow instead of spreadsheets or Word templates?',
      answer:
        'Spreadsheets and Word templates are prone to calculation errors, lack client histories, and require manual chasing for payments. InvoiceFlow gives freelancers a polished client portal: instant AI draft creation, automatic overdue reminders, recurring retainer billing, and real-time payment tracking.',
    },
    {
      question: 'Can I bill international clients in their local currency?',
      answer:
        'Yes. InvoiceFlow supports billing in US Dollars (USD), British Pounds (GBP), Euros (EUR), Canadian Dollars (CAD), Australian Dollars (AUD), and Nigerian Naira (NGN).',
    },
    {
      question: 'How do automated reminders help freelancers get paid faster?',
      answer:
        'InvoiceFlow automatically dispatches polite payment notifications before an invoice is due and right when it becomes overdue, drastically reducing late payments without requiring awkward personal follow-ups.',
    },
    {
      question: 'Can I track my freelance business expenses?',
      answer:
        'Yes. You can record deductible business expenses (such as software subscriptions, hardware, or travel), attach receipts, and view your net freelance earnings in the Analytics dashboard.',
    },
    {
      question: 'Is there a free plan for solo freelancers?',
      answer:
        'Yes! Freelancers can use the free Starter plan (5 invoices/month, 3 clients, 5 AI generations) or test all Pro features during the 7-day free trial with no credit card required.',
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
            name: 'Freelance Invoice Generator',
            item: 'https://www.yourinvoiceflow.com/freelance-invoice-generator',
          },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'InvoiceFlow Freelance Invoice Generator',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        url: 'https://www.yourinvoiceflow.com/freelance-invoice-generator',
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'USD',
        },
        description:
          'Create professional freelance invoices in minutes with InvoiceFlow. Manage clients, send invoices, automate reminders, and get paid faster.',
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
        title="Freelance Invoice Generator | Invoice Software for Freelancers | InvoiceFlow"
        description="Create professional freelance invoices in minutes with InvoiceFlow. Manage clients, send invoices, automate reminders, and get paid faster."
        canonicalUrl="https://www.yourinvoiceflow.com/freelance-invoice-generator"
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
              Freelance Invoice Generator
            </span>
          </li>
        </ol>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide uppercase shadow-2xs">
          <Briefcase className="w-4 h-4 text-blue-600" aria-hidden="true" />
          <span>Built Exclusively for Freelancers & Contractors</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
          Invoice Generator for Freelancers
        </h1>

        <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
          Create professional freelance invoices in seconds. Manage clients, send itemized bills, automate payment reminders, and get paid faster without the administrative headache.
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
            Zero Credit Card Required
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            Automated Payment Follow-Ups
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            Multi-Currency International Invoicing
          </span>
        </div>
      </section>

      {/* Role-Specific Solutions Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tailored Invoicing for Every Freelance Discipline
          </h2>
          <p className="text-slate-600 text-sm">
            Whether you bill hourly, per project, or on retainer, InvoiceFlow matches your exact freelance workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {freelanceRoles.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{item.role}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Freelancers Choose InvoiceFlow */}
      <section className="bg-slate-100/60 border-y border-slate-200/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Why Freelancers Love InvoiceFlow
            </h2>
            <p className="text-slate-600 text-sm">
              Spend less time doing paperwork and more time delivering great client work.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{b.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{b.desc}</p>
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
            Common questions about InvoiceFlow’s freelance invoice generator.
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
          Level Up Your Freelance Invoicing
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Start your 7-day free trial today. Build branded invoices, automate payment reminders, and keep your freelance revenue flowing.
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
