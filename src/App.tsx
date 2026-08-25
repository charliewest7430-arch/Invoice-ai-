import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LandingPage } from './pages/LandingPage';
import { PublicLayout } from './components/layout/PublicLayout';
import { AiInvoiceGeneratorPage } from './pages/seo/AiInvoiceGeneratorPage';
import { FreeInvoiceGeneratorPage } from './pages/seo/FreeInvoiceGeneratorPage';
import { InvoiceGeneratorPage } from './pages/seo/InvoiceGeneratorPage';
import { InvoiceMakerPage } from './pages/seo/InvoiceMakerPage';
import { SmallBusinessInvoiceSoftwarePage } from './pages/seo/SmallBusinessInvoiceSoftwarePage';
import { FreelanceInvoiceGeneratorPage } from './pages/seo/FreelanceInvoiceGeneratorPage';
import { OnlineInvoiceGeneratorPage } from './pages/seo/OnlineInvoiceGeneratorPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { FaqPage } from './pages/FaqPage';
import { BlogIndexPage } from './pages/blog/BlogIndexPage';
import { BlogPostPage } from './pages/blog/BlogPostPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { InvoiceForm } from './components/invoice/InvoiceForm';
import { ReceiptsPage } from './pages/ReceiptsPage';
import { ProductsPage } from './pages/ProductsPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { RecurringInvoicesPage } from './pages/RecurringInvoicesPage';
import { ClientsPage } from './pages/ClientsPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { BillingPage } from './pages/BillingPage';
import { SettingsPage } from './pages/SettingsPage';
import { AiInvoiceModal } from './components/invoice/AiInvoiceModal';
import { AuthUpgradeModal } from './components/auth/AuthUpgradeModal';
import { SupportModal } from './components/common/SupportModal';
import { ToastContainer } from './components/common/Toast';
import { initTikTokPixel, trackPageView } from './lib/tiktokPixel';

