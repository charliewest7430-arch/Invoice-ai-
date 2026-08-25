import React, { useState } from 'react';
import { SeoHead } from '../../components/common/SeoHead';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Receipt,
  Clock,
  Globe2,
  FileText,
  ShieldCheck,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Repeat,
  Zap,
} from 'lucide-react';

interface SeoPageProps {
  onOpenSignup?: () => void;
  onOpenSignin?: () => void;
  onOpenDemo?: () => void;
  onNavigate?: (path: string) => void;
}

export const AiInvoiceGeneratorPage: React.FC<SeoPageProps> = ({
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

  const sampleAiPrompts = [
    {
      prompt: 'Billed Apex Studio for 35 hours of React development at $95/hr, plus $250 server setup fee and 10% milestone discount, net-15 payment terms.',
      result: {
        client: 'Apex Studio',
        items: [
          { desc: 'React Frontend Development (35 hrs @ $95/hr)', amount: '$3,325.00' },
          { desc: 'Cloud Server Infrastructure Setup', amount: '$250.00' },
        ],
        discount: '10% milestone discount (-$357.50)',
        total: '$3,217.50',
        terms: 'Net 15 Days',
      },
    },
    {
      prompt: 'Monthly SEO and content retainer for Crestview Dental: $1,200 retainer fee, 3 blog articles at $150 each, due upon receipt in USD.',
      result: {
        client: 'Crestview Dental',
        items: [
          { desc: 'Monthly SEO Management Retainer', amount: '$1,200.00' },
          { desc: 'Technical Blog Articles (3 @ $150/ea)', amount: '$450.00' },
        ],
        discount: 'None',
        total: '$1,650.00',
        terms: 'Due Upon Receipt',
      },
    },
  ];

  const faqItems = [
    {
      question: 'What is an AI invoice generator?',
      answer:
        'An AI invoice generator is an intelligent billing tool that uses natural language processing to transform plain text descriptions into structured, professional invoices. Rather than typing out line items, calculating percentages, and formatting tables by hand, you describe your billable work and let InvoiceFlow format taxes, discounts, totals, and payment instructions automatically.',
    },
    {
      question: 'How does InvoiceFlow’s AI invoice assistant work?',
      answer:
        'You simply enter a brief summary of the services delivered, hourly rates, project fees, client name, and payment terms into the AI prompt box. InvoiceFlow parses your text, extracts line items, quantities, and unit prices, calculates applicable discounts or taxes, and generates an editable draft ready for PDF export or client delivery.',
    },
    {
      question: 'Can I edit the invoice after the AI generates it?',
      answer:
        'Yes. Every AI-generated invoice is completely editable. You can adjust line items, add or remove taxes, upload your company logo, change currency (USD, GBP, EUR, CAD, AUD, NGN), modify payment terms, and select from multiple professional invoice templates.',
    },
    {
      question: 'Does the AI invoice generator support multiple currencies?',
      answer:
        'Yes. InvoiceFlow supports major international currencies including US Dollars (USD), British Pounds (GBP), Euros (EUR), Canadian Dollars (CAD), Australian Dollars (AUD), and Nigerian Naira (NGN). You can select your preferred currency per invoice.',
    },
    {
      question: 'Can I set up automated payment reminders and recurring invoices?',
      answer:
        'Yes. InvoiceFlow includes an automated payment reminder engine with customizable schedules for upcoming and overdue notices. You can also automate recurring retainers on weekly, monthly, quarterly, or yearly schedules.',
    },
    {
      question: 'Is there a free trial for the AI invoice generator?',
      answer:
        'Yes. All new accounts start with a 7-day complimentary Pro trial. You can test unlimited AI invoice drafts, client records, and PDF exports with no credit card required.',
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
            name: 'AI Invoice Generator',
            item: 'https://www.yourinvoiceflow.com/ai-invoice-generator',
          },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'InvoiceFlow AI Invoice Generator',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        url: 'https://www.yourinvoiceflow.com/ai-invoice-generator',
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'USD',
        },
        description:
          "Create professional invoices in seconds with InvoiceFlow's AI invoice generator. Generate line items, manage clients, and get paid faster.",
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
        title="AI Invoice Generator | Create Invoices with AI | InvoiceFlow"
        description="Create professional invoices in seconds with InvoiceFlow's AI invoice generator. Generate line items, manage clients, and get paid faster."
        canonicalUrl="https://www.yourinvoiceflow.com/ai-invoice-generator"
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
              AI Invoice Generator
            </span>
          </li>
        </ol>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide uppercase shadow-2xs">
          <Sparkles className="w-4 h-4 text-blue-600" aria-hidden="true" />
          <span>Smart AI Invoicing Technology</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
          AI Invoice Generator
        </h1>

        <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
          Create professional, custom-branded invoices in seconds using natural language. Let artificial intelligence organize line items, calculate totals, and structure payment terms so you get paid faster.
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
            7-Day Free Pro Trial
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            No Credit Card Required
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            Multi-Currency (USD, GBP, EUR, CAD, AUD, NGN)
          </span>
        </div>
      </section>

      {/* How AI Invoicing Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            How Natural Language Invoicing Works
          </h2>
          <p className="text-slate-600 text-sm">
            Turn conversational work summaries into audit-ready commercial invoices in three steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900">Describe your work</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Type or paste a quick note detailing what you worked on, hours or flat rates, client name, and payment terms.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900">AI builds the invoice</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              InvoiceFlow instantly parses line items, calculates subtotal, discounts, taxes, and sets up your payment instructions.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900">Review, download & send</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Review the generated invoice in your chosen template, export a high-resolution PDF, and send it to your client.
            </p>
          </div>
        </div>
      </section>

      {/* AI Invoicing Interactive Showcase */}
      <section className="bg-slate-100/60 border-y border-slate-200/80 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>Real AI Prompt Examples</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              See How Words Turn Into Polished Invoices
            </h2>
            <p className="text-slate-600 text-sm">
              Watch how our intelligent AI invoice maker converts messy notes into structured financial documents.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {sampleAiPrompts.map((sample, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Example Prompt #{idx + 1}</span>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-700 leading-relaxed italic">
                    "{sample.prompt}"
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">Client:</span>
                    <span className="text-slate-700 font-semibold">{sample.result.client}</span>
                  </div>
                  <div className="space-y-1.5">
                    {sample.result.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
                        <span className="truncate max-w-[240px]">{item.desc}</span>
                        <span className="font-bold text-slate-900">{item.amount}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-900">Total Due:</span>
                    <span className="text-base font-black text-blue-600">{sample.result.total}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Breakdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Why Professionals Prefer InvoiceFlow AI
          </h2>
          <p className="text-slate-600 text-sm">
            Everything you need to automate billing, track client balances, and run a streamlined freelance or small business operation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Natural Language Parsing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Skip cumbersome manual data entry forms. Type your project notes naturally and let AI generate accurate line items and calculations.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Multi-Currency Invoicing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bill clients around the world in USD, GBP, EUR, CAD, AUD, and NGN with automatic currency formatting.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Automated Reminders</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Never chase late payments awkwardly. Configure automated reminder schedules before and after invoice due dates.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Repeat className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Recurring Invoices</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automate routine client retainers on weekly, monthly, quarterly, or yearly cycles with automatic creation and delivery.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Expense & Profit Tracking</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Log project expenses, attach receipts, and maintain a real-time view of your net profitability.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Print-Ready PDF Invoices</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Download clean, vectorized PDF invoices and payment receipts with customizable branding and business details.
            </p>
          </div>
        </div>
      </section>

      {/* Internal Links Navigation Block */}
      <section className="bg-slate-50 border-y border-slate-200/80 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Explore Invoicing Solutions</h3>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-blue-600">
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
              href="/freelance-invoice-generator"
              onClick={(e) => {
                e.preventDefault();
                onNavigate && onNavigate('/freelance-invoice-generator');
              }}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-2xs transition-all"
            >
              Freelance Invoice Generator
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
            Answers to common questions about InvoiceFlow’s AI invoice generator.
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
          Ready to Create Invoices 10x Faster with AI?
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Start your 7-day free trial today. Describe your work in natural language and download your first professional invoice in seconds.
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
