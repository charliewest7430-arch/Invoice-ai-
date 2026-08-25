import React, { useState } from 'react';
import { SeoHead } from '../../components/common/SeoHead';
import { BLOG_ARTICLES, BlogArticle } from '../../data/blogArticles';
import {
  ChevronRight,
  Clock,
  Calendar,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Share2,
  Check,
  BookOpen,
  ArrowLeft,
  Info,
  Lightbulb,
} from 'lucide-react';

interface BlogPostPageProps {
  slug: string;
  onOpenSignup?: () => void;
  onOpenSignin?: () => void;
  onOpenDemo?: () => void;
  onNavigate?: (path: string) => void;
}

export const BlogPostPage: React.FC<BlogPostPageProps> = ({
  slug,
  onOpenSignup,
  onOpenDemo,
  onNavigate,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const article: BlogArticle | undefined = BLOG_ARTICLES.find((a) => a.slug === slug);

  const navigateTo = (path: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!article) {
    return (
      <div className="py-20 px-4 text-center max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-black text-slate-900">Article Not Found</h1>
        <p className="text-sm text-slate-600">
          The requested guide could not be found. It may have moved or been updated.
        </p>
        <a
          href="/blog"
          onClick={(e) => navigateTo('/blog', e)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to All Guides</span>
        </a>
      </div>
    );
  }

  // Resolve related articles
  const relatedArticles: BlogArticle[] = article.relatedSlugs
    .map((s) => BLOG_ARTICLES.find((a) => a.slug === s))
    .filter((a): a is BlogArticle => Boolean(a));

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
            name: 'Blog',
            item: 'https://www.yourinvoiceflow.com/blog',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: article.title,
            item: article.canonicalUrl,
          },
        ],
      },
      {
        '@type': 'BlogPosting',
        headline: article.title,
        description: article.metaDescription,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': article.canonicalUrl,
        },
        url: article.canonicalUrl,
        datePublished: article.publishedDate,
        dateModified: article.updatedDate,
        author: {
          '@type': 'Organization',
          name: article.author.name,
          url: 'https://www.yourinvoiceflow.com/',
        },
        publisher: {
          '@type': 'Organization',
          name: 'InvoiceFlow',
          url: 'https://www.yourinvoiceflow.com/',
        },
        keywords: [article.primaryKeyword, ...article.secondaryKeywords].join(', '),
      },
      ...(article.faqs && article.faqs.length > 0
        ? [
            {
              '@type': 'FAQPage',
              mainEntity: article.faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-200">
      <SeoHead
        title={article.seoTitle}
        description={article.metaDescription}
        canonicalUrl={article.canonicalUrl}
        schemaJson={schemaData}
      />

      {/* Breadcrumb Navigation */}
      <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
        <a
          href="/"
          onClick={(e) => navigateTo('/', e)}
          className="hover:text-blue-600 transition-colors"
        >
          Home
        </a>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <a
          href="/blog"
          onClick={(e) => navigateTo('/blog', e)}
          className="hover:text-blue-600 transition-colors"
        >
          Blog
        </a>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-400">{article.category}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-xs">
          {article.title}
        </span>
      </nav>

      {/* Article Header & Metadata */}
      <header className="space-y-6 max-w-4xl">
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-black uppercase tracking-wider">
            {article.category}
          </span>
          <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {article.readTimeMinutes} min read
          </span>
          <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Updated {article.updatedDate}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
          {article.title}
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          {article.excerpt}
        </p>

        <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {article.author.avatarInitials}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{article.author.name}</p>
              <p className="text-[11px] text-slate-500">{article.author.role}</p>
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Share Guide</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Table of Contents Card */}
      {article.tableOfContents.length > 0 && (
        <div className="bg-slate-50/80 border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Table of Contents</span>
          </h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
            {article.tableOfContents.map((item, idx) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="flex items-center gap-2 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-white"
                >
                  <span className="text-blue-600 font-bold">{idx + 1}.</span>
                  <span>{item.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Main Article Content */}
      <article className="space-y-12 text-slate-800 leading-relaxed text-sm sm:text-base">
        {article.contentSections.map((section) => (
          <section key={section.id} id={section.id} className="space-y-5 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug pt-2 border-t border-slate-100 first:border-0 first:pt-0">
              {section.heading}
            </h2>

            {section.paragraphs.map((p, idx) => (
              <p key={idx} className="text-slate-600 leading-relaxed">
                {p}
              </p>
            ))}

            {/* Callouts */}
            {section.callout && (
              <div
                className={`p-5 sm:p-6 rounded-2xl border text-xs sm:text-sm space-y-1.5 ${
                  section.callout.type === 'tip'
                    ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                    : section.callout.type === 'warning'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : section.callout.type === 'example'
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 font-mono text-xs whitespace-pre-line'
                    : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-black">
                  {section.callout.type === 'tip' && <Lightbulb className="w-4 h-4 text-blue-600" />}
                  {section.callout.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600" />}
                  {section.callout.type === 'info' && <Info className="w-4 h-4 text-slate-600" />}
                  <span>{section.callout.title}</span>
                </div>
                <p className="leading-relaxed font-sans">{section.callout.body}</p>
              </div>
            )}

            {/* List items */}
            {section.listItems && section.listItems.length > 0 && (
              <ul className="space-y-2.5 pl-2">
                {section.listItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Tables */}
            {section.table && (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-2xs">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-900 font-bold">
                      {section.table.headers.map((h, idx) => (
                        <th key={idx} className="p-3.5">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {section.table.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/50">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-3.5">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Contextual Internal Links */}
            {section.internalLinks && section.internalLinks.length > 0 && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.internalLinks.map((link, lIdx) => (
                  <a
                    key={lIdx}
                    href={link.href}
                    onClick={(e) => navigateTo(link.href, e)}
                    className="p-4 bg-white border border-slate-200/90 rounded-2xl hover:border-blue-500 hover:shadow-xs transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {link.text}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-snug">{link.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                  </a>
                ))}
              </div>
            )}
          </section>
        ))}

        {/* FAQs Section */}
        {article.faqs && article.faqs.length > 0 && (
          <section id="faq" className="space-y-6 pt-6 border-t border-slate-200">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-blue-600" />
              <span>Frequently Asked Questions</span>
            </h2>
            <div className="space-y-3">
              {article.faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl p-5 cursor-pointer shadow-2xs"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                >
                  <div className="flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900">
                    <span>{faq.question}</span>
                    <span className="text-blue-600 text-base">{openFaqIndex === idx ? '−' : '+'}</span>
                  </div>
                  {openFaqIndex === idx && (
                    <p className="text-xs sm:text-sm text-slate-600 pt-3 border-t border-slate-100 mt-3 leading-relaxed">
                      {faq.answer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </article>

      {/* In-Article Product CTA Banner */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-8 sm:p-10 shadow-lg space-y-6 text-center">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-blue-100 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Automate Your Invoicing Workflow</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
            Create your next invoice with InvoiceFlow
          </h3>
          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
            Generate clean PDF invoices, manage client billing, and track payments seamlessly with our modern billing software.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onOpenSignup}
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-100 text-blue-700 text-xs font-black rounded-2xl shadow-md transition-all hover:scale-[1.02] cursor-pointer"
          >
            Create Your First Invoice Free
          </button>
          <button
            onClick={onOpenDemo}
            className="w-full sm:w-auto px-6 py-3.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer"
          >
            Explore Live Demo
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 text-[11px] text-blue-200">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" /> Free 7-Day Trial
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" /> Instant PDF & Web Invoicing
          </span>
        </div>
      </div>

      {/* Related Articles Section */}
      {relatedArticles.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>Related Guides & Articles</span>
            </h3>
            <a
              href="/blog"
              onClick={(e) => navigateTo('/blog', e)}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              View all guides →
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((rel) => (
              <article
                key={rel.slug}
                className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col justify-between space-y-4 hover:border-blue-400 transition-all shadow-2xs group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold">
                      {rel.category}
                    </span>
                    <span className="text-slate-400 text-[10px]">{rel.readTimeMinutes} min</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    <a
                      href={`/blog/${rel.slug}`}
                      onClick={(e) => navigateTo(`/blog/${rel.slug}`, e)}
                    >
                      {rel.title}
                    </a>
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {rel.excerpt}
                  </p>
                </div>

                <a
                  href={`/blog/${rel.slug}`}
                  onClick={(e) => navigateTo(`/blog/${rel.slug}`, e)}
                  className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 text-xs pt-2 border-t border-slate-100"
                >
                  <span>Read Guide</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Back to Blog Footer Link */}
      <div className="text-center pt-4">
        <a
          href="/blog"
          onClick={(e) => navigateTo('/blog', e)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Invoicing Guides</span>
        </a>
      </div>
    </div>
  );
};
