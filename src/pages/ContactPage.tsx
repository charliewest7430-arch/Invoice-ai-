import React, { useState } from 'react';
import { SeoHead } from '../components/common/SeoHead';
import { SUPPORT_EMAIL } from '../components/common/SupportModal';
import {
  Mail,
  Copy,
  Check,
  Send,
  LifeBuoy,
  CreditCard,
  Bug,
  Sparkles,
  HelpCircle,
  Clock,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';

interface ContactPageProps {
  onNavigate?: (path: string) => void;
  onOpenSignup?: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate, onOpenSignup }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('General Support');

  const navigateTo = (path: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
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
            name: 'Contact',
            item: 'https://invoiceflowai.cloud/contact',
          },
        ],
      },
      {
        '@type': 'ContactPage',
        '@id': 'https://invoiceflowai.cloud/contact#webpage',
        url: 'https://invoiceflowai.cloud/contact',
        name: 'Contact InvoiceFlow Support',
        description:
          'Contact InvoiceFlow for questions about invoicing, accounts, billing, features, or technical support.',
        mainEntity: {
          '@type': 'Organization',
          name: 'InvoiceFlow',
          url: 'https://invoiceflowai.cloud/',
          email: SUPPORT_EMAIL,
        },
      },
    ],
  };

  const inquiryTopics = [
    {
      id: 'General Support',
      title: 'General Support & Questions',
      description: 'Need help navigating features, templates, or account settings?',
      icon: HelpCircle,
      subject: 'InvoiceFlow Support: General Inquiry',
    },
    {
      id: 'Billing & Subscriptions',
      title: 'Billing & Subscriptions',
      description: 'Questions regarding your 7-day trial, plan upgrades, or payments.',
      icon: CreditCard,
      subject: 'InvoiceFlow Support: Billing & Subscription',
    },
    {
      id: 'Technical Assistance',
      title: 'Technical Assistance & Bugs',
      description: 'Encountering an issue with PDF exports, email triggers, or logins?',
      icon: Bug,
      subject: 'InvoiceFlow Support: Technical Issue',
    },
    {
      id: 'Feature Requests',
      title: 'Feature Requests & Feedback',
      description: 'Have ideas on how we can improve InvoiceFlow for your workflow?',
      icon: Sparkles,
      subject: 'InvoiceFlow Support: Feature Request',
    },
  ];

  return (
    <div className="space-y-16 py-8">
      <SeoHead
        title="Contact InvoiceFlow | Get Help With Your Invoicing"
        description="Contact InvoiceFlow for questions about invoicing, accounts, billing, features, or technical support."
        canonicalUrl="https://invoiceflowai.cloud/contact"
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
              Contact
            </span>
          </li>
        </ol>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide uppercase shadow-2xs">
          <LifeBuoy className="w-4 h-4" />
          <span>Support & Inquiries</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Contact InvoiceFlow
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Have a question about creating invoices, managing client billing, account configuration, or subscription plans? Our support team is here to assist you.
        </p>
      </section>

      {/* Primary Contact Cards Grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Direct Email Card */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                <Mail className="w-4 h-4" />
                <span>Official Contact Email</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Send Us a Direct Message
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Reach our team directly via email. We aim to review and respond to all user inquiries within 24 hours.
              </p>
            </div>

            {/* Email Address Highlight Box */}
            <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Support Email
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 break-all select-all">
                    {SUPPORT_EMAIL}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={handleCopyEmail}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Copy Email</span>
                    </>
                  )}
                </button>

                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                    `InvoiceFlow Inquiry - ${selectedTopic}`
                  )}`}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Open Email Client</span>
                </a>
              </div>
            </div>

            {/* Quick Topic Selection */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Choose a Topic for Faster Routing:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inquiryTopics.map((topic) => {
                  const Icon = topic.icon;
                  const isSelected = selectedTopic === topic.id;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-blue-50 border-blue-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900">{topic.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {topic.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Help & Self-Service Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Support Hours</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our support team monitors incoming messages 7 days a week. We strive to provide comprehensive replies within 24 hours.
              </p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Support Schedule:</span>
                  <span className="font-semibold text-slate-700">Monday – Sunday</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Standard Response:</span>
                  <span className="font-semibold text-emerald-600">&lt; 24 Hours</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-md space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold">Instant Answers in FAQ</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Looking for quick guidance on AI invoice generation, currencies, or recurring schedules? Check our FAQ section.
              </p>
              <a
                href="/faq"
                onClick={(e) => navigateTo('/faq', e)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 pt-1"
              >
                <span>Read Frequently Asked Questions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Helpful Links */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Related Invoicing Pages & Tools
          </h3>
          <div className="flex flex-wrap gap-2.5 text-xs font-semibold">
            <a
              href="/about"
              onClick={(e) => navigateTo('/about', e)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 transition-colors"
            >
              About InvoiceFlow
            </a>
            <a
              href="/faq"
              onClick={(e) => navigateTo('/faq', e)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 transition-colors"
            >
              Frequently Asked Questions
            </a>
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
              href="/invoice-software-small-business"
              onClick={(e) => navigateTo('/invoice-software-small-business', e)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 transition-colors"
            >
              Small Business Software
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
