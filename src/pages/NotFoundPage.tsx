import React from 'react';
import { SeoHead } from '../components/common/SeoHead';
import {
  FileQuestion,
  ArrowLeft,
  Sparkles,
  Receipt,
  FileText,
  Building2,
  Briefcase,
  Globe2,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

interface NotFoundPageProps {
  onNavigate?: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  const navigateTo = (path: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const helpfulLinks = [
    {
      title: 'AI Invoice Generator',
      desc: 'Generate professional invoices using smart natural language prompts.',
      href: '/ai-invoice-generator',
      icon: Sparkles,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      title: 'Free Invoice Generator',
      desc: 'Create, customize, and export clean PDF invoices at zero cost.',
      href: '/free-invoice-generator',
      icon: Receipt,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Online Invoice Generator',
      desc: 'Access your invoices, client directory, and billing from any browser.',
      href: '/online-invoice-generator',
      icon: Globe2,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Invoice Maker',
      desc: 'Design beautifully formatted invoices with custom logos and terms.',
      href: '/invoice-maker',
      icon: FileText,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      title: 'Freelance Invoicing',
      desc: 'Tailored billing for designers, developers, writers, and consultants.',
      href: '/freelance-invoice-generator',
      icon: Briefcase,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      title: 'Small Business Software',
      desc: 'Automate reminders, retainers, and itemized expense management.',
      href: '/invoice-software-small-business',
      icon: Building2,
      color: 'text-cyan-600 bg-cyan-50',
    },
    {
      title: 'Invoicing Guides & Blog',
      desc: 'Learn billing best practices, freelancer tips, and tax essentials.',
      href: '/blog',
      icon: BookOpen,
      color: 'text-rose-600 bg-rose-50',
    },
  ];

  return (
    <div className="min-h-[70vh] py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in duration-200">
      <SeoHead
        title="Page Not Found (404) | InvoiceFlow"
        description="The page you requested could not be found. Explore InvoiceFlow's free invoice generator, billing tools, or guides."
        canonicalUrl="https://www.yourinvoiceflow.com/404"
        noIndex={true}
        robots="noindex, nofollow"
      />

      <div className="space-y-4 max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600 shadow-sm">
          <FileQuestion className="w-8 h-8" aria-hidden="true" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold tracking-wider uppercase">
          <span>Error 404 • Page Not Found</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          We couldn't find that page
        </h1>

        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          The link you followed may have expired, moved, or the web address may have been entered incorrectly.
        </p>

        <div className="pt-2">
          <a
            href="/"
            onClick={(e) => navigateTo('/', e)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Homepage</span>
          </a>
        </div>
      </div>

      {/* Helpful Public Pages Directory */}
      <div className="w-full text-left pt-6 border-t border-slate-200 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Popular Pages & Invoicing Tools
          </h2>
          <span className="text-xs font-medium text-slate-500">Explore InvoiceFlow</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {helpfulLinks.map((item, idx) => {
            const Icon = item.icon;
            return (
              <a
                key={idx}
                href={item.href}
                onClick={(e) => navigateTo(item.href, e)}
                className="group p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${item.color}`}>
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="pt-3 flex items-center text-xs font-semibold text-blue-600 gap-1 group-hover:gap-1.5 transition-all">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};
