import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LandingPage } from './pages/LandingPage';
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

  const isResetPasswordRoute =
    isPasswordRecovery ||
    window.location.pathname === '/reset-password' ||
    window.location.pathname === '/reset-password/' ||
    window.location.pathname.startsWith('/reset-password') ||
    window.location.hash.includes('type=recovery') ||
    window.location.search.includes('type=recovery');

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

  // If user is not signed in and not in demo mode, show Landing Page
  if (!isAuthenticated && !isDemoUser) {
    console.info('[Route Debug] redirecting to LandingPage because user is unauthenticated and demo mode is inactive');
    return <LandingPage />;
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