const MainAppContent: React.FC = () => {
  const { user, isAuthenticated, isDemoUser, isPasswordRecovery, loading } = useAuth();
  const {
    activePage,
    setActivePage,
    setSelectedInvoiceId,
    isUpgradeModalOpen,
    closeUpgradeModal,
    pendingUpgradePlan,
    isSupportModalOpen,
    closeSupportModal,
    supportCategory,
  } = useApp();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const isResetPasswordRoute =
    isPasswordRecovery ||
    currentPath === '/reset-password' ||
    currentPath === '/reset-password/' ||
    currentPath.startsWith('/reset-password') ||
    window.location.hash.includes('type=recovery') ||
    window.location.search.includes('type=recovery');

  // Track PageView on SPA page navigation
  useEffect(() => {
    if (loading) return;
    if (isResetPasswordRoute) {
      trackPageView('Reset Password');
    } else if (!isAuthenticated && !isDemoUser) {
      trackPageView(`Public Page: ${currentPath}`);
    } else if (activePage) {
      trackPageView(activePage);
    }
  }, [activePage, isAuthenticated, isDemoUser, isResetPasswordRoute, loading, currentPath]);

  if (isResetPasswordRoute) {
    console.info('[Route Debug] rendering ResetPasswordPage (password recovery active)');
    return <ResetPasswordPage />;
  }

  // Prevent flash or premature redirection while Supabase restores session
  if (loading) {
    console.info('[Route Debug] rendering Loading spinner (auth state loading...)');
    return (
      <div className="min-h-screen bg-[#f0f4f9] dark:bg-[#0b0f19] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Loading InvoiceFlow AI...</p>
        </div>
      </div>
    );
  }

  // If user is not signed in and not in demo mode, show Landing Page or corresponding SEO Landing Page
  if (!isAuthenticated && !isDemoUser) {
    const normalizedPath = currentPath.replace(/\/$/, '') || '/';
    console.info(`[Route Debug] rendering public page for path: ${normalizedPath}`);

    const handlePublicNavigate = (path: string) => {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (normalizedPath === '/ai-invoice-generator') {
      return (
        <PublicLayout activePath="/ai-invoice-generator" onNavigate={handlePublicNavigate}>
          <AiInvoiceGeneratorPage />
        </PublicLayout>
      );
    }
    if (normalizedPath === '/free-invoice-generator') {
      return (
        <PublicLayout activePath="/free-invoice-generator" onNavigate={handlePublicNavigate}>
          <FreeInvoiceGeneratorPage />
        </PublicLayout>
      );
    }
    if (normalizedPath === '/invoice-generator') {
      return (
        <PublicLayout activePath="/invoice-generator" onNavigate={handlePublicNavigate}>
          <InvoiceGeneratorPage />
        </PublicLayout>
      );
    }
    if (normalizedPath === '/invoice-maker') {
      return (
        <PublicLayout activePath="/invoice-maker" onNavigate={handlePublicNavigate}>
          <InvoiceMakerPage />
        </PublicLayout>
      );
    }
    if (normalizedPath === '/invoice-software-small-business') {
      return (
        <PublicLayout activePath="/invoice-software-small-business" onNavigate={handlePublicNavigate}>
          <SmallBusinessInvoiceSoftwarePage />
        </PublicLayout>
      );
    }
    if (normalizedPath === '/freelance-invoice-generator') {
      return (
        <PublicLayout activePath="/freelance-invoice-generator" onNavigate={handlePublicNavigate}>
          <FreelanceInvoiceGeneratorPage />
        </PublicLayout>
      );
    }
    if (normalizedPath === '/online-invoice-generator') {
      return (
        <PublicLayout activePath="/online-invoice-generator" onNavigate={handlePublicNavigate}>
          <OnlineInvoiceGeneratorPage />
        </PublicLayout>
      );
    }
    if (normalizedPath === '/about') {
      return (
        <PublicLayout activePath="/about" onNavigate={handlePublicNavigate}>
          <AboutPage onNavigate={handlePublicNavigate} />
        </PublicLayout>
      );
    }
    if (normalizedPath === '/contact') {
      return (
        <PublicLayout activePath="/contact" onNavigate={handlePublicNavigate}>
          <ContactPage onNavigate={handlePublicNavigate} />
        </PublicLayout>
      );
    }
    if (normalizedPath === '/faq') {
      return (
        <PublicLayout activePath="/faq" onNavigate={handlePublicNavigate}>
          <FaqPage onNavigate={handlePublicNavigate} />
        </PublicLayout>
      );
    }
    if (normalizedPath === '/blog') {
      return (
        <PublicLayout activePath="/blog" onNavigate={handlePublicNavigate}>
          <BlogIndexPage onNavigate={handlePublicNavigate} />
        </PublicLayout>
      );
    }
    if (normalizedPath.startsWith('/blog/')) {
      const slug = normalizedPath.replace('/blog/', '').trim();
      return (
        <PublicLayout activePath="/blog" onNavigate={handlePublicNavigate}>
          <BlogPostPage slug={slug} onNavigate={handlePublicNavigate} />
        </PublicLayout>
      );
    }

    return <LandingPage onNavigate={handlePublicNavigate} />;
  }

  // If user signed in for the first time and hasn't set up business, show Onboarding
  if (activePage === 'onboarding') {
    console.info('[Route Debug] redirecting to Onboarding because activePage is onboarding');
    return <OnboardingPage />;
  }

  console.info(`[Route Debug] redirecting to Dashboard/App because user is authenticated (${user?.email || 'demo user'}), activePage: ${activePage}`);

  return (
    <div className="min-h-screen bg-[#f0f4f9] dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-blue-600 selection:text-white transition-colors">
      {/* Toast Notifications */}
      <ToastContainer />

      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <Header
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenAiModal={() => setIsAiModalOpen(true)}
          onOpenNewInvoice={() => setActivePage('new_invoice')}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto">
          {activePage === 'dashboard' && (
            <DashboardPage
              onOpenNewInvoice={() => setActivePage('new_invoice')}
              onOpenAiModal={() => setIsAiModalOpen(true)}
            />
          )}

          {activePage === 'invoices' && (
            <InvoicesPage
              onOpenNewInvoice={() => setActivePage('new_invoice')}
              onOpenAiModal={() => setIsAiModalOpen(true)}
            />
          )}

          {activePage === 'invoice_detail' && <InvoiceDetailPage />}

          {activePage === 'new_invoice' && (
            <InvoiceForm
              onCancel={() => setActivePage('invoices')}
              onSuccess={(id) => {
                setSelectedInvoiceId(id);
                setActivePage('invoice_detail');
              }}
              onOpenAiModal={() => setIsAiModalOpen(true)}
            />
          )}

          {activePage === 'recurring_invoices' && <RecurringInvoicesPage />}

          {activePage === 'receipts' && <ReceiptsPage />}

          {activePage === 'products' && <ProductsPage />}

          {activePage === 'expenses' && <ExpensesPage />}

          {activePage === 'clients' && <ClientsPage />}

          {activePage === 'activities' && <ActivitiesPage />}

          {activePage === 'ai_assistant' && <AiAssistantPage />}

          {activePage === 'analytics' && <AnalyticsPage />}

          {activePage === 'billing' && <BillingPage />}

          {activePage === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global AI Invoice Generation Modal */}
      <AiInvoiceModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onInvoiceGenerated={(id) => {
          setSelectedInvoiceId(id);
          setActivePage('invoice_detail');
        }}
      />

      {/* Upgrade to Pro Auth Gate Modal */}
      <AuthUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={closeUpgradeModal}
        targetPlan={pendingUpgradePlan}
      />

      {/* User Support / Complaint Modal */}
      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={closeSupportModal}
        initialCategory={supportCategory}
      />
    </div>
  );
};

export function App() {
  useEffect(() => {
    initTikTokPixel();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <MainAppContent />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
