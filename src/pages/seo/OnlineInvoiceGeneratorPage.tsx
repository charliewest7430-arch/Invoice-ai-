import React, { useState } from 'react';
import { SeoHead } from '../../components/common/SeoHead';
import {
  Globe2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Cloud,
  Smartphone,
  ShieldCheck,
  Zap,
  Download,
  Mail,
  Users,
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

export const OnlineInvoiceGeneratorPage: React.FC<SeoPageProps> = ({
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

  const cloudBenefits = [
    {
      icon: Cloud,
      title: '100% Cloud-Based & Zero Install',
      desc: 'Access your invoices, client accounts, and financial records from any web browser without downloading software or updates.',
    },
    {
      icon: Smartphone,
      title: 'Mobile & Tablet Optimized',
      desc: 'Create, edit, preview, and send invoices on the go from your phone, iPad, laptop, or desktop with responsive design.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Cloud Data Storage',
      desc: 'Your client contacts, catalog items, and billing records are stored securely with enterprise-grade encryption and automated backups.',
    },
    {
      icon: Download,
      title: 'Instant Vector PDF Exports',
      desc: 'Generate crisp, print-ready PDF invoices formatted for standard letter and A4 printing with zero watermarks.',
    },
    {
      icon: Mail,
      title: 'Email Delivery & Reminders',
      desc: 'Send invoices directly to clients via email and automate polite reminder notifications for upcoming or overdue balances.',
    },
    {
      icon: Users,
      title: 'Connected Client Directory',
      desc: 'Save client addresses, tax identifiers, and payment histories so you never have to re-enter customer data twice.',
    },
  ];

  const faqItems = [
    {
      question: 'Do I need to download or install any software?',
      answer:
        'No. InvoiceFlow is 100% web-based. You can access your invoices, create drafts, and view revenue analytics from any modern web browser on your computer, tablet, or smartphone.',
    },
    {
      question: 'Can I access my invoices from multiple devices?',
      answer:
        'Yes. Because your data is stored in the cloud, you can start an invoice on your laptop, review it on your mobile phone, and send it to your client wherever you are.',
    },
    {
      question: 'How is my business and client data secured?',
      answer:
        'InvoiceFlow uses enterprise-grade cloud database infrastructure with TLS encryption in transit and secure database isolation so your client records and financial figures remain strictly confidential.',
    },
    {
      question: 'Can I download PDF copies of my online invoices?',
      answer:
        'Yes. You can download high-resolution, unwatermarked PDF invoices at any time with a single click.',
    },
    {
      question: 'What currencies can I use online?',
      answer:
        'InvoiceFlow supports multi-currency billing in US Dollars (USD), British Pounds (GBP), Euros (EUR), Canadian Dollars (CAD), Australian Dollars (AUD), and Nigerian Naira (NGN).',
    },
    {
      question: 'Is there a free trial for the online invoice generator?',
      answer:
        'Yes. All new accounts come with a free 7-day Pro trial with full access to all templates, AI drafting, and recurring invoice schedules. No credit card is required to get started.',
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
            name: 'Online Invoice Generator',
            item: 'https://www.yourinvoiceflow.com/online-invoice-generator',
          },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'InvoiceFlow Online Invoice Generator',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        url: 'https://www.yourinvoiceflow.com/online-invoice-generator',
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'USD',
        },
        description:
          'Create and manage professional invoices online with InvoiceFlow. Manage clients, send invoices, automate reminders, and simplify your invoicing.',
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
        title="Online Invoice Generator | Create Invoices Anywhere | InvoiceFlow"
        description="Create and manage professional invoices online with InvoiceFlow. Manage clients, send invoices, automate reminders, and simplify your invoicing."
        canonicalUrl="https://www.yourinvoiceflow.com/online-invoice-generator"
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
              Online Invoice Generator
            </span>
          </li>
        </ol>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide uppercase shadow-2xs">
          <Globe2 className="w-4 h-4 text-blue-600" aria-hidden="true" />
          <span>100% Web-Based Invoicing Platform</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
          Online Invoice Generator
        </h1>

        <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
          Create, customize, and send professional invoices online from any device. Manage clients, track payment statuses, and automate reminders without installing any software.
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
            Works on Desktop, Tablet & Mobile
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            Real-Time Cloud Synchronization
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            7-Day Complimentary Pro Trial
          </span>
        </div>
      </section>

      {/* Cloud Advantages */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            The Advantages of Cloud-Based Invoicing
          </h2>
          <p className="text-slate-600 text-sm">
            Enjoy full mobility, continuous backups, and lightning-fast invoice generation from anywhere.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cloudBenefits.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
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
            Common questions about InvoiceFlow’s online invoice generator.
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
          Create Invoices Anywhere, Anytime
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Start your 7-day free trial today. Join thousands of professionals managing online invoices with InvoiceFlow.
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
