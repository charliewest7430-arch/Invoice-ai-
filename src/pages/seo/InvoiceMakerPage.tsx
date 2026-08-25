import React, { useState } from 'react';
import { SeoHead } from '../../components/common/SeoHead';
import {
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Palette,
  Upload,
  Receipt,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Users,
  Building2,
  Layers,
} from 'lucide-react';

interface SeoPageProps {
  onOpenSignup?: () => void;
  onOpenSignin?: () => void;
  onOpenDemo?: () => void;
  onNavigate?: (path: string) => void;
}

export const InvoiceMakerPage: React.FC<SeoPageProps> = ({
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

  const customizationFeatures = [
    {
      icon: Upload,
      title: 'Company Logo Upload',
      desc: 'Add high-resolution vector or PNG logos to give your invoices an instantly recognizable, branded feel.',
    },
    {
      icon: Palette,
      title: 'Designer Templates',
      desc: 'Select from Modern, Professional, Minimal, and Corporate layout styles tailored to your industry standards.',
    },
    {
      icon: FileText,
      title: 'Custom Terms & Notes',
      desc: 'Include tailored payment instructions, bank transfer details, tax registration numbers, and polite thank-you notes.',
    },
    {
      icon: ShieldCheck,
      title: 'Custom Invoice Numbering',
      desc: 'Format sequential invoice numbers (e.g. INV-2026-001) that seamlessly align with your existing accounting system.',
    },
  ];

  const useCases = [
    {
      icon: Briefcase,
      title: 'Freelancers & Solo Contractors',
      desc: 'Create hourly or fixed-price invoices for development, design, content writing, and consulting contracts.',
    },
    {
      icon: Users,
      title: 'Consultants & Advisors',
      desc: 'Bill retainer fees, milestone strategy sessions, and discovery workshops with clean, itemized breakdowns.',
    },
    {
      icon: Building2,
      title: 'Agencies & Studios',
      desc: 'Manage multiple active clients, issue monthly retainer invoices, and track revenue across creative and marketing teams.',
    },
    {
      icon: Layers,
      title: 'Trade Contractors & Service Pros',
      desc: 'Itemize materials, labor hours, equipment fees, and sales taxes with clear payment due dates.',
    },
  ];

  const faqItems = [
    {
      question: 'How fast can I create an invoice with this invoice maker?',
      answer:
        'With InvoiceFlow, you can create and download a complete, branded invoice in under 60 seconds. You can either type your deliverables into our AI assistant or select saved clients and catalog products for instant line-item population.',
    },
    {
      question: 'Can I add my logo and business information?',
      answer:
        'Yes. You can upload your business logo, enter your registered business address, tax ID (VAT/GST/EIN), contact phone number, and customized payment instructions.',
    },
    {
      question: 'Can I issue official payment receipts after getting paid?',
      answer:
        'Yes. When an invoice is marked as paid, InvoiceFlow can automatically generate an official payment receipt with transaction identifiers that you can download or send directly to your client.',
    },
    {
      question: 'Does this invoice maker work on mobile browsers?',
      answer:
        'Yes. InvoiceFlow is fully responsive and web-based. You can create, edit, download, and email invoices from any desktop, tablet, or smartphone browser with no software installation required.',
    },
    {
      question: 'What currencies can I use to bill clients?',
      answer:
        'You can issue invoices in US Dollars (USD), British Pounds (GBP), Euros (EUR), Canadian Dollars (CAD), Australian Dollars (AUD), and Nigerian Naira (NGN).',
    },
    {
      question: 'Is there a free trial for the invoice maker?',
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
            name: 'Invoice Maker',
            item: 'https://www.yourinvoiceflow.com/invoice-maker',
          },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'InvoiceFlow Professional Invoice Maker',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        url: 'https://www.yourinvoiceflow.com/invoice-maker',
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'USD',
        },
        description:
          'Create professional invoices online with InvoiceFlow’s invoice maker. Designed for freelancers, consultants, agencies, contractors, and small businesses.',
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
        title="Invoice Maker | Create Professional Invoices Online | InvoiceFlow"
        description="Create professional invoices online with InvoiceFlow’s invoice maker. Designed for freelancers, consultants, agencies, contractors, and small businesses."
        canonicalUrl="https://www.yourinvoiceflow.com/invoice-maker"
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
              Invoice Maker
            </span>
          </li>
        </ol>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide uppercase shadow-2xs">
          <FileText className="w-4 h-4 text-blue-600" aria-hidden="true" />
          <span>Professional Invoice Maker & Designer</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
          Professional Invoice Maker
        </h1>

        <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
          Design custom branded invoices in minutes. Add your logo, choose tailored templates, organize client details, and issue print-ready invoices that get paid on time.
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
            Custom Logo & Branding
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            Multi-Currency Invoicing
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            7-Day Free Pro Trial
          </span>
        </div>
      </section>

      {/* Brand Customization Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Customize Every Invoice for Your Brand
          </h2>
          <p className="text-slate-600 text-sm">
            Showcase your professionalism with tailored layouts, personalized notes, and clear payment instructions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {customizationFeatures.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-3">
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

      {/* Built For Different Businesses */}
      <section className="bg-slate-100/60 border-y border-slate-200/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              An Invoice Maker for Every Profession
            </h2>
            <p className="text-slate-600 text-sm">
              Tailored invoicing solutions configured for your specific industry and workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((uc, i) => {
              const Icon = uc.icon;
              return (
                <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{uc.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{uc.desc}</p>
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
            Common questions about InvoiceFlow’s professional invoice maker.
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
          Create Custom Invoices in Minutes
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Start your 7-day free trial. Build professional invoices, track payments, and automate your client billing today.
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
