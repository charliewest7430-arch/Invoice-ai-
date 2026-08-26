import React, { useState } from 'react';
import { SeoHead } from '../components/common/SeoHead';
import { SUPPORT_EMAIL } from '../components/common/SupportModal';
import {
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Mail,
  Search,
} from 'lucide-react';

interface FaqPageProps {
  onOpenSignup?: () => void;
  onOpenDemo?: () => void;
  onNavigate?: (path: string) => void;
}

export const FaqPage: React.FC<FaqPageProps> = ({
  onOpenSignup,
  onOpenDemo,
  onNavigate,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const faqItems = [
    {
      question: 'What is InvoiceFlow?',
      answer:
        'InvoiceFlow is an AI-powered invoicing and billing platform designed to help freelancers, contractors, consultants, and small businesses create professional invoices, manage client relationships, track expenses, automate payment reminders, and simplify the process of getting paid.',
      category: 'General',
    },
    {
      question: 'What is an AI invoice generator?',
      answer:
        'An AI invoice generator is an intelligent billing assistant that turns plain-language descriptions into structured, itemized invoice drafts. In InvoiceFlow, you can describe your services or materials in everyday language, and the AI will automatically generate clear line items, calculate quantities, apply unit rates, compute sub-totals and taxes, and format your invoice for instant client delivery.',
      category: 'AI & Features',
    },
    {
      question: 'Who is InvoiceFlow for?',
      answer:
        'InvoiceFlow is specifically built for freelancers, independent contractors, digital consultants, creative agencies, online creators, and small service businesses who need a clean, professional, and fast invoicing solution without the complexity of bloated legacy accounting software.',
      category: 'General',
    },
    {
      question: 'Can freelancers use InvoiceFlow?',
      answer:
        'Yes. Freelancers can create custom-branded invoices in seconds, bill for hourly work or flat project deliverables, save recurring client details, export print-ready PDFs, and accept payments across multiple supported currencies.',
      category: 'Solutions',
    },
    {
      question: 'Can small businesses use InvoiceFlow?',
      answer:
        'Yes. Small businesses can organize customer databases, maintain product and service inventories, track business expenses across categories like software and equipment, set up recurring client subscriptions, and monitor real-time revenue analytics from a central dashboard.',
      category: 'Solutions',
    },
    {
      question: 'Can I create professional invoices online?',
      answer:
        'Yes. You can choose from four distinct professional templates (Modern, Professional, Minimal, and Corporate), upload your company logo, specify custom payment terms, include tax IDs or VAT numbers, and generate high-resolution PDF invoices online directly in your browser.',
      category: 'Invoicing',
    },
    {
      question: 'Can I manage clients with InvoiceFlow?',
      answer:
        'Yes. InvoiceFlow features a dedicated Client Management directory where you can save client contact details, email addresses, billing addresses, country settings, and tax IDs, as well as review the complete billing history for each client.',
      category: 'Invoicing',
    },
    {
      question: 'Can InvoiceFlow send payment reminders?',
      answer:
        'Yes. You can configure automated email payment reminder schedules (such as first reminder, second reminder, and final notice) with customizable messages to follow up on overdue invoices smoothly and professionally.',
      category: 'Invoicing',
    },
    {
      question: 'Can I create recurring invoices?',
      answer:
        'Yes. InvoiceFlow allows you to create recurring billing schedules with weekly, monthly, quarterly, or yearly frequencies, ideal for retainers, memberships, and ongoing client contracts.',
      category: 'Invoicing',
    },
    {
      question: 'Can I track expenses?',
      answer:
        'Yes. You can log business expenses, assign them to categories (such as Software, Equipment, Transport, Office, Advertising, Salaries, Utilities, and Taxes), record vendors, and track your operational overhead alongside your invoice revenue.',
      category: 'Accounting',
    },
    {
      question: 'Does InvoiceFlow support multiple currencies?',
      answer:
        'Yes. InvoiceFlow currently supports US Dollars ($ USD), British Pounds (£ GBP), Euros (€ EUR), Canadian Dollars (CA$ CAD), Australian Dollars (A$ AUD), and Nigerian Naira (₦ NGN), with live currency conversion overviews on your dashboard.',
      category: 'Payments',
    },
    {
      question: 'Can I invoice international clients?',
      answer:
        'Yes. You can select your client’s preferred currency from our supported list, add international bank transfer details or card payment links, and include country-specific tax or VAT identification numbers on your invoices.',
      category: 'Payments',
    },
    {
      question: 'Does InvoiceFlow offer a free trial?',
      answer:
        'Yes. InvoiceFlow provides a 7-day free trial on both the Pro plan ($9.99/month) and Enterprise plan ($15.99/month) with full access to features like custom branding, automated payment reminders, and high quota capacities. We also offer a Starter Free plan with 5 invoices per month, 3 clients, and 5 AI invoice generations.',
      category: 'Pricing',
    },
    {
      question: 'How do I create an InvoiceFlow account?',
      answer:
        'You can create a free account by clicking "Get Started Free" on our website, entering your name, email, business name, and password. You can also explore the platform instantly using our interactive Live Demo.',
      category: 'Account',
    },
    {
      question: 'How do I contact InvoiceFlow support?',
      answer:
        'You can reach our dedicated support team by visiting our Contact page or emailing us directly at visionaryhands.studio@gmail.com. We respond to all inquiries within 24 hours.',
      category: 'Support',
    },
  ];

  const filteredFaqs = searchQuery.trim()
    ? faqItems.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqItems;

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
            name: 'FAQ',
            item: 'https://invoiceflowai.cloud/faq',
          },
        ],
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
        title="InvoiceFlow FAQ | Frequently Asked Questions About Invoicing"
        description="Find answers to common questions about InvoiceFlow, AI invoice generation, invoicing software, clients, payment reminders, recurring invoices, pricing, and more."
        canonicalUrl="https://invoiceflowai.cloud/faq"
        schemaJson={schemaData}
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-4 sm:px-6">
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
              FAQ
            </span>
          </li>
        </ol>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide uppercase shadow-2xs">
          <HelpCircle className="w-4 h-4" />
          <span>Help & Answers</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Frequently Asked Questions
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Find answers to common questions about InvoiceFlow, AI invoice generation, invoicing software, client management, payment reminders, recurring billing, and pricing.
        </p>

        {/* Live Search Input */}
        <div className="max-w-md mx-auto relative pt-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions or topics..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
          />
        </div>
      </section>

      {/* Accordion FAQ List */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.question}
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs transition-colors"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                    {faq.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    <p>{faq.answer}</p>
                    {faq.question.includes('contact InvoiceFlow support') && (
                      <div className="pt-3">
                        <a
                          href="/contact"
                          onClick={(e) => navigateTo('/contact', e)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 underline"
                        >
                          <span>Visit Contact Page</span>
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl space-y-3">
              <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No matching questions found</p>
              <p className="text-xs text-slate-500">
                Try searching for other keywords like "AI", "currency", "reminder", or "pricing".
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Internal Navigation Links Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Explore Dedicated Tools & Invoicing Guides
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
              href="/about"
              onClick={(e) => navigateTo('/about', e)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 transition-colors"
            >
              About InvoiceFlow
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

      {/* Still Have Questions CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Still Have Questions?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
              Our support team is available to assist you with any questions about features, invoicing setup, or account billing.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/contact"
              onClick={(e) => navigateTo('/contact', e)}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Us</span>
            </a>
            <button
              onClick={onOpenSignup}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              Create Free Invoice
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
