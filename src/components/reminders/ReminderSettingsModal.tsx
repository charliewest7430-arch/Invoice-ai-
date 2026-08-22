import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Bell,
  Clock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  Sliders,
  History,
  Loader2,
} from 'lucide-react';

interface ReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReminderSettingsModal: React.FC<ReminderSettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    reminderSettings,
    updateReminderSettings,
    reminderLogs,
    triggerRemindersProcess,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'rules' | 'logs'>('rules');
  const [enabled, setEnabled] = useState(reminderSettings.enabled);
  const [firstDays, setFirstDays] = useState(reminderSettings.first_reminder_days);
  const [secondDays, setSecondDays] = useState(reminderSettings.second_reminder_days);
  const [finalDays, setFinalDays] = useState(reminderSettings.final_reminder_days);
  const [maxReminders, setMaxReminders] = useState(reminderSettings.max_reminders);
  const [customMessage, setCustomMessage] = useState(reminderSettings.custom_message);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateReminderSettings({
        enabled,
        first_reminder_days: Number(firstDays),
        second_reminder_days: Number(secondDays),
        final_reminder_days: Number(finalDays),
        max_reminders: Number(maxReminders),
        custom_message: customMessage,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunNow = async () => {
    setIsProcessing(true);
    try {
      const res = await triggerRemindersProcess();
      showToast(`Checked invoices: ${res.remindersSent} reminder(s) dispatched`, 'success');
    } catch (e) {
      showToast('Error executing reminder check', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Automated Overdue Payment Reminders
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Server-scheduled automated notifications for late invoices
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-2 gap-4 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Reminder Rules</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Sent Reminders Log ({reminderLogs.length})</span>
          </button>
        </div>

        {/* Tab 1: Rules & Configuration */}
        {activeTab === 'rules' && (
          <form onSubmit={handleSave} className="p-6 space-y-5">
            {/* Master Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  Automated Overdue Email Reminders
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Automatically send professional payment reminder emails when invoices pass their due date
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Intervals Grid */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Reminder Schedules (Days After Due Date)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 block">
                    1st Reminder (Gentle)
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={firstDays}
                      onChange={(e) => setFirstDays(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <span className="text-xs text-slate-400">days</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 block">
                    2nd Reminder (Urgent)
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="2"
                      max="60"
                      value={secondDays}
                      onChange={(e) => setSecondDays(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <span className="text-xs text-slate-400">days</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 block">
                    Final Notice (Critical)
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="3"
                      max="90"
                      value={finalDays}
                      onChange={(e) => setFinalDays(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <span className="text-xs text-slate-400">days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Custom Body Note (Included in Reminder Emails)
              </label>
              <textarea
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="e.g. Please settle this balance as soon as possible to keep your account in good standing."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Manual Run Test Action */}
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-purple-900 dark:text-purple-300 block">
                  Run Overdue Check Now
                </span>
                <span className="text-[11px] text-purple-700 dark:text-purple-400">
                  Scans all overdue invoices and dispatches scheduled email reminders immediately.
                </span>
              </div>
              <button
                type="button"
                onClick={handleRunNow}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                <span>Check & Send Now</span>
              </button>
            </div>

            {/* Footer buttons */}
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
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Save Reminder Rules</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Reminder Logs */}
        {activeTab === 'logs' && (
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {reminderLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs sm:text-sm font-medium">No reminder emails sent yet.</p>
                <p className="text-[11px] text-slate-500">
                  When overdue reminders are dispatched by the cron engine or sent manually, they will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {reminderLogs.map((log) => (
                  <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold uppercase ${
                          log.reminder_stage === 'final'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                            : log.reminder_stage === 'second'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {log.reminder_stage ? log.reminder_stage[0] : 'R'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {log.recipient_email}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {log.days_overdue} days overdue • Stage: {log.reminder_stage || 'Overdue'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase">
                        {log.status}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(log.sent_at).toLocaleDateString()} {new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
