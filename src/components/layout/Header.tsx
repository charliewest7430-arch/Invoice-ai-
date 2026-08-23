import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import {
  Menu,
  Sparkles,
  Plus,
  Search,
  Database,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Bell,
  HelpCircle,
  Zap,
  Sun,
  Moon,
  LifeBuoy,
  Palette,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  onOpenAiModal: () => void;
  onOpenNewInvoice: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileSidebar,
  onOpenAiModal,
  onOpenNewInvoice,
}) => {
  const { user, profile, signOut, isDemoUser } = useAuth();
  const { activePage, setActivePage, business, subscription, openSupportModal } = useApp();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const [isGlobalSearchModalOpen, setIsGlobalSearchModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navTabs = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'analytics', label: 'Reports' },
    { id: 'clients', label: 'Clients' },
  ];

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    (isDemoUser ? 'Alex Morgan' : 'User');
  const businessName = business?.name || 'My Business';
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-2.5 transition-colors">
        <div className="flex items-center justify-between gap-3 max-w-[1600px] mx-auto">
          {/* Left: Mobile Toggle + Clean Nav Tabs */}
          <div className="flex items-center gap-6">
            <button
              onClick={onOpenMobileSidebar}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl lg:hidden transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Reference Design: Top Level View Tabs */}
            <nav className="hidden md:flex items-center gap-6">
              {navTabs.map((tab) => {
                const isActive =
                  activePage === tab.id ||
                  (tab.id === 'invoices' && (activePage === 'invoice_detail' || activePage === 'new_invoice'));
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActivePage(tab.id as any)}
                    className={`relative py-2 text-sm font-bold transition-colors cursor-pointer ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Controls: Search, Upgrade/AI, Notifications, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Search Button */}
            <div
              onClick={() => setIsGlobalSearchModalOpen(true)}
              className="relative hidden sm:flex items-center bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-400 dark:text-slate-400 cursor-pointer transition-all w-40 lg:w-52"
            >
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <span className="truncate">Search...</span>
              <kbd className="ml-auto px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-mono text-slate-400 shadow-2xs">
                ⌘K
              </kbd>
            </div>

            {/* Mobile Search Button */}
            <button
              onClick={() => setIsGlobalSearchModalOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl sm:hidden cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Help & Support Button */}
            <button
              onClick={() => openSupportModal('Other')}
              title="Help & Contact Support"
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors hidden sm:block cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Notification Bell with Badge */}
            <button
              onClick={() => setActivePage('activities')}
              title="Recent Activities"
              className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            </button>

            {/* AI Generator Button */}
            <button
              onClick={onOpenAiModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="hidden sm:inline">AI Invoice</span>
            </button>

            {/* Primary Action Button */}
            <button
              onClick={onOpenNewInvoice}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Invoice</span>
            </button>

            {/* User Profile Pill Menu */}
            <div className="relative pl-1 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {userInitial}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[100px]">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight truncate max-w-[100px]">
                    {businessName}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 space-y-1 animate-slide-up">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate">{user?.email}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-1.5 py-0.2 rounded">
                        {subscription.plan.toUpperCase()} PLAN
                      </span>
                      {isDemoUser && (
                        <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-1.5 py-0.2 rounded">
                          Demo Mode
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActivePage('settings');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>Business Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setActivePage('settings');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <Palette className="w-4 h-4 text-slate-400" />
                    <span>Appearance & Theme</span>
                  </button>

                  <button
                    onClick={() => {
                      setActivePage('billing');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span>Billing & Subscriptions</span>
                  </button>

                  <button
                    onClick={() => {
                      openSupportModal('Other');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <LifeBuoy className="w-4 h-4 text-indigo-500" />
                    <span>Contact Support</span>
                  </button>

                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        signOut();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchModalOpen}
        onClose={() => setIsGlobalSearchModalOpen(false)}
      />
    </>
  );
};

