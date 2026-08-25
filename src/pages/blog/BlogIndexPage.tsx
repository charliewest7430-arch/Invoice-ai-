import React, { useState, useMemo } from 'react';
import { SeoHead } from '../../components/common/SeoHead';
import { BLOG_ARTICLES, BlogArticle } from '../../data/blogArticles';
import {
  BookOpen,
  Search,
  Clock,
  Calendar,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  FileText,
  TrendingUp,
} from 'lucide-react';

interface BlogIndexPageProps {
  onOpenSignup?: () => void;
  onOpenSignin?: () => void;
  onOpenDemo?: () => void;
  onNavigate?: (path: string) => void;
}

export const BlogIndexPage: React.FC<BlogIndexPageProps> = ({
  onOpenSignup,
  onOpenDemo,
  onNavigate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Guides', 'Freelancing', 'Small Business', 'Best Practices', 'Comparisons'];

  const filteredArticles = useMemo(() => {
    return BLOG_ARTICLES.filter((article) => {
      const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q) ||
        article.primaryKeyword.toLowerCase().includes(q) ||
        article.secondaryKeywords.some((k) => k.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const featuredArticle = useMemo(() => {
    return BLOG_ARTICLES.find((a) => a.featured) || BLOG_ARTICLES[0];
  }, []);

  const regularArticles = useMemo(() => {
    if (searchQuery || selectedCategory !== 'All') {
      return filteredArticles;
    }
    return filteredArticles.filter((a) => a.slug !== featuredArticle.slug);
  }, [filteredArticles, featuredArticle, searchQuery, selectedCategory]);

  const navigateTo = (path: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
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
            item: 'https://www.yourinvoiceflow.com/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Blog',
            item: 'https://www.yourinvoiceflow.com/blog',
          },
        ],
      },
      {
        '@type': 'Blog',
        name: 'InvoiceFlow Invoicing & Billing Blog',
        description:
          'Expert guides, freelance invoicing strategies, small business cash flow tips, and best practices for creating professional invoices.',
        url: 'https://www.yourinvoiceflow.com/blog',
        publisher: {
          '@type': 'Organization',
          name: 'InvoiceFlow',
          url: 'https://www.yourinvoiceflow.com/',
        },
        blogPost: BLOG_ARTICLES.map((article) => ({
          '@type': 'BlogPosting',
          headline: article.title,
          description: article.metaDescription,
          url: article.canonicalUrl,
          datePublished: article.publishedDate,
          dateModified: article.updatedDate,
          author: {
            '@type': 'Organization',
            name: article.author.name,
          },
        })),
      },
    ],
  };

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-200">
      <SeoHead
        title="Invoicing Guides, Tips & Financial Workflows Blog | InvoiceFlow"
        description="Expert invoicing guides, freelance billing tips, small business accounting best practices, and templates to help you get paid on time."
        canonicalUrl="https://www.yourinvoiceflow.com/blog"
        schemaJson={schemaData}
      />

      {/* Breadcrumb Header */}
      <div className="space-y-4">
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <a
            href="/"
            onClick={(e) => navigateTo('/', e)}
            className="hover:text-blue-600 transition-colors"
          >
            Home
          </a>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">Blog</span>
        </nav>

        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200/80 rounded-full text-blue-700 text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Invoicing Guides & Best Practices</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Master Your Invoicing & Get Paid Faster
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Practical, actionable guides on creating invoices, setting payment terms, handling international clients, and optimizing small business cash flow.
          </p>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px] sm:min-w-[300px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search guides (e.g., freelancer, terms)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Featured Article Hero (Shown if no search query & All categories selected) */}
      {!searchQuery && selectedCategory === 'All' && featuredArticle && (
        <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50/40 border border-slate-200 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs hover:border-blue-300 transition-all group">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-black uppercase tracking-wider">
                  Featured Guide
                </span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {featuredArticle.readTimeMinutes} min read
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                <a
                  href={`/blog/${featuredArticle.slug}`}
                  onClick={(e) => navigateTo(`/blog/${featuredArticle.slug}`, e)}
                >
                  {featuredArticle.title}
                </a>
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {featuredArticle.excerpt}
              </p>

              <div className="flex items-center gap-4 pt-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                    {featuredArticle.author.avatarInitials}
                  </div>
                  <span className="font-semibold text-slate-700">{featuredArticle.author.name}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Updated {featuredArticle.updatedDate}</span>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-auto">
              <a
                href={`/blog/${featuredArticle.slug}`}
                onClick={(e) => navigateTo(`/blog/${featuredArticle.slug}`, e)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>Read Full Guide</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Article Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>
              {searchQuery
                ? `Search Results (${filteredArticles.length})`
                : selectedCategory === 'All'
                ? 'All Articles'
                : `${selectedCategory} Articles (${filteredArticles.length})`}
            </span>
          </h3>
        </div>

        {regularArticles.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <p className="text-sm font-bold text-slate-700">No articles matched your search.</p>
            <p className="text-xs text-slate-500">Try adjusting your keywords or category filter.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularArticles.map((article) => (
              <article
                key={article.slug}
                className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-3xl p-6 flex flex-col justify-between space-y-5 transition-all shadow-xs hover:shadow-md group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold">
                      {article.category}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" />
                      {article.readTimeMinutes} min read
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    <a
                      href={`/blog/${article.slug}`}
                      onClick={(e) => navigateTo(`/blog/${article.slug}`, e)}
                    >
                      {article.title}
                    </a>
                  </h4>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-[9px]">
                      {article.author.avatarInitials}
                    </div>
                    <span className="text-[11px] font-medium text-slate-600 truncate max-w-[130px]">
                      {article.author.name}
                    </span>
                  </div>

                  <a
                    href={`/blog/${article.slug}`}
                    onClick={(e) => navigateTo(`/blog/${article.slug}`, e)}
                    className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-xs"
                  >
                    <span>Read</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Trust & E-E-A-T Signal Callout */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-600">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">Editorial Standards & Compliance Notice</h4>
            <p className="leading-relaxed">
              Our guides are created by billing workflow researchers to provide practical educational insights. Tax and invoicing rules vary by jurisdiction—always verify with your local tax authority or qualified accountant.
            </p>
          </div>
        </div>
      </div>

      {/* Product CTA Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-blue-300 text-xs font-bold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fast, Intelligent Invoicing</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
            Create Your Next Invoice in 60 Seconds
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Generate polished PDF invoices, track payment status, and automate courteous reminders with InvoiceFlow.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
          <button
            onClick={onOpenSignup}
            className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] cursor-pointer"
          >
            Create Your First Invoice Free
          </button>
          <button
            onClick={onOpenDemo}
            className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl backdrop-blur-xs transition-all cursor-pointer"
          >
            Explore Live Demo
          </button>
        </div>

        <div className="flex items-center justify-center gap-6 text-[11px] text-slate-400 pt-2 relative z-10">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 7-Day Free Pro Access
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> No Credit Card Required
          </span>
        </div>
      </div>

      {/* Internal Landing Page Directory */}
      <div className="border-t border-slate-200 pt-8 space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
          Explore Invoicing Tools & Solutions
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs font-bold text-slate-700">
          <a
            href="/ai-invoice-generator"
            onClick={(e) => navigateTo('/ai-invoice-generator', e)}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all"
          >
            AI Invoice Generator
          </a>
          <a
            href="/free-invoice-generator"
            onClick={(e) => navigateTo('/free-invoice-generator', e)}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all"
          >
            Free Invoice Generator
          </a>
          <a
            href="/invoice-generator"
            onClick={(e) => navigateTo('/invoice-generator', e)}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all"
          >
            Invoice Generator
          </a>
          <a
            href="/invoice-maker"
            onClick={(e) => navigateTo('/invoice-maker', e)}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all"
          >
            Invoice Maker
          </a>
          <a
            href="/freelance-invoice-generator"
            onClick={(e) => navigateTo('/freelance-invoice-generator', e)}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all"
          >
            Freelance Invoice Generator
          </a>
          <a
            href="/invoice-software-small-business"
            onClick={(e) => navigateTo('/invoice-software-small-business', e)}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all"
          >
            Small Business Software
          </a>
          <a
            href="/online-invoice-generator"
            onClick={(e) => navigateTo('/online-invoice-generator', e)}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all"
          >
            Online Invoicing
          </a>
        </div>
      </div>
    </div>
  );
};
