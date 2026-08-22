import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RecurringInvoice, PLAN_LIMITS } from '../types';
import { RecurringInvoiceModal } from '../components/recurring/RecurringInvoiceModal';
import {
  Repeat,
  Plus,
  Search,
  Edit2,
  Trash2,
  Play,
  Pause,
  Clock,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowUpRight,
  Sparkles,
  Loader2,
} from 'lucide-react';

export const RecurringInvoicesPage: React.FC = () => {
  const {
    recurringInvoices,
    updateRecurringInvoice,
    deleteRecurringInvoice,
    createInvoice,
    triggerRecurringProcess,
    subscription,
    openUpgradeModal,
    business,
    showToast,
    setActivePage,
    setSelectedInvoiceId,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringInvoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessingEngine, setIsProcessingEngine] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const currentPlan = subscription.plan;
  const isFeatureAllowed = PLAN_LIMITS[currentPlan].canUseRecurringInvoices;
  const maxRecurring = PLAN_LIMITS[currentPlan].maxRecurringInvoices;
  const isLimitReached = recurringInvoices.length >= maxRecurring;

  // Filter list
  const filteredProfiles = recurringInvoices.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      (r.client?.name || '').toLowerCase().includes(q) ||
      r.frequency.toLowerCase().includes(q) ||
      (r.notes || '').toLowerCase().includes(q)
    );
  });

  const totalMonthlyRecurringRevenue = recurringInvoices
    .filter((r) => r.status === 'active')
    .reduce((sum, r) => {
      let multiplier = 1;
      if (r.frequency === 'weekly') multiplier = 4.33;
      else if (r.frequency === 'biweekly') multiplier = 2.16;
      else if (r.frequency === 'quarterly') multiplier = 1 / 3;
      else if (r.frequency === 'yearly') multiplier = 1 / 12;
      return sum + (r.total || 0) * multiplier;
    }, 0);

  const handleOpenAdd = () => {
    if (!isFeatureAllowed) {
      openUpgradeModal('pro');
      return;
    }
    if (isLimitReached) {
      openUpgradeModal('enterprise');
      return;
    }
    setSelectedRecurring(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: RecurringInvoice) => {
    setSelectedRecurring(rec);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (rec: RecurringInvoice) => {
    const nextStatus = rec.status === 'active' ? 'paused' : 'active';
    await updateRecurringInvoice(rec.id, { status: nextStatus });
  };

  const handleDelete = async (id: string, clientName: string) => {
    if (window.confirm(`Are you sure you want to delete the recurring schedule for ${clientName}?`)) {
      await deleteRecurringInvoice(id);
    }
  };

  const handleGenerateNow = async (rec: RecurringInvoice) => {
    setGeneratingId(rec.id);
    try {
      const today = new Date();
      const issueDateStr = today.toISOString().split('T')[0];
      const dueDateObj = new Date(today);
      dueDateObj.setDate(dueDateObj.getDate() + 14);
      const dueDateStr = dueDateObj.toISOString().split('T')[0];

      // Calculate next issue date after this one
      const nextDate = new Date(rec.next_invoice_date || new Date().toISOString());
      if (rec.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      else if (rec.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (rec.frequency === 'quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
      else if (rec.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

      // Create invoice
      const invoiceNumber = `${business.invoice_prefix || 'INV-'}${business.next_invoice_number || Math.floor(1000 + Math.random() * 9000)}`;
      const res = await createInvoice({
        client_id: rec.client_id,
        number: invoiceNumber,
        status: rec.send_email_on_creation ? 'sent' : 'draft',
        issue_date: issueDateStr,
        due_date: dueDateStr,
        currency: rec.currency,
        subtotal: rec.subtotal,
        tax_rate: rec.tax_rate,
        tax_amount: rec.tax_amount,
        discount: rec.discount,
        total: rec.total,
        notes: rec.notes || 'Recurring billing cycle invoice',
        terms: rec.terms || 'Due on receipt',
        template: 'modern',
        items: (rec.items || []).map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unit_price,
          amount: it.amount,
        })),
      });

      if (res.success && res.invoice) {
        // Update next issue date on profile
        await updateRecurringInvoice(rec.id, {
          next_invoice_date: nextDate.toISOString().split('T')[0],
          last_generated_date: new Date().toISOString(),
        });

        showToast(`Invoice ${res.invoice.number} generated for ${rec.client?.name || 'Client'}!`, 'success');
        setSelectedInvoiceId(res.invoice.id);
        setActivePage('invoice_detail');
      }
    } finally {
      setGeneratingId(null);
    }
  };

  const handleRunEngine = async () => {
    setIsProcessingEngine(true);
    try {
      await triggerRecurringProcess();
    } finally {
      setIsProcessingEngine(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Recurring Invoices & Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Set up automated periodic billing schedules for repeat clients, retainers, and subscriptions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunEngine}
            disabled={isProcessingEngine}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessingEngine ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <Play className="w-4 h-4 text-emerald-600" />
            )}
            <span>Process Schedules Now</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Recurring Schedule</span>
          </button>
        </div>
      </div>

      {/* Plan Gate Banner if on Free */}
      {!isFeatureAllowed && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-purple-900/40 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Recurring Invoices is a Pro & Enterprise Feature
              </h3>
              <p className="text-xs text-slate-300">
                Automate regular retainer invoices, subscription billing cycles, and automatic client emailing.
              </p>
            </div>
          </div>
          <button
            onClick={() => openUpgradeModal('pro')}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-bold rounded-xl transition-all shadow-md self-start sm:self-auto cursor-pointer"
          >
            Upgrade to Pro ($29/mo)
          </button>
        </div>
      )}

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Schedules
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {recurringInvoices.filter((r) => r.status === 'active').length}{' '}
              <span className="text-xs text-slate-400 font-normal">
                / {recurringInvoices.length} total
              </span>
            </p>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
              Automated billing running
            </span>
          </div>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/50 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Repeat className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Est. Monthly Recurring (MRR)
            </span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {business.default_currency || 'USD'} {totalMonthlyRecurringRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Normalized monthly run-rate
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Plan Capacity
            </span>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">
              {recurringInvoices.length} / {maxRecurring >= 9999 ? '∞' : maxRecurring}
            </p>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1 block">
              {currentPlan.toUpperCase()} plan allowance
            </span>
          </div>
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/50 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Profiles Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search recurring schedules by client, frequency, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-4">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Repeat className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No recurring invoice schedules found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                {searchQuery
                  ? 'No schedules matched your search filter.'
                  : 'Automate repetitive invoices for retainers, web hosting, monthly maintenance, or weekly billing.'}
              </p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Recurring Schedule</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-5 py-3.5">Frequency</th>
                  <th className="px-5 py-3.5">Next Issue Date</th>
                  <th className="px-5 py-3.5">Auto-Send Email</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Cycle Amount</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProfiles.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {rec.client?.name || 'Client'}
                      </div>
                      {rec.client?.company && (
                        <div className="text-xs text-slate-400">{rec.client.company}</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                        {rec.frequency}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(rec.next_issue_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                          rec.auto_send
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {rec.auto_send ? 'Enabled (Auto)' : 'Manual Draft'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleStatus(rec)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase cursor-pointer transition-colors ${
                          rec.status === 'active'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {rec.status === 'active' ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </>
                        ) : (
                          <>
                            <Pause className="w-3 h-3" />
                            Paused
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-900 dark:text-white">
                      {rec.currency || business.default_currency || 'USD'} {rec.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleGenerateNow(rec)}
                          disabled={generatingId === rec.id}
                          title="Generate & Issue Next Invoice Now"
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {generatingId === rec.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">Issue Now</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(rec)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Edit Schedule"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(rec.id, rec.client?.name || 'Client')}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Delete Schedule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <RecurringInvoiceModal
        recurringInvoice={selectedRecurring}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRecurring(null);
        }}
      />
    </div>
  );
};
