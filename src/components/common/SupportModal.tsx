import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  LifeBuoy,
  X,
  Mail,
  Send,
  Copy,
  Check,
  Bug,
  CreditCard,
  FileText,
  User,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export const SUPPORT_EMAIL = 'visionaryhands.studio@gmail.com';

export type SupportCategory =
  | 'Bug'
  | 'Payment problem'
  | 'Invoice problem'
  | 'Account problem'
  | 'Feature request'
  | 'Other';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: SupportCategory;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'Bug',
}) => {
  const { user, profile } = useAuth();
  const { business, showToast } = useApp();

  const [category, setCategory] = useState<SupportCategory>(initialCategory);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isCopiedEmail, setIsCopiedEmail] = useState(false);

  if (!isOpen) return null;

  const categories: { id: SupportCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'Bug', label: 'Bug Report', icon: Bug },
    { id: 'Payment problem', label: 'Payment Problem', icon: CreditCard },
    { id: 'Invoice problem', label: 'Invoice Issue', icon: FileText },
    { id: 'Account problem', label: 'Account Problem', icon: User },
    { id: 'Feature request', label: 'Feature Request', icon: Sparkles },
    { id: 'Other', label: 'Other Inquiries', icon: HelpCircle },
  ];

  const buildMailtoUrl = () => {
    const emailSubject = subject.trim()
      ? `InvoiceFlow Support - [${category}]: ${subject.trim()}`
      : `InvoiceFlow Support - [${category}]`;

    const userEmail = profile?.email || user?.email || 'N/A';
    const userName = profile?.full_name || 'Valued User';
    const bizName = business?.name || 'N/A';

    const bodyText = `${message.trim() || 'Please describe your inquiry or issue here...'}\n\n---\nUser Context:\n• Name: ${userName}\n• Email: ${userEmail}\n• Business: ${bizName}\n• App: InvoiceFlow AI`;

    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(bodyText)}`;
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast('Please provide a brief message describing your issue.', 'error');
      return;
    }

    const mailtoUrl = buildMailtoUrl();
    window.location.href = mailtoUrl;
    showToast('Opening your email client to send message...', 'info');
    onClose();
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setIsCopiedEmail(true);
    showToast(`Copied ${SUPPORT_EMAIL} to clipboard!`, 'success');
    setTimeout(() => setIsCopiedEmail(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-slide-up text-slate-800 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-800 shadow-2xs">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Contact Support</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Report a problem or request assistance from our support team</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Support Direct Email Banner */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] text-slate-400 dark:text-slate-400 block font-medium">Direct Support Email:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate select-all">{SUPPORT_EMAIL}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyEmail}
            className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-600 shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            {isCopiedEmail ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
            <span>{isCopiedEmail ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Support Form */}
        <form onSubmit={handleSendEmail} className="space-y-4">
          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer text-xs font-bold ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                    <span className="truncate">{cat.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your inquiry..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Message */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Message / Details *</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what happened or what you need assistance with in detail..."
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Email</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
