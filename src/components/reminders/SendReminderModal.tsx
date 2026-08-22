import React, { useState } from 'react';
import { Invoice } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Mail,
  Send,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  DollarSign,
  Loader2,
} from 'lucide-react';

interface SendReminderModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SendReminderModal: React.FC<SendReminderModalProps> = ({ invoice, isOpen, onClose }) => {
  const { business, reminderSettings, sendManualReminder, showToast } = useApp();
  const [customMessage, setCustomMessage] = useState(
    reminderSettings.custom_message || 'Please settle this pending invoice at your earliest convenience.'
  );
  const [isSending, setIsSending] = useState(false);

  if (!isOpen || !invoice) return null;

  const today = new Date();
  const dueDate = new Date(invoice.due_date);
  const isOverdue = today.getTime() > dueDate.getTime();
  const diffDays = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
  const clientEmail = invoice.client?.email || '';

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientEmail) {
      showToast('Client email is missing. Please add an email to the client record.', 'error');
      return;
    }

    setIsSending(true);
    try {
      const res = await sendManualReminder(invoice.id, customMessage);
      if (res.success) {
        onClose();
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Send Overdue Payment Reminder
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Invoice {invoice.number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSend} className="p-6 space-y-5">
          {/* Invoice Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Recipient:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {invoice.client?.name || 'Client'} ({clientEmail || 'No email configured'})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Outstanding Balance:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {invoice.currency} {invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Due Date:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {new Date(invoice.due_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Overdue Status:</span>
              <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase ${
                diffDays > 0
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
              }`}>
                {diffDays > 0 ? `${diffDays} days overdue` : 'Payment due today/soon'}
              </span>
            </div>
          </div>

          {/* Email Preview Section */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Personalized Note for the Client
            </label>
            <textarea
              rows={4}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add any specific payment instructions, bank transfer references, or notes..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Warning if no client email */}
          {!clientEmail && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                This client has no email address. Please edit the client profile in the Clients page before sending.
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || !clientEmail}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Send Overdue Reminder</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
