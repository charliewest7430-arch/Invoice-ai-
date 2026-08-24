import React from 'react';
import { useApp, NavigationPage } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Activity as ActivityIcon,
  Sparkles,
  CreditCard,
  Settings,
  X,
  Receipt,
  Zap,
  LifeBuoy,
  Repeat,
  Package,
  Wallet,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const {
    activePage,
    setActivePage,
    subscription,
    usage,
    business,
    openUpgradeModal,
    openSupportModal,
    isSidebarCollapsed,
    toggleSidebar,
  } = useApp();
  const { user, profile, isDemoUser } = useAuth();

  const navItems: { id: NavigationPage; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'recurring_invoices', label: 'Recurring', icon: Repeat },
    { id: 'receipts', label: 'Receipts', icon: FileCheck },
    { id: 'products', label: 'Products & Rates', icon: Package },
    { id: 'expenses', label: 'Expenses', icon: Wallet },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'analytics', label: 'Reports & P&L', icon: BarChart3 },
    { id: 'activities', label: 'Activity Log', icon: ActivityIcon },
    { id: 'ai_assistant', label: 'AI Assistant', icon: Sparkles, badge: 'AI' },
    { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (page: NavigationPage) => {
    setActivePage(page);
    onCloseMobile();
  };

  const isTrialActive =
    subscription.status === 'trialing' &&
    Boolean(subscription.trial_ends_at && new Date(subscription.trial_ends_at).getTime() > Date.now());

  const trialDaysRemaining =
    subscription.trial_ends_at && new Date(subscription.trial_ends_at).getTime() > Date.now()
      ? Math.max(1, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

  const isPro = subscription.plan === 'pro' || subscription.plan === 'enterprise' || isTrialActive;
  const userInitial = (profile?.full_name || user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase();
  const userDisplayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || (isDemoUser ? 'Alex Morgan' : 'User');
  const businessDisplayName = business?.name || 'My Business';

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MOBILE / TABLET OFF-CANVAS DRAWER (< lg)                              */}
      {/* ========================================================================= */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-none truncate">
                  InvoiceFlow
                </h1>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate block">
                  {businessDisplayName}
                </span>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Navigation Links */}
          <nav className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activePage === item.id ||
                (activePage === 'invoice_detail' && item.id === 'invoices') ||
                (activePage === 'new_invoice' && item.id === 'invoices');

              return (
                <button
                  key={`mobile-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Bottom Section */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="p-3 bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plan Usage</span>
              <span
                className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase ${
                  isTrialActive
                    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                    : isPro
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                }`}
              >
                {isTrialActive ? `${trialDaysRemaining}d trial` : subscription.plan}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min((usage.invoice_count_month / 5) * 100, 100)}%` }}
              />
            </div>
            {!isPro && (
              <button
                onClick={() => {
                  onCloseMobile();
                  if (isDemoUser || !user) {
                    openUpgradeModal('pro');
                  } else {
                    setActivePage('billing');
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Zap className="w-3 h-3 text-amber-300 fill-current" />
                <span>Upgrade Plan</span>
              </button>
            )}
          </div>

          <div
            onClick={() => handleNavClick('settings')}
            className="flex items-center gap-3 p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                {userDisplayName}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                {businessDisplayName}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. DESKTOP IN-FLOW COLLAPSIBLE SIDEBAR (lg:flex)                          */}
      {/* Sits beside main content in standard flex flow - NEVER blocks UI          */}
      {/* ========================================================================= */}
      <aside
        className={`hidden lg:flex flex-col justify-between shrink-0 sticky top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 ease-in-out z-20 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="p-3.5 space-y-4">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'}`}>
            <div
              onClick={() => setActivePage('dashboard')}
              className="flex items-center gap-3 cursor-pointer group min-w-0"
              title="InvoiceFlow Dashboard"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0 animate-fade-in overflow-hidden">
                  <h1 className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-none truncate">
                    InvoiceFlow
                  </h1>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate block mt-0.5">
                    {businessDisplayName}
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Collapse / Expand Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="space-y-1 pt-1 max-h-[calc(100vh-290px)] overflow-y-auto pr-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activePage === item.id ||
                (activePage === 'invoice_detail' && item.id === 'invoices') ||
                (activePage === 'new_invoice' && item.id === 'invoices');

              return (
                <button
                  key={`desktop-${item.id}`}
                  onClick={() => setActivePage(item.id)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3'
                  } py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <div className="shrink-0 flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`} />
                  </div>

                  {!isSidebarCollapsed && (
                    <>
                      <span className="truncate flex-1 text-left ml-3">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}

                  {/* Floating Hover Tooltip for Collapsed State */}
                  {isSidebarCollapsed && (
                    <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-medium rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Desktop Bottom Section */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* Plan Usage & Upgrade Box */}
          {!isSidebarCollapsed ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-xl space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usage</span>
                <span
                  className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase ${
                    isTrialActive
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      : isPro
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {isTrialActive ? `${trialDaysRemaining}d trial` : subscription.plan}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min((usage.invoice_count_month / 5) * 100, 100)}%` }}
                />
              </div>
              {!isPro && (
                <button
                  onClick={() => {
                    if (isDemoUser || !user) {
                      openUpgradeModal('pro');
                    } else {
                      setActivePage('billing');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <Zap className="w-3 h-3 text-amber-300 fill-current" />
                  <span>Upgrade Plan</span>
                </button>
              )}
            </div>
          ) : (
            /* Compact Collapsed Usage Indicator */
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => {
                  if (isDemoUser || !user) {
                    openUpgradeModal('pro');
                  } else {
                    setActivePage('billing');
                  }
                }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isPro
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100'
                    : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 hover:bg-blue-100'
                }`}
                title={`Plan: ${subscription.plan.toUpperCase()} (Click to manage)`}
              >
                <Zap className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Help & Support Shortcuts */}
          {!isSidebarCollapsed ? (
            <div className="grid grid-cols-2 gap-1.5 animate-fade-in">
              <button
                onClick={() => setActivePage('ai_assistant')}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer"
                title="AI Assistant"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span>AI Help</span>
              </button>
              <button
                onClick={() => openSupportModal('Other')}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer"
                title="Contact Support"
              >
                <LifeBuoy className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Support</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setActivePage('ai_assistant')}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="AI Assistant"
              >
                <Sparkles className="w-4 h-4 text-purple-500" />
              </button>
              <button
                onClick={() => openSupportModal('Other')}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Contact Support"
              >
                <LifeBuoy className="w-4 h-4 text-blue-500" />
              </button>
            </div>
          )}

          {/* User Profile Area */}
          <div
            onClick={() => setActivePage('settings')}
            className={`flex items-center ${
              isSidebarCollapsed ? 'justify-center p-1' : 'gap-3 p-1.5'
            } hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors`}
            title={isSidebarCollapsed ? `${userDisplayName} (${businessDisplayName})` : undefined}
          >
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {userInitial}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            </div>

            {!isSidebarCollapsed && (
              <div className="min-w-0 flex-1 animate-fade-in">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                  {userDisplayName}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                  {businessDisplayName}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
