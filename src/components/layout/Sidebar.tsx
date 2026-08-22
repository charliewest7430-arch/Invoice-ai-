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
  HelpCircle,
  X,
  Receipt,
  Zap,
  ChevronRight,
  LifeBuoy,
  Repeat,
  Package,
  Wallet,
  FileCheck,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { activePage, setActivePage, subscription, usage, business, openUpgradeModal, openSupportModal } = useApp();
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

  const isPro = subscription.plan === 'pro' || subscription.plan === 'enterprise';
  const userInitial = (profile?.full_name || user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 lg:w-20 xl:w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top Section: Brand + Navigation */}
        <div className="p-4 lg:p-3 xl:p-5 space-y-6">
          {/* Logo & Brand Header */}
          <div className="flex items-center justify-between">
            <div
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="lg:hidden xl:block">
                <h1 className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-none">
                  InvoiceFlow
                </h1>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {business?.name || 'Business Suite'}
                </span>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activePage === item.id ||
                (activePage === 'invoice_detail' && item.id === 'invoices') ||
                (activePage === 'new_invoice' && item.id === 'invoices');

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={item.label}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <div className="shrink-0 flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
                  </div>
                  <span className="lg:hidden xl:inline truncate flex-1 text-left">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      className={`lg:hidden xl:inline text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
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

        {/* Bottom Section: Help, Plan Meter & User Avatar */}
        <div className="p-4 lg:p-3 xl:p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* Plan Usage Box (Visible on full sidebar) */}
          <div className="hidden xl:block p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usage</span>
              <span
                className={`font-bold px-1.5 py-0.2 rounded text-[10px] uppercase ${
                  isPro
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                }`}
              >
                {subscription.plan}
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
                    handleNavClick('billing');
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Zap className="w-3 h-3 text-amber-300 fill-current" />
                <span>Upgrade Plan</span>
              </button>
            )}
          </div>

          {/* Help & Support Shortcut */}
          <div className="grid grid-cols-2 gap-1 lg:flex lg:flex-col xl:grid xl:grid-cols-2">
            <button
              onClick={() => handleNavClick('ai_assistant')}
              className="flex items-center justify-center lg:justify-start xl:justify-center gap-1.5 px-2 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer"
              title="AI Assistant"
            >
              <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
              <span className="lg:hidden xl:inline">AI Help</span>
            </button>
            <button
              onClick={() => openSupportModal('Other')}
              className="flex items-center justify-center lg:justify-start xl:justify-center gap-1.5 px-2 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer"
              title="Contact Support"
            >
              <LifeBuoy className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="lg:hidden xl:inline">Support</span>
            </button>
          </div>

          {/* User Profile Thumbnail */}
          <div
            onClick={() => handleNavClick('settings')}
            className="flex items-center gap-3 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
          >
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {userInitial}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            </div>
            <div className="lg:hidden xl:block min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Alex Morgan'}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                {business?.name || 'My Business'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

