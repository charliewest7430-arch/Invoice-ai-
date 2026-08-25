import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme, ThemePreference } from '../context/ThemeContext';
import { SUPPORTED_CURRENCIES } from '../types';
import { SUPPORT_EMAIL } from '../components/common/SupportModal';
import {
  Building2,
  Key,
  Copy,
  Check,
  Save,
  Sun,
  Moon,
  Monitor,
  LifeBuoy,
  Mail,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { business, updateBusiness, showToast, openSupportModal } = useApp();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [name, setName] = useState(business.name || '');
  const [email, setEmail] = useState(business.email || '');
  const [phone, setPhone] = useState(business.phone || '');
  const [address, setAddress] = useState(business.address || '');
  const [city, setCity] = useState(business.city || '');
  const [country, setCountry] = useState(business.country || '');
  const [taxId, setTaxId] = useState(business.tax_id || '');
  const [currency, setCurrency] = useState(business.default_currency || 'USD');
  const [paymentTerms, setPaymentTerms] = useState(business.payment_terms || 'Payment due within 14 days.');
  const [bankDetails, setBankDetails] = useState(business.bank_details || '');
  const [logoUrl, setLogoUrl] = useState(business.logo_url || '');

  const [isCopiedEmail, setIsCopiedEmail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateBusiness({
      name,
      email,
      phone,
      address,
      city,
      country,
      tax_id: taxId,
      default_currency: currency,
      payment_terms: paymentTerms,
      bank_details: bankDetails,
      logo_url: logoUrl,
    });
    setIsSaving(false);
    showToast('Business profile settings saved!', 'success');
  };

  const copySupportEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setIsCopiedEmail(true);
    showToast(`Copied ${SUPPORT_EMAIL} to clipboard!`, 'success');
    setTimeout(() => setIsCopiedEmail(false), 2000);
  };

  const appearanceOptions: { id: ThemePreference; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
    {
      id: 'light',
      label: 'Light Mode',
      description: 'Clean, high-visibility light interface',
      icon: Sun,
    },
    {
      id: 'dark',
      label: 'Dark Mode',
      description: 'Eye-friendly low-light dark interface',
      icon: Moon,
    },
    {
      id: 'system',
      label: 'System Default',
      description: 'Automatically matches your device OS preference',
      icon: Monitor,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto text-slate-800 dark:text-slate-100 transition-colors">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Business Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage appearance, invoice branding, tax details, currency, and payment terms</p>
        </div>
      </div>

      {/* Appearance Settings Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xs transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-800 shadow-2xs">
              <Sun className="w-4 h-4 hidden dark:block" />
              <Moon className="w-4 h-4 block dark:hidden" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                Appearance Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Choose your preferred visual theme across the application</p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg capitalize border border-slate-200 dark:border-slate-700">
            Active: {theme === 'system' ? `System (${resolvedTheme})` : theme}
          </span>
        </div>

        {/* Radio Card Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {appearanceOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => {
                  setTheme(opt.id);
                  showToast(`Switched appearance to ${opt.label}`, 'info');
                }}
                className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl ${isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {/* Radio Indicator */}
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-blue-600' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">{opt.label}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{opt.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Identity & Logo */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs transition-colors">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Business Profile & Information</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Business / Studio Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Billing Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tax ID / VAT Number</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="GB 123 4567 89 or US EIN"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Company Logo Image URL</label>
            <div className="flex gap-3 items-center">
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
              {logoUrl && (
                <div className="w-11 h-11 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Currency & Wire Payment Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs transition-colors">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Invoice Defaults & Wire Instructions</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Default Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Standard Payment Terms</label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bank Wire / Payment Instructions</label>
            <textarea
              rows={3}
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              placeholder="Bank Name, Routing Number, Account Number, SWIFT/BIC code"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* User Complaint / Support Contact Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-2xs shrink-0">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Need help?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Report a problem or contact our support team.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copySupportEmail}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              {isCopiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{isCopiedEmail ? 'Email Copied' : 'Copy Email'}</span>
            </button>
            <button
              type="button"
              onClick={() => openSupportModal('Other')}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Support</span>
            </button>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Support Desk:</span>
            <span className="font-mono text-blue-600 dark:text-blue-400 font-bold select-all">{SUPPORT_EMAIL}</span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">Guaranteed response within 24 hours</span>
        </div>
      </div>
    </div>
  );
};
export default SettingsPage;
